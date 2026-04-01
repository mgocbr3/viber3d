import { useQuery, useTrait } from 'koota/react';
import { Entity } from 'koota';
import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { Transform, Ref } from '../../traits';
import { IsBuilding, Building, Health, BuildTimer, ResourceProducer } from '../traits';
import { BUILDINGS, BuildingState, COLORS } from '../config';
import { useGameStore } from '../store';

function getBuildingColor(buildingId: string): string {
	switch (buildingId) {
		case 'townhall': return COLORS.townhall;
		case 'wall': return COLORS.wall;
		case 'goldmine': case 'goldstorage': return COLORS.goldBuilding;
		case 'elixircollector': case 'elixirstorage': return COLORS.elixirBuilding;
		case 'cannon': case 'archertower': return COLORS.defenseBuilding;
		case 'barracks': case 'armycamp': return COLORS.armyBuilding;
		default: return '#888888';
	}
}

function getBuildingHeight(buildingId: string, level: number): number {
	switch (buildingId) {
		case 'townhall': return 1.8 + level * 0.3;
		case 'cannon': return 0.8 + level * 0.1;
		case 'archertower': return 2.0 + level * 0.2;
		case 'wall': return 1.0 + level * 0.2;
		case 'goldmine': return 1.0;
		case 'elixircollector': return 1.0;
		case 'goldstorage': return 1.2 + level * 0.1;
		case 'elixirstorage': return 1.2 + level * 0.1;
		case 'barracks': return 1.3;
		case 'armycamp': return 0.5;
		default: return 1.0;
	}
}

function HealthBar({ current, max, width }: { current: number; max: number; width: number }) {
	const ratio = Math.max(0, current / max);
	const color = ratio > 0.6 ? COLORS.healthBarGreen : ratio > 0.3 ? COLORS.healthBarYellow : COLORS.healthBarRed;

	return (
		<group position={[0, 0.1, 0]}>
			{/* Background */}
			<mesh>
				<planeGeometry args={[width, 0.15]} />
				<meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
			</mesh>
			{/* Fill */}
			<mesh position={[(ratio - 1) * width / 2, 0, 0.001]}>
				<planeGeometry args={[width * ratio, 0.12]} />
				<meshBasicMaterial color={color} side={THREE.DoubleSide} />
			</mesh>
		</group>
	);
}

function ConstructionIndicator({ progress }: { progress: number }) {
	return (
		<group position={[0, 0.3, 0]}>
			{/* Progress bar background */}
			<mesh>
				<planeGeometry args={[1.5, 0.2]} />
				<meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
			</mesh>
			{/* Progress fill */}
			<mesh position={[(progress - 1) * 0.75, 0, 0.001]}>
				<planeGeometry args={[1.5 * progress, 0.16]} />
				<meshBasicMaterial color={COLORS.constructing} side={THREE.DoubleSide} />
			</mesh>
		</group>
	);
}

function ResourceIndicator({ stored, capacity }: { stored: number; capacity: number }) {
	if (stored < 1) return null;
	const ratio = stored / capacity;
	return (
		<group position={[0, 0.25, 0]}>
			<mesh>
				<planeGeometry args={[0.8, 0.15]} />
				<meshBasicMaterial color="#333333" side={THREE.DoubleSide} />
			</mesh>
			<mesh position={[(ratio - 1) * 0.4, 0, 0.001]}>
				<planeGeometry args={[0.8 * ratio, 0.12]} />
				<meshBasicMaterial color="#ffdd00" side={THREE.DoubleSide} />
			</mesh>
		</group>
	);
}

