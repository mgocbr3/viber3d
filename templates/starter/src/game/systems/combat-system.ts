import { World, Entity } from 'koota';
import { Transform } from '../../traits';
import {
	IsBuilding, IsTroop, IsDefense, IsWall,
	Building, Health, Defense, Troop,
	GameState,
} from '../traits';
import { BuildingState, BattlePhase, TargetPriority, WALL_BREAKER_WALL_MULTIPLIER } from '../config';
import { Time } from '../../traits';

/** Defense buildings target and attack nearby troops */
export function updateDefenseTargeting(world: World) {
	const gameState = world.get(GameState);
	if (!gameState || gameState.battlePhase !== BattlePhase.BATTLE) return;

	const now = Date.now() / 1000;

	// Get all living troops
	const troops: { entity: Entity; x: number; z: number }[] = [];
	world.query(IsTroop, Troop, Transform, Health).updateEach(([_troop, transform, health], entity) => {
		if (health.current > 0) {
			troops.push({ entity, x: transform.position.x, z: transform.position.z });
		}
	});

	if (troops.length === 0) return;

	// Each defense finds nearest troop in range
	world.query(IsDefense, Building, Defense, Transform, Health).updateEach(
		([building, defense, transform, health]) => {
			if (building.state !== BuildingState.ACTIVE || health.current <= 0) return;

			let nearestDist = Infinity;
			let nearestTroop: typeof troops[0] | null = null;

			for (const troop of troops) {
				const dist = Math.sqrt(
					(troop.x - transform.position.x) ** 2 +
					(troop.z - transform.position.z) ** 2
				);
				if (dist <= defense.range && dist < nearestDist) {
					nearestDist = dist;
					nearestTroop = troop;
				}
			}

			if (nearestTroop && now - defense.lastAttackTime >= defense.attackCooldown) {
				defense.lastAttackTime = now;
				defense.targetEntity = nearestTroop.entity.id();

				const troopHealth = nearestTroop.entity.get(Health);
				if (troopHealth) {
					troopHealth.current -= defense.dps * defense.attackCooldown;
					if (troopHealth.current <= 0) {
						troopHealth.current = 0;
						nearestTroop.entity.destroy();
					}
				}
			}
		}
	);
}

/** Troops find targets and attack */
export function updateTroopCombat(world: World) {
	const gameState = world.get(GameState);
	if (!gameState || gameState.battlePhase !== BattlePhase.BATTLE) return;

	const now = Date.now() / 1000;
	const time = world.get(Time);
	const delta = time?.delta || 0.016;

	// Collect all buildings
	const buildings: {
		entity: Entity;
		x: number;
		z: number;
		isDefense: boolean;
		isWall: boolean;
		isResource: boolean;
		hp: number;
	}[] = [];

	world.query(IsBuilding, Building, Transform, Health).updateEach(
		([building, transform, health], entity) => {
			if (building.state === BuildingState.DESTROYED || health.current <= 0) return;
			buildings.push({
				entity,
				x: transform.position.x,
				z: transform.position.z,
				isDefense: entity.has(IsDefense),
				isWall: entity.has(IsWall),
				isResource: building.category === 'resource',
				hp: health.current,
			});
		}
	);

	if (buildings.length === 0) return;

	// Each troop finds target and attacks
	world.query(IsTroop, Troop, Transform, Health).updateEach(
		([troop, transform, health], entity) => {
			if (health.current <= 0) return;

			const target = findTarget(
				transform.position.x,
				transform.position.z,
				troop.targetPriority,
				buildings
			);

			if (!target) return;

			const dist = Math.sqrt(
				(target.x - transform.position.x) ** 2 +
				(target.z - transform.position.z) ** 2
			);

			if (dist <= troop.attackRange + 1) {
				// In range - attack
				if (now - troop.lastAttackTime >= troop.attackCooldown) {
					troop.lastAttackTime = now;
					troop.targetEntity = target.entity.id();

					const targetHealth = target.entity.get(Health);
					if (targetHealth) {
						let damage = troop.dps * troop.attackCooldown;
						if (troop.troopId === 'wallbreaker' && target.isWall) {
							damage *= WALL_BREAKER_WALL_MULTIPLIER;
						}
						targetHealth.current -= damage;
						if (targetHealth.current <= 0) {
							targetHealth.current = 0;
							const bldg = target.entity.get(Building);
							if (bldg) {
								bldg.state = BuildingState.DESTROYED;
							}
							if (troop.troopId === 'wallbreaker') {
								health.current = 0;
								entity.destroy();
							}
						}
					}
				}
			} else {
				// Move toward target
				const dx = target.x - transform.position.x;
				const dz = target.z - transform.position.z;
				const len = Math.sqrt(dx * dx + dz * dz);
				if (len > 0) {
					const speed = troop.moveSpeed * delta;
					transform.position.x += (dx / len) * speed;
					transform.position.z += (dz / len) * speed;
					transform.rotation.y = Math.atan2(dx, dz);
				}
			}
		}
	);
}

