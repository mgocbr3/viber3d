import { create } from 'zustand';
import { BuildingState, BattlePhase } from './config';

// ============================================
// GAME UI STORE (Zustand)
// ============================================

interface GameStore {
	// Resources (mirrored from ECS for UI reactivity)
	gold: number;
	elixir: number;
	gems: number;
	maxGold: number;
	maxElixir: number;

	// UI state
	selectedBuildingType: string;
	placementMode: boolean;
	placementX: number;
	placementY: number;
	placementValid: boolean;
	showBuildMenu: boolean;
	showArmyMenu: boolean;
	selectedEntityId: number;
	selectedBuildingInfo: {
		buildingId: string;
		level: number;
		state: BuildingState;
		hp: number;
		maxHp: number;
		stored?: number;
	} | null;

	// Battle
	battlePhase: BattlePhase;
	battleTimeRemaining: number;
	destructionPercentage: number;
	stars: number;
	selectedTroopType: string;
	trainedTroops: Record<string, number>;
	armyCapacity: number;
	maxArmyCapacity: number;

	// Town Hall level
	townHallLevel: number;

	// Actions
	setResources: (gold: number, elixir: number, gems: number, maxGold: number, maxElixir: number) => void;
	setPlacementMode: (buildingType: string) => void;
	cancelPlacement: () => void;
	setPlacementPosition: (x: number, y: number, valid: boolean) => void;
	toggleBuildMenu: () => void;
	toggleArmyMenu: () => void;
	selectEntity: (entityId: number, info: GameStore['selectedBuildingInfo']) => void;
	deselectEntity: () => void;
	setBattleState: (phase: BattlePhase, time: number, destruction: number, stars: number) => void;
	setSelectedTroop: (troopType: string) => void;
	setTrainedTroops: (troops: Record<string, number>, current: number, max: number) => void;
	setTownHallLevel: (level: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
	gold: 500,
	elixir: 500,
	gems: 50,
	maxGold: 1500,
	maxElixir: 1500,

	selectedBuildingType: '',
	placementMode: false,
	placementX: 0,
	placementY: 0,
	placementValid: false,
	showBuildMenu: false,
	showArmyMenu: false,
	selectedEntityId: -1,
	selectedBuildingInfo: null,

	battlePhase: BattlePhase.NONE,
	battleTimeRemaining: 180,
	destructionPercentage: 0,
	stars: 0,
	selectedTroopType: '',
	trainedTroops: {},
	armyCapacity: 0,
	maxArmyCapacity: 20,

	townHallLevel: 1,

	setResources: (gold, elixir, gems, maxGold, maxElixir) => set({ gold, elixir, gems, maxGold, maxElixir }),
	setPlacementMode: (buildingType) => set({
		selectedBuildingType: buildingType,
		placementMode: true,
		showBuildMenu: false,
		selectedEntityId: -1,
		selectedBuildingInfo: null,
	}),
	cancelPlacement: () => set({
		selectedBuildingType: '',
		placementMode: false,
		placementValid: false,
	}),
	setPlacementPosition: (x, y, valid) => set({ placementX: x, placementY: y, placementValid: valid }),
	toggleBuildMenu: () => set((s) => ({
		showBuildMenu: !s.showBuildMenu,
		showArmyMenu: false,
		selectedEntityId: -1,
		selectedBuildingInfo: null,
	})),
	toggleArmyMenu: () => set((s) => ({
		showArmyMenu: !s.showArmyMenu,
		showBuildMenu: false,
		selectedEntityId: -1,
		selectedBuildingInfo: null,
	})),
	selectEntity: (entityId, info) => set({
		selectedEntityId: entityId,
		selectedBuildingInfo: info,
		showBuildMenu: false,
		showArmyMenu: false,
		placementMode: false,
	}),
	deselectEntity: () => set({ selectedEntityId: -1, selectedBuildingInfo: null }),
	setBattleState: (phase, time, destruction, stars) => set({
		battlePhase: phase,
		battleTimeRemaining: time,
		destructionPercentage: destruction,
		stars,
	}),
	setSelectedTroop: (troopType) => set({ selectedTroopType: troopType }),
	setTrainedTroops: (troops, current, max) => set({
		trainedTroops: troops,
		armyCapacity: current,
		maxArmyCapacity: max,
	}),
	setTownHallLevel: (level) => set({ townHallLevel: level }),
}));
