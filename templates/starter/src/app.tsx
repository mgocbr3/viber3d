import { Canvas } from '@react-three/fiber';
import { Color } from 'three';
import { GridRenderer } from './game/components/GridRenderer';
import { BuildingRenderer } from './game/components/BuildingRenderer';
import { TroopRenderer } from './game/components/TroopRenderer';
import { PlacementPreview } from './game/components/PlacementPreview';
import { IsometricCamera } from './game/components/IsometricCamera';
import { GameUI } from './game/components/GameUI';
import { GameController, useGameCallbacks } from './game/GameController';
import { GameLoop } from './frameloop';
import { useRef, useCallback } from 'react';
import { useGameStore } from './game/store';
import { BattlePhase, GRID } from './game/config';
import { useWorld, useActions } from 'koota/react';
import { GridMap, ArmyState } from './game/traits';
import { gameActions } from './game/actions';

function Scene() {
	const world = useWorld();
	const { spawnTroop } = useActions(gameActions);
	const store = useGameStore;

	// Get grid cells for camera raycasting
	const gridRef = useRef(new Int32Array(44 * 44).fill(-1));

	// Update grid ref from world
	const getGridCells = useCallback(() => {
		const grid = world.get(GridMap);
		if (grid) {
			gridRef.current = grid.cells;
		}
		return gridRef.current;
	}, [world]);

	const handleGroundClick = useCallback((e: any) => {
		const state = store.getState();
		if (state.battlePhase !== BattlePhase.BATTLE) return;
		if (!state.selectedTroopType) return;

		if (e.stopPropagation) e.stopPropagation();

		const army = world.get(ArmyState);
		if (!army) return;

		const troopId = state.selectedTroopType;
		const count = army.trainedTroops.get(troopId) || 0;
		if (count <= 0) return;

		if (e.point) {
			spawnTroop(troopId, e.point.x, e.point.z, 1);
			army.trainedTroops.set(troopId, count - 1);
			if (count - 1 <= 0) {
				army.trainedTroops.delete(troopId);
				store.getState().setSelectedTroop('');
			}
		}
	}, [world, spawnTroop]);

	return (
		<>
			<GameController />
			<GameLoop />
			<IsometricCamera gridCells={getGridCells()} />

			{/* Ground click plane for troop deployment */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.01, 0]}
				onClick={handleGroundClick}
				visible={false}
			>
				<planeGeometry args={[GRID.SIZE, GRID.SIZE]} />
				<meshBasicMaterial transparent opacity={0} />
			</mesh>

			<GridRenderer />
			<BuildingRenderer />
			<TroopRenderer />
			<PlacementPreview />

			{/* Lighting */}
			<ambientLight intensity={0.6} />
			<directionalLight
				position={[20, 30, 20]}
				intensity={1.5}
				castShadow
				shadow-mapSize-width={2048}
				shadow-mapSize-height={2048}
			/>
			<directionalLight position={[-10, 20, -10]} intensity={0.4} color="#b3d9ff" />
			<hemisphereLight
				args={['#87CEEB', '#4a8c3f', 0.3]}
			/>
		</>
	);
}

function UILayer() {
	const callbacks = useGameCallbacks();

	return (
		<GameUI
			onBuild={callbacks.handleBuild}
			onArmy={callbacks.handleArmy}
			onBattle={callbacks.handleBattle}
			onSelectBuilding={callbacks.handleSelectBuilding}
			onTrain={callbacks.handleTrain}
			onUpgrade={callbacks.handleUpgrade}
			onCollect={callbacks.handleCollect}
			onConfirmPlacement={callbacks.handleConfirmPlacement}
			onCancelPlacement={callbacks.handleCancelPlacement}
			onEndBattle={callbacks.handleEndBattle}
		/>
	);
}

export function App() {
	return (
		<div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
			<Canvas
				shadows
				gl={{ alpha: false, antialias: true }}
				style={{ width: '100%', height: '100%' }}
			>
				<color attach="background" args={[new Color('#87CEEB')]} />
				<fog attach="fog" args={['#87CEEB', 40, 100]} />
				<Scene />
			</Canvas>
			<UILayer />
		</div>
	);
}
