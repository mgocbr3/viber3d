import { World } from 'koota';
import { IsBuilding, Building, BuildTimer, Health, ResourceProducer, GameResources } from '../traits';
import { BUILDINGS, BuildingState } from '../config';

/** Update construction/upgrade timers */
export function updateBuildTimers(world: World) {
	const now = Date.now() / 1000;

	// Update timers and complete construction
	world.query(IsBuilding, Building, BuildTimer, Health).updateEach(
		([building, timer, health], entity) => {
			const elapsed = now - timer.startTime;
			if (elapsed >= timer.duration) {
				if (timer.isUpgrade) {
					building.level += 1;
				}
				building.state = BuildingState.ACTIVE;

				const def = BUILDINGS[building.buildingId];
				if (def) {
					const levelDef = def.levels[building.level - 1];
					if (levelDef) {
						health.max = levelDef.hp;
						health.current = levelDef.hp;
					}
				}
				entity.remove(BuildTimer);
			}
		}
	);
}

/** Update resource production */
export function updateResourceProduction(world: World) {
	const now = Date.now() / 1000;
	const resources = world.get(GameResources);
	if (!resources) return;

	world.query(IsBuilding, Building, ResourceProducer).updateEach(([building, producer]) => {
		if (building.state !== BuildingState.ACTIVE) return;

		const elapsed = now - producer.lastCollectTime;
		const produced = elapsed * producer.productionRate;
		producer.stored = Math.min(producer.stored + produced, producer.storageCapacity);
		producer.lastCollectTime = now;
	});
}

/** Collect resources from a producer building */
export function collectResources(world: World, entityId: number): boolean {
	const resources = world.get(GameResources);
	if (!resources) return false;

	let collected = false;

	world.query(IsBuilding, Building, ResourceProducer).updateEach(([_building, producer], entity) => {
		if (entity.id() !== entityId) return;
		if (producer.stored <= 0) return;

		const amount = Math.floor(producer.stored);
		if (producer.resourceType === 'gold') {
			resources.gold = Math.min(resources.gold + amount, resources.maxGold);
		} else if (producer.resourceType === 'elixir') {
			resources.elixir = Math.min(resources.elixir + amount, resources.maxElixir);
		}
		producer.stored = 0;
		collected = true;
	});

	return collected;
}

/** Calculate max storage from all storage buildings */
export function recalculateMaxStorage(world: World) {
	let maxGold = 1500;
	let maxElixir = 1500;

	world.query(IsBuilding, Building).updateEach(([building]) => {
		if (building.state !== BuildingState.ACTIVE) return;
		const def = BUILDINGS[building.buildingId];
		if (!def) return;
		const levelDef = def.levels[building.level - 1];
		if (!levelDef) return;

		if (building.buildingId === 'goldstorage' && levelDef.storageCapacity) {
			maxGold += levelDef.storageCapacity;
		}
		if (building.buildingId === 'elixirstorage' && levelDef.storageCapacity) {
			maxElixir += levelDef.storageCapacity;
		}
	});

	const resources = world.get(GameResources);
	if (resources) {
		resources.maxGold = maxGold;
		resources.maxElixir = maxElixir;
	}
}
