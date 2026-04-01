import { useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useWorld, useActions } from 'koota/react';
import { gameActions } from './actions';
import { useGameStore } from './store';
import {
	GameResources, GameState, GridMap, ArmyState,
	IsBuilding, Building, Health, BuildTimer,
	IsTroop,
} from './traits';
import {
	BUILDINGS, TROOPS, BuildingState, BattlePhase, BATTLE,
} from './config';
// grid utilities used internally by systems
import { updateBuildTimers, updateResourceProduction, collectResources, recalculateMaxStorage } from './systems/building-system';
import { updateDefenseTargeting, updateTroopCombat, updateBattleState } from './systems/combat-system';
import { loadGame, saveGame, getDefaultLayout, hasSave } from './persistence';

/** Main game controller - handles game logic, ECS sync, and user actions */
export function GameController() {
	const world = useWorld();
	const { spawnBuilding, spawnCamera } = useActions(gameActions);
	const initializedRef = useRef(false);
	const saveTimerRef = useRef(0);

	const store = useGameStore;

	// Initialize game
	useEffect(() => {
		if (initializedRef.current) return;
		initializedRef.current = true;

		// Add world-level traits
		world.add(GameResources);
		world.add(GameState);
		world.add(GridMap);
		world.add(ArmyState);

		// Spawn camera
		spawnCamera([0, 25, 25]);

		// Load save or create default layout
		const save = hasSave() ? loadGame() : getDefaultLayout();
		if (save) {
			const resources = world.get(GameResources)!;
			resources.gold = save.resources.gold;
			resources.elixir = save.resources.elixir;
			resources.gems = save.resources.gems;

			const grid = world.get(GridMap)!;

			for (const b of save.buildings) {
				spawnBuilding(b.buildingId, b.gridX, b.gridY, b.level, b.state, grid.cells);
			}

			const army = world.get(ArmyState)!;
			if (save.army?.trainedTroops) {
				for (const [id, count] of Object.entries(save.army.trainedTroops)) {
					army.trainedTroops.set(id, count as number);
				}
			}

			recalculateMaxStorage(world);

			// Find town hall level
			world.query(IsBuilding, Building).updateEach(([building]) => {
				if (building.buildingId === 'townhall') {
					store.getState().setTownHallLevel(building.level);
				}
			});
		}
	}, [world, spawnBuilding, spawnCamera]);

	// Game loop
	useFrame((_, delta) => {
		const gameState = world.get(GameState);
		if (!gameState) return;

		updateBuildTimers(world);
		updateResourceProduction(world);

		if (gameState.battlePhase === BattlePhase.BATTLE) {
			updateDefenseTargeting(world);
			updateTroopCombat(world);
			updateBattleState(world);
		}

		// Sync ECS -> Zustand store
		const resources = world.get(GameResources);
		if (resources) {
			store.getState().setResources(
				resources.gold, resources.elixir, resources.gems,
				resources.maxGold, resources.maxElixir
			);
		}

		if (gameState.battlePhase !== BattlePhase.NONE) {
			store.getState().setBattleState(
				gameState.battlePhase,
				gameState.battleTimeRemaining,
				gameState.destructionPercentage,
				gameState.stars
			);
		}

		// Sync army state
		const army = world.get(ArmyState);
		if (army) {
			const troops: Record<string, number> = {};
			let total = 0;
			army.trainedTroops.forEach((count, id) => {
				const t = TROOPS[id];
				if (t) total += count * t.housingSpace;
				troops[id] = count;
			});
			store.getState().setTrainedTroops(troops, total, army.maxCapacity);
		}

		// Auto-save every 30 seconds
		saveTimerRef.current += delta;
		if (saveTimerRef.current >= 30 && gameState.battlePhase === BattlePhase.NONE) {
			saveTimerRef.current = 0;
			saveGame(world);
		}
	});

	return null;
}

