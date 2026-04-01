import { World } from 'koota';
import { IsBuilding, Building, GameResources, ArmyState } from './traits';
import { BuildingState, STARTING_RESOURCES } from './config';

const SAVE_KEY = 'clash-clone-save';

interface SaveData {
	version: number;
	timestamp: number;
	resources: {
		gold: number;
		elixir: number;
		gems: number;
	};
	buildings: {
		buildingId: string;
		gridX: number;
		gridY: number;
		level: number;
		state: BuildingState;
	}[];
	army: {
		trainedTroops: Record<string, number>;
	};
}

export function saveGame(world: World): void {
	const resources = world.get(GameResources);
	if (!resources) return;

	const buildings: SaveData['buildings'] = [];
	world.query(IsBuilding, Building).updateEach(([building]) => {
		buildings.push({
			buildingId: building.buildingId,
			gridX: building.gridX,
			gridY: building.gridY,
			level: building.level,
			state: building.state === BuildingState.CONSTRUCTING ? BuildingState.ACTIVE : building.state,
		});
	});

	const armyState = world.get(ArmyState);
	const trainedTroops: Record<string, number> = {};
	if (armyState) {
		armyState.trainedTroops.forEach((count, id) => {
			trainedTroops[id] = count;
		});
	}

	const save: SaveData = {
		version: 1,
		timestamp: Date.now(),
		resources: {
			gold: resources.gold,
			elixir: resources.elixir,
			gems: resources.gems,
		},
		buildings,
		army: { trainedTroops },
	};

	try {
		localStorage.setItem(SAVE_KEY, JSON.stringify(save));
	} catch {
		console.warn('Failed to save game');
	}
}

export function loadGame(): SaveData | null {
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return null;
		const save: SaveData = JSON.parse(raw);
		if (save.version !== 1) return null;
		return save;
	} catch {
		return null;
	}
}

export function hasSave(): boolean {
	return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
	localStorage.removeItem(SAVE_KEY);
}

/** Get default starting layout */
export function getDefaultLayout(): SaveData {
	return {
		version: 1,
		timestamp: Date.now(),
		resources: { ...STARTING_RESOURCES },
		buildings: [
			{ buildingId: 'townhall', gridX: 20, gridY: 20, level: 1, state: BuildingState.ACTIVE },
			{ buildingId: 'goldmine', gridX: 15, gridY: 18, level: 1, state: BuildingState.ACTIVE },
			{ buildingId: 'elixircollector', gridX: 25, gridY: 18, level: 1, state: BuildingState.ACTIVE },
			{ buildingId: 'goldstorage', gridX: 15, gridY: 22, level: 1, state: BuildingState.ACTIVE },
			{ buildingId: 'elixirstorage', gridX: 25, gridY: 22, level: 1, state: BuildingState.ACTIVE },
			{ buildingId: 'barracks', gridX: 18, gridY: 25, level: 1, state: BuildingState.ACTIVE },
			{ buildingId: 'armycamp', gridX: 24, gridY: 25, level: 1, state: BuildingState.ACTIVE },
			{ buildingId: 'cannon', gridX: 18, gridY: 15, level: 1, state: BuildingState.ACTIVE },
			{ buildingId: 'archertower', gridX: 24, gridY: 15, level: 1, state: BuildingState.ACTIVE },
		],
		army: { trainedTroops: { barbarian: 5, archer: 5 } },
	};
}
