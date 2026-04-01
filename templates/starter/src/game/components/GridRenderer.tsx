import { useMemo } from 'react';
import * as THREE from 'three';
import { GRID, COLORS } from '../config';

/** Renders the 44x44 isometric tile grid as the ground plane */
export function GridRenderer() {
	const gridGeometry = useMemo(() => {
		const size = GRID.SIZE * GRID.TILE_SIZE;
		const geo = new THREE.PlaneGeometry(size, size, GRID.SIZE, GRID.SIZE);
		geo.rotateX(-Math.PI / 2);

		// Add subtle color variation to tiles
		const colors = new Float32Array(geo.attributes.position.count * 3);
		const pos = geo.attributes.position;

		for (let i = 0; i < pos.count; i++) {
			const x = pos.getX(i);
			const z = pos.getZ(i);
			const gridX = Math.floor((x / GRID.TILE_SIZE) + GRID.SIZE / 2);
			const gridY = Math.floor((z / GRID.TILE_SIZE) + GRID.SIZE / 2);
			const checker = (gridX + gridY) % 2 === 0;

			const color = new THREE.Color(checker ? COLORS.grass : COLORS.grassLight);
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}
		geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

		return geo;
	}, []);

	const gridLines = useMemo(() => {
		const points: THREE.Vector3[] = [];
		const halfSize = (GRID.SIZE * GRID.TILE_SIZE) / 2;

		// Horizontal lines
		for (let i = 0; i <= GRID.SIZE; i++) {
			const pos = -halfSize + i * GRID.TILE_SIZE;
			points.push(new THREE.Vector3(-halfSize, 0.01, pos));
			points.push(new THREE.Vector3(halfSize, 0.01, pos));
		}
		// Vertical lines
		for (let i = 0; i <= GRID.SIZE; i++) {
			const pos = -halfSize + i * GRID.TILE_SIZE;
			points.push(new THREE.Vector3(pos, 0.01, -halfSize));
			points.push(new THREE.Vector3(pos, 0.01, halfSize));
		}

		const geo = new THREE.BufferGeometry().setFromPoints(points);
		return geo;
	}, []);

	// Playable area border
	const borderPoints = useMemo(() => {
		const min = (GRID.PLAYABLE_MIN - GRID.SIZE / 2) * GRID.TILE_SIZE;
		const max = (GRID.PLAYABLE_MAX + 1 - GRID.SIZE / 2) * GRID.TILE_SIZE;
		return [
			new THREE.Vector3(min, 0.02, min),
			new THREE.Vector3(max, 0.02, min),
			new THREE.Vector3(max, 0.02, max),
			new THREE.Vector3(min, 0.02, max),
			new THREE.Vector3(min, 0.02, min),
		];
	}, []);

	return (
		<group>
			{/* Ground plane */}
			<mesh geometry={gridGeometry} receiveShadow>
				<meshStandardMaterial vertexColors side={THREE.DoubleSide} />
			</mesh>

			{/* Grid lines */}
			<lineSegments geometry={gridLines}>
				<lineBasicMaterial color={COLORS.gridLine} opacity={0.15} transparent />
			</lineSegments>

			{/* Playable border */}
			<line>
				<bufferGeometry>
					<bufferAttribute
						attach="attributes-position"
						count={borderPoints.length}
						array={new Float32Array(borderPoints.flatMap(p => [p.x, p.y, p.z]))}
						itemSize={3}
					/>
				</bufferGeometry>
				<lineBasicMaterial color="#ffffff" opacity={0.3} transparent linewidth={2} />
			</line>
		</group>
	);
}