function findTarget(
	x: number, z: number,
	priority: TargetPriority,
	buildings: {
		entity: Entity; x: number; z: number;
		isDefense: boolean; isWall: boolean; isResource: boolean; hp: number;
	}[]
): typeof buildings[0] | null {
	let candidates = buildings;

	switch (priority) {
		case TargetPriority.DEFENSES: {
			const defenses = buildings.filter(b => b.isDefense);
			if (defenses.length > 0) candidates = defenses;
			break;
		}
		case TargetPriority.RESOURCES: {
			const resources = buildings.filter(b => b.isResource);
			if (resources.length > 0) candidates = resources;
			break;
		}
		case TargetPriority.WALLS: {
			const walls = buildings.filter(b => b.isWall);
			if (walls.length > 0) candidates = walls;
			break;
		}
		case TargetPriority.NEAREST:
		default: {
			const nonWalls = buildings.filter(b => !b.isWall);
			if (nonWalls.length > 0) candidates = nonWalls;
			break;
		}
	}

	let nearest: typeof buildings[0] | null = null;
	let nearestDist = Infinity;

	for (const b of candidates) {
		const dist = Math.sqrt((b.x - x) ** 2 + (b.z - z) ** 2);
		if (dist < nearestDist) {
			nearestDist = dist;
			nearest = b;
		}
	}

	return nearest;
}

/** Update battle state - destruction percentage and stars */
export function updateBattleState(world: World) {
	const gameState = world.get(GameState);
	if (!gameState || gameState.battlePhase !== BattlePhase.BATTLE) return;

	let totalHp = 0;
	let destroyedHp = 0;
	let townHallDestroyed = false;

	world.query(IsBuilding, Building, Health).updateEach(([building, health]) => {
		totalHp += health.max;
		const lost = health.max - Math.max(0, health.current);
		destroyedHp += lost;

		if (building.buildingId === 'townhall' && health.current <= 0) {
			townHallDestroyed = true;
		}
	});

	gameState.totalBuildingHp = totalHp;
	gameState.destroyedBuildingHp = destroyedHp;
	gameState.destructionPercentage = totalHp > 0 ? Math.floor((destroyedHp / totalHp) * 100) : 0;

	let stars = 0;
	if (townHallDestroyed) stars++;
	if (gameState.destructionPercentage >= 50) stars++;
	if (gameState.destructionPercentage >= 100) stars++;
	gameState.stars = stars;

	const time = world.get(Time);
	const delta = time?.delta || 0.016;
	gameState.battleTimeRemaining -= delta;

	const troopsAlive = world.query(IsTroop, Health).length;
	if (gameState.battleTimeRemaining <= 0 || gameState.destructionPercentage >= 100 || troopsAlive === 0) {
		gameState.battlePhase = BattlePhase.RESULTS;
	}
}
