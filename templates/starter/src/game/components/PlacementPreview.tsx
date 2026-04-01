import * as THREE from 'three';
import { BUILDINGS, COLORS, GRID } from '../config';
import { useGameStore } from '../store';

/** Shows a transparent preview of a building being placed */
export function PlacementPreview() {
	const placementMode = useGameStore((s) => s.placementMode);
	const buildingType = useGameStore((s) => s.selectedBuildingType);
	const placementX = useGameStore((s) => s.placementX);
	const placementY = useGameStore((s) => s.placementY);
	const placementValid = useGameStore((s) => s.placementValid);

	if (!placementMode || !buildingType) return null;

	const def = BUILDINGS[buildingType];
	if (!def) return null;

	// Convert grid to world
	const centerX = placementX + def.width / 2;
	const centerY = placementY + def.height / 2;
	const wx = (centerX - GRID.SIZE / 2) * GRID.TILE_SIZE;
	const wz = (centerY - GRID.SIZE / 2) * GRID.TILE_SIZE;

	const color = placementValid ? COLORS.validPlacement : COLORS.invalidPlacement;

	return (
		<group position={[wx, 0, wz]}>
			{/* Building preview */}
			<mesh position={[0, 0.5, 0]}>
				<boxGeometry args={[def.width * 0.8, 1, def.height * 0.8]} />
				<meshStandardMaterial color={color} transparent opacity={0.5} />
			</mesh>
			{/* Grid highlight */}
			<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[def.width, def.height]} />
				<meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
			</mesh>
		</group>
	);
}