function BuildingView({ entity }: { entity: Entity }) {
	const transform = useTrait(entity, Transform);
	const building = useTrait(entity, Building);
	const health = useTrait(entity, Health);
	const timer = useTrait(entity, BuildTimer);
	const producer = useTrait(entity, ResourceProducer);
	const selectEntity = useGameStore((s) => s.selectEntity);
	const battlePhase = useGameStore((s) => s.battlePhase);
	const groupRef = useRef<THREE.Group | null>(null);

	const setRef = useCallback(
		(group: THREE.Group | null) => {
			if (!group) return;
			groupRef.current = group;
			entity.add(Ref(group));
		},
		[entity]
	);

	if (!transform || !building || !health) return null;
	if (building.state === BuildingState.DESTROYED) return null;

	const def = BUILDINGS[building.buildingId];
	if (!def) return null;

	const color = getBuildingColor(building.buildingId);
	const height = getBuildingHeight(building.buildingId, building.level);
	const isConstructing = building.state === BuildingState.CONSTRUCTING;
	const isUpgrading = building.state === BuildingState.UPGRADING;

	let progress = 1;
	if (timer && (isConstructing || isUpgrading)) {
		const elapsed = Date.now() / 1000 - timer.startTime;
		progress = Math.min(1, elapsed / timer.duration);
	}

	const showHealthBar = battlePhase === 'battle' && health.current < health.max;
	const billboardY = height + 0.5;

	return (
		<group
			ref={setRef}
			position={[transform.position.x, transform.position.y, transform.position.z]}
			onClick={(e) => {
				e.stopPropagation();
				if (battlePhase !== 'none') return;
				selectEntity(entity.id(), {
					buildingId: building.buildingId,
					level: building.level,
					state: building.state,
					hp: health.current,
					maxHp: health.max,
					stored: producer?.stored,
				});
			}}
		>
			{/* Main building body */}
			{building.buildingId === 'wall' ? (
				<mesh position={[0, height / 2, 0]} castShadow>
					<boxGeometry args={[0.9, height, 0.9]} />
					<meshStandardMaterial
						color={color}
						opacity={isConstructing ? 0.5 : 1}
						transparent={isConstructing}
					/>
				</mesh>
			) : building.buildingId === 'archertower' ? (
				<group>
					{/* Tower base */}
					<mesh position={[0, 0.5, 0]} castShadow>
						<cylinderGeometry args={[0.8, 1.0, 1.0, 8]} />
						<meshStandardMaterial color={color} opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
					{/* Tower body */}
					<mesh position={[0, height / 2 + 0.2, 0]} castShadow>
						<cylinderGeometry args={[0.5, 0.7, height - 0.5, 8]} />
						<meshStandardMaterial color={color} opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
					{/* Top platform */}
					<mesh position={[0, height, 0]} castShadow>
						<cylinderGeometry args={[0.8, 0.5, 0.3, 8]} />
						<meshStandardMaterial color="#666666" opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
				</group>
			) : building.buildingId === 'cannon' ? (
				<group>
					{/* Base */}
					<mesh position={[0, 0.3, 0]} castShadow>
						<cylinderGeometry args={[1.0, 1.2, 0.6, 8]} />
						<meshStandardMaterial color="#555555" opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
					{/* Barrel */}
					<mesh position={[0, 0.6, 0.4]} rotation={[Math.PI / 6, 0, 0]} castShadow>
						<cylinderGeometry args={[0.2, 0.25, 1.2, 8]} />
						<meshStandardMaterial color="#333333" opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
				</group>
			) : building.buildingId === 'townhall' ? (
				<group>
					{/* Main body */}
					<mesh position={[0, height / 2, 0]} castShadow>
						<boxGeometry args={[def.width * 0.85, height, def.height * 0.85]} />
						<meshStandardMaterial color={color} opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
					{/* Roof */}
					<mesh position={[0, height + 0.3, 0]} castShadow>
						<coneGeometry args={[def.width * 0.6, 0.8, 4]} />
						<meshStandardMaterial color="#8B4513" opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
					{/* Level indicator */}
					<mesh position={[0, height + 0.9, 0]}>
						<sphereGeometry args={[0.2, 8, 8]} />
						<meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
					</mesh>
				</group>
			) : building.buildingId === 'armycamp' ? (
				<group>
					{/* Tent-like shape */}
					<mesh position={[0, 0.25, 0]} castShadow>
						<boxGeometry args={[def.width * 0.8, 0.5, def.height * 0.8]} />
						<meshStandardMaterial color="#8B7355" opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
					{/* Flag */}
					<mesh position={[0, 1.0, 0]}>
						<cylinderGeometry args={[0.03, 0.03, 1.5, 4]} />
						<meshStandardMaterial color="#654321" />
					</mesh>
					<mesh position={[0.3, 1.5, 0]}>
						<planeGeometry args={[0.6, 0.3]} />
						<meshStandardMaterial color="#cc0000" side={THREE.DoubleSide} />
					</mesh>
				</group>
			) : (
				<group>
					{/* Generic building */}
					<mesh position={[0, height / 2, 0]} castShadow>
						<boxGeometry args={[def.width * 0.8, height, def.height * 0.8]} />
						<meshStandardMaterial color={color} opacity={isConstructing ? 0.5 : 1} transparent={isConstructing} />
					</mesh>
					{/* Resource buildings get a top accent */}
					{(building.buildingId === 'goldmine' || building.buildingId === 'elixircollector') && (
						<mesh position={[0, height + 0.2, 0]}>
							<sphereGeometry args={[0.4, 8, 8]} />
							<meshStandardMaterial
								color={building.buildingId === 'goldmine' ? '#FFD700' : '#9B59B6'}
								emissive={building.buildingId === 'goldmine' ? '#FFD700' : '#9B59B6'}
								emissiveIntensity={0.3}
							/>
						</mesh>
					)}
				</group>
			)}

			{/* Billboard UI elements */}
			<group position={[0, billboardY, 0]}>
				{showHealthBar && (
					<HealthBar current={health.current} max={health.max} width={def.width * 0.7} />
				)}
				{(isConstructing || isUpgrading) && (
					<ConstructionIndicator progress={progress} />
				)}
				{producer && producer.stored > 0 && battlePhase === 'none' && (
					<ResourceIndicator stored={producer.stored} capacity={producer.storageCapacity} />
				)}
			</group>
		</group>
	);
}

export function BuildingRenderer() {
	const buildings = useQuery(IsBuilding, Building, Transform);

	return (
		<>
			{buildings.map((entity) => (
				<BuildingView key={entity.id()} entity={entity} />
			))}
		</>
	);
}
