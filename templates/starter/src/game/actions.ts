import { createActions } from 'koota';
import * as THREE from 'three';
import { Transform } from '../traits';
import { IsCamera } from '../traits';
import {
	IsBuilding,
	IsTroop,
	IsDefense,
	IsResourceBuilding,
	IsWall,
	IsProjectile,
	Building,
	BuildTimer,
	Health,
	Defense,
	ResourceProducer,
	ResourceStorage,
	Troop,
	PathNode,
	Projectile,
	CameraControl,
} from './traits';
import { BUILDINGS, TROOPS, BuildingState, BuildingCategory } from './config';
import { buildingGridToWorld, occupyGrid } from './grid';

export const gameActions = createActions((world) => ({
	spawnCamera: (position: [number, number, number]) => {
		return world.spawn(
			Transform({ position: new THREE.Vector3(...position) }),
			IsCamera,
			CameraControl,
		);
	},

	spawnBuilding: (
		buildingId: string,
		gridX: number,
		gridY: number,
		level: number = 1,
		state: BuildingState = BuildingState.CONSTRUCTING,
		cells?: Int32Array,
	) => {
		const def = BUILDINGS[buildingId];
		if (!def) return null;

		const levelDef = def.levels[level - 1];
		if (!levelDef) return null;

		const [wx, wy, wz] = buildingGridToWorld(gridX, gridY, def.width, def.height);

		const entity = world.spawn(
			IsBuilding,
			Building({
				buildingId,
				level,
				state,
				category: def.category,
				gridX,
				gridY,
				width: def.width,
				height: def.height,
			}),
			Health({ current: levelDef.hp, max: levelDef.hp }),
			Transform({ position: new THREE.Vector3(wx, wy, wz) }),
		);

		// Add construction timer if needed
		if (state === BuildingState.CONSTRUCTING && levelDef.buildTime > 0) {
			entity.add(BuildTimer({
				startTime: Date.now() / 1000,
				duration: levelDef.buildTime,
				isUpgrade: false,
			}));
		} else if (state === BuildingState.CONSTRUCTING && levelDef.buildTime === 0) {
			entity.set(Building, { state: BuildingState.ACTIVE });
		}

		// Add category-specific traits
		if (def.category === BuildingCategory.DEFENSE && buildingId !== 'wall') {
			entity.add(IsDefense);
			entity.add(Defense({
				dps: levelDef.dps || 0,
				range: levelDef.range || 9,
				attackCooldown: 1,
				lastAttackTime: 0,
				targetEntity: -1,
			}));
		}

		if (buildingId === 'wall') {
			entity.add(IsWall);
		}

		if (def.category === BuildingCategory.RESOURCE) {
			entity.add(IsResourceBuilding);
			if (levelDef.productionRate) {
				entity.add(ResourceProducer({
					resourceType: levelDef.resourceType!,
					productionRate: levelDef.productionRate,
					stored: 0,
					storageCapacity: levelDef.storageCapacity || 500,
					lastCollectTime: Date.now() / 1000,
				}));
			}
			if (levelDef.storageCapacity && !levelDef.productionRate) {
				entity.add(ResourceStorage({
					resourceType: levelDef.resourceType!,
					capacity: levelDef.storageCapacity,
					stored: 0,
				}));
			}
		}

		// Occupy grid
		if (cells) {
			occupyGrid(cells, gridX, gridY, def.width, def.height, entity.id());
		}

		return entity;
	},

	spawnTroop: (
		troopId: string,
		worldX: number,
		worldZ: number,
		level: number = 1,
	) => {
		const def = TROOPS[troopId];
		if (!def) return null;

		const levelDef = def.levels[level - 1];
		if (!levelDef) return null;

		const entity = world.spawn(
			IsTroop,
			Troop({
				troopId,
				level,
				dps: levelDef.dps,
				attackRange: def.attackRange,
				moveSpeed: levelDef.moveSpeed,
				targetPriority: def.targetPriority,
				isRanged: def.isRanged,
				attackCooldown: 1,
				lastAttackTime: 0,
				targetEntity: -1,
			}),
			Health({ current: levelDef.hp, max: levelDef.hp }),
			Transform({
				position: new THREE.Vector3(worldX, 0, worldZ),
				scale: new THREE.Vector3(0.4, 0.4, 0.4),
			}),
			PathNode,
		);

		return entity;
	},

	spawnProjectile: (
		fromX: number, fromY: number, fromZ: number,
		damage: number,
		targetEntityId: number,
	) => {
		return world.spawn(
			IsProjectile,
			Projectile({ damage, targetEntity: targetEntityId, speed: 15 }),
			Transform({
				position: new THREE.Vector3(fromX, fromY + 1, fromZ),
				scale: new THREE.Vector3(0.15, 0.15, 0.15),
			}),
		);
	},
}));