/** Hook for game UI callbacks */
export function useGameCallbacks() {
	const world = useWorld();
	const { spawnBuilding } = useActions(gameActions);
	const store = useGameStore;

	const handleBuild = useCallback(() => {
		store.getState().toggleBuildMenu();
	}, []);

	const handleArmy = useCallback(() => {
		store.getState().toggleArmyMenu();
	}, []);

	const handleSelectBuilding = useCallback((buildingId: string) => {
		store.getState().setPlacementMode(buildingId);
	}, []);

	const handleConfirmPlacement = useCallback(() => {
		const state = store.getState();
		if (!state.placementMode || !state.placementValid) return;

		const buildingId = state.selectedBuildingType;
		const def = BUILDINGS[buildingId];
		if (!def) return;

		const level = def.levels[0];
		const resources = world.get(GameResources);
		if (!resources) return;

		if (resources.gold < level.costGold || resources.elixir < level.costElixir) return;

		resources.gold -= level.costGold;
		resources.elixir -= level.costElixir;

		const grid = world.get(GridMap);
		spawnBuilding(
			buildingId,
			state.placementX,
			state.placementY,
			1,
			BuildingState.CONSTRUCTING,
			grid?.cells
		);

		state.cancelPlacement();
		recalculateMaxStorage(world);
		saveGame(world);
	}, [world, spawnBuilding]);

	const handleCancelPlacement = useCallback(() => {
		store.getState().cancelPlacement();
	}, []);

	const handleTrain = useCallback((troopId: string) => {
		const def = TROOPS[troopId];
		if (!def) return;

		const resources = world.get(GameResources);
		const army = world.get(ArmyState);
		if (!resources || !army) return;

		const level = def.levels[0];
		if (resources.elixir < level.trainingCostElixir) return;

		let currentCapacity = 0;
		army.trainedTroops.forEach((count, id) => {
			const t = TROOPS[id];
			if (t) currentCapacity += count * t.housingSpace;
		});
		if (currentCapacity + def.housingSpace > army.maxCapacity) return;

		resources.elixir -= level.trainingCostElixir;
		army.trainedTroops.set(troopId, (army.trainedTroops.get(troopId) || 0) + 1);
	}, [world]);

	const handleUpgrade = useCallback(() => {
		const state = store.getState();
		const entityId = state.selectedEntityId;
		if (entityId < 0) return;

		world.query(IsBuilding, Building, Health).updateEach(([building, _health], entity) => {
			if (entity.id() !== entityId) return;
			if (building.state !== BuildingState.ACTIVE) return;

			const def = BUILDINGS[building.buildingId];
			if (!def || building.level >= def.maxLevel) return;

			const nextLevel = def.levels[building.level];
			const resources = world.get(GameResources);
			if (!resources) return;

			if (resources.gold < nextLevel.costGold || resources.elixir < nextLevel.costElixir) return;

			resources.gold -= nextLevel.costGold;
			resources.elixir -= nextLevel.costElixir;
			building.state = BuildingState.UPGRADING;

			entity.add(BuildTimer({
				startTime: Date.now() / 1000,
				duration: nextLevel.buildTime,
				isUpgrade: true,
			}));
		});

		store.getState().deselectEntity();
		saveGame(world);
	}, [world]);

	const handleCollect = useCallback(() => {
		const state = store.getState();
		if (state.selectedEntityId >= 0) {
			collectResources(world, state.selectedEntityId);
			store.getState().deselectEntity();
		}
	}, [world]);

	const handleBattle = useCallback(() => {
		const gameState = world.get(GameState);
		if (!gameState) return;

		gameState.battlePhase = BattlePhase.BATTLE;
		gameState.battleTimeRemaining = BATTLE.DURATION;
		gameState.destructionPercentage = 0;
		gameState.stars = 0;
		gameState.destroyedBuildingHp = 0;

		store.getState().setBattleState(BattlePhase.BATTLE, BATTLE.DURATION, 0, 0);
	}, [world]);

	const handleEndBattle = useCallback(() => {
		const gameState = world.get(GameState);
		if (!gameState) return;

		gameState.battlePhase = BattlePhase.NONE;

		// Destroy all troops
		world.query(IsTroop).updateEach(([], entity) => {
			entity.destroy();
		});

		// Restore buildings
		world.query(IsBuilding, Building, Health).updateEach(([building, health]) => {
			if (building.state === BuildingState.DESTROYED) {
				building.state = BuildingState.ACTIVE;
			}
			health.current = health.max;
		});

		store.getState().setBattleState(BattlePhase.NONE, 0, 0, 0);
		store.getState().setSelectedTroop('');
		saveGame(world);
	}, [world]);

	const handleDeployTroop = useCallback((_troopId: string) => {
		// Handled by scene click handler
	}, []);

	return {
		handleBuild,
		handleArmy,
		handleSelectBuilding,
		handleConfirmPlacement,
		handleCancelPlacement,
		handleTrain,
		handleUpgrade,
		handleCollect,
		handleBattle,
		handleEndBattle,
		handleDeployTroop,
		handleSceneClick: handleBattle, // placeholder
	};
}
