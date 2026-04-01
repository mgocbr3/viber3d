import { useQuery, useTrait } from 'koota/react';
import { Entity } from 'koota';
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Transform, Ref } from '../../traits';
import { IsTroop, Troop, Health } from '../traits';
import { COLORS } from '../config';
import { useFrame } from '@react-three/fiber';

function getTroopColor(troopId: string): string {
	switch (troopId) {
		case 'barbarian': return '#e8b84b';
		case 'archer': return '#e87bce';
		case 'giant': return '#d4823a';
		case 'wallbreaker': return '#6b8cce';
		default: return '#cccccc';
	}
}

function getTroopSize(troopId: string): [number, number, number] {
	switch (troopId) {
		case 'barbarian': return [0.35, 0.7, 0.35];
		case 'archer': return [0.3, 0.7, 0.3];
		case 'giant': return [0.6, 1.2, 0.6];
		case 'wallbreaker': return [0.4, 0.5, 0.4];
		default: return [0.35, 0.7, 0.35];
	}
}

function TroopView({ entity }: { entity: Entity }) {
	const transform = useTrait(entity, Transform);
	const troop = useTrait(entity, Troop);
	const health = useTrait(entity, Health);
	const groupRef = useRef<THREE.Group | null>(null);
	const meshRef = useRef<THREE.Mesh | null>(null);

	const setRef = useCallback(
		(group: THREE.Group | null) => {
			if (!group) return;
			groupRef.current = group;
			entity.add(Ref(group));
		},
		[entity]
	);

	// Simple bounce animation
	useFrame(({ clock }) => {
		if (meshRef.current && troop) {
			const bounce = Math.abs(Math.sin(clock.elapsedTime * 5 + entity.id())) * 0.1;
			meshRef.current.position.y = bounce;
		}
	});

	if (!transform || !troop || !health) return null;
	if (health.current <= 0) return null;

	const color = getTroopColor(troop.troopId);
	const [sx, sy, sz] = getTroopSize(troop.troopId);
	const hpRatio = health.current / health.max;

	return (
		<group
			ref={setRef}
			position={[transform.position.x, transform.position.y, transform.position.z]}
			rotation={[0, transform.rotation.y, 0]}
		>
			{/* Body */}
			<mesh ref={meshRef} position={[0, sy / 2, 0]} castShadow>
				{troop.troopId === 'giant' ? (
					<capsuleGeometry args={[sx, sy * 0.5, 8, 8]} />
				) : troop.troopId === 'wallbreaker' ? (
					<boxGeometry args={[sx * 1.5, sy, sz]} />
				) : (
					<capsuleGeometry args={[sx * 0.7, sy * 0.4, 4, 8]} />
				)}
				<meshStandardMaterial color={color} />
			</mesh>

			{/* Head */}
			{troop.troopId !== 'wallbreaker' && (
				<mesh position={[0, sy + 0.15, 0]}>
					<sphereGeometry args={[sx * 0.6, 8, 8]} />
					<meshStandardMaterial color={color} />
				</mesh>
			)}

			{/* Weapon indicators */}
			{troop.troopId === 'barbarian' && (
				<mesh position={[sx * 0.8, sy * 0.7, 0]} rotation={[0, 0, -0.3]}>
					<boxGeometry args={[0.08, 0.5, 0.04]} />
					<meshStandardMaterial color="#8B8B8B" />
				</mesh>
			)}
			{troop.troopId === 'archer' && (
				<mesh position={[sx * 0.7, sy * 0.5, 0]} rotation={[0, 0, -0.5]}>
					<boxGeometry args={[0.04, 0.6, 0.04]} />
					<meshStandardMaterial color="#8B4513" />
				</mesh>
			)}

			{/* Health bar */}
			{hpRatio < 1 && (
				<group position={[0, sy + 0.6, 0]}>
					<mesh>
						<planeGeometry args={[0.6, 0.08]} />
						<meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
					</mesh>
					<mesh position={[(hpRatio - 1) * 0.3, 0, 0.001]}>
						<planeGeometry args={[0.6 * hpRatio, 0.06]} />
						<meshBasicMaterial
							color={hpRatio > 0.5 ? COLORS.healthBarGreen : COLORS.healthBarRed}
							side={THREE.DoubleSide}
						/>
					</mesh>
				</group>
			)}
		</group>
	);
}

export function TroopRenderer() {
	const troops = useQuery(IsTroop, Transform);

	return (
		<>
			{troops.map((entity) => (
				<TroopView key={entity.id()} entity={entity} />
			))}
		</>
	);
}
