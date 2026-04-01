// ============================================
// CLASH CLONE - Game Configuration
// ============================================

export const GRID = {
	SIZE: 44,
	TILE_SIZE: 1,
	// Playable area is centered, with some border
	PLAYABLE_MIN: 2,
	PLAYABLE_MAX: 41,
} as const;

// Resource types
export enum ResourceType {
	GOLD = 'gold',
	ELIXIR = 'elixir',
	GEMS = 'gems',
}

// Building categories
export enum BuildingCategory {
	RESOURCE = 'resource',
	DEFENSE = 'defense',
	ARMY = 'army',
	OTHER = 'other',
}

// Building state
export enum BuildingState {
	PLACING = 'placing',
	CONSTRUCTING = 'constructing',
	ACTIVE = 'active',
	UPGRADING = 'upgrading',
	DESTROYED = 'destroyed',
}

// Troop targeting priority
export enum TargetPriority {
	NEAREST = 'nearest',
	DEFENSES = 'defenses',
	RESOURCES = 'resources',
	WALLS = 'walls',
	ANY = 'any',
}

// Battle state
export enum BattlePhase {
	NONE = 'none',
	PREPARATION = 'preparation',
	BATTLE = 'battle',
	RESULTS = 'results',
}

// ============================================
// BUILDING DEFINITIONS
// ============================================

export interface BuildingDef {
	id: string;
	name: string;
	category: BuildingCategory;
	width: number;
	height: number;
	maxLevel: number;
	levels: BuildingLevelDef[];
}

export interface BuildingLevelDef {
	level: number;
	hp: number;
	buildTime: number; // seconds (shortened for gameplay)
	costGold: number;
	costElixir: number;
	// Defense specific
	dps?: number;
	range?: number;
	// Resource specific
	productionRate?: number; // per second
	storageCapacity?: number;
	resourceType?: ResourceType;
}

export const BUILDINGS: Record<string, BuildingDef> = {
	townhall: {
		id: 'townhall',
		name: 'Town Hall',
		category: BuildingCategory.OTHER,
		width: 4,
		height: 4,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 1500, buildTime: 0, costGold: 0, costElixir: 0 },
			{ level: 2, hp: 1600, buildTime: 30, costGold: 1000, costElixir: 0 },
			{ level: 3, hp: 1850, buildTime: 60, costGold: 4000, costElixir: 0 },
			{ level: 4, hp: 2100, buildTime: 120, costGold: 25000, costElixir: 0 },
			{ level: 5, hp: 2400, buildTime: 300, costGold: 150000, costElixir: 0 },
		],
	},
	goldmine: {
		id: 'goldmine',
		name: 'Gold Mine',
		category: BuildingCategory.RESOURCE,
		width: 3,
		height: 3,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 400, buildTime: 5, costElixir: 150, costGold: 0, productionRate: 0.05, storageCapacity: 500, resourceType: ResourceType.GOLD },
			{ level: 2, hp: 440, buildTime: 15, costElixir: 300, costGold: 0, productionRate: 0.1, storageCapacity: 1000, resourceType: ResourceType.GOLD },
			{ level: 3, hp: 480, buildTime: 30, costElixir: 700, costGold: 0, productionRate: 0.17, storageCapacity: 1500, resourceType: ResourceType.GOLD },
			{ level: 4, hp: 520, buildTime: 60, costElixir: 1400, costGold: 0, productionRate: 0.25, storageCapacity: 2500, resourceType: ResourceType.GOLD },
			{ level: 5, hp: 560, buildTime: 120, costElixir: 3000, costGold: 0, productionRate: 0.42, storageCapacity: 5000, resourceType: ResourceType.GOLD },
		],
	},
	elixircollector: {
		id: 'elixircollector',
		name: 'Elixir Collector',
		category: BuildingCategory.RESOURCE,
		width: 3,
		height: 3,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 400, buildTime: 5, costGold: 150, costElixir: 0, productionRate: 0.05, storageCapacity: 500, resourceType: ResourceType.ELIXIR },
			{ level: 2, hp: 440, buildTime: 15, costGold: 300, costElixir: 0, productionRate: 0.1, storageCapacity: 1000, resourceType: ResourceType.ELIXIR },
			{ level: 3, hp: 480, buildTime: 30, costGold: 700, costElixir: 0, productionRate: 0.17, storageCapacity: 1500, resourceType: ResourceType.ELIXIR },
			{ level: 4, hp: 520, buildTime: 60, costGold: 1400, costElixir: 0, productionRate: 0.25, storageCapacity: 2500, resourceType: ResourceType.ELIXIR },
			{ level: 5, hp: 560, buildTime: 120, costGold: 3000, costElixir: 0, productionRate: 0.42, storageCapacity: 5000, resourceType: ResourceType.ELIXIR },
		],
	},
	goldstorage: {
		id: 'goldstorage',
		name: 'Gold Storage',
		category: BuildingCategory.RESOURCE,
		width: 3,
		height: 3,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 400, buildTime: 5, costElixir: 300, costGold: 0, storageCapacity: 1500, resourceType: ResourceType.GOLD },
			{ level: 2, hp: 600, buildTime: 15, costElixir: 750, costGold: 0, storageCapacity: 3000, resourceType: ResourceType.GOLD },
			{ level: 3, hp: 800, buildTime: 30, costElixir: 1500, costGold: 0, storageCapacity: 6000, resourceType: ResourceType.GOLD },
			{ level: 4, hp: 1000, buildTime: 60, costElixir: 3000, costGold: 0, storageCapacity: 12000, resourceType: ResourceType.GOLD },
			{ level: 5, hp: 1200, buildTime: 120, costElixir: 6000, costGold: 0, storageCapacity: 25000, resourceType: ResourceType.GOLD },
		],
	},
	elixirstorage: {
		id: 'elixirstorage',
		name: 'Elixir Storage',
		category: BuildingCategory.RESOURCE,
		width: 3,
		height: 3,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 400, buildTime: 5, costGold: 300, costElixir: 0, storageCapacity: 1500, resourceType: ResourceType.ELIXIR },
			{ level: 2, hp: 600, buildTime: 15, costGold: 750, costElixir: 0, storageCapacity: 3000, resourceType: ResourceType.ELIXIR },
			{ level: 3, hp: 800, buildTime: 30, costGold: 1500, costElixir: 0, storageCapacity: 6000, resourceType: ResourceType.ELIXIR },
			{ level: 4, hp: 1000, buildTime: 60, costGold: 3000, costElixir: 0, storageCapacity: 12000, resourceType: ResourceType.ELIXIR },
			{ level: 5, hp: 1200, buildTime: 120, costGold: 6000, costElixir: 0, storageCapacity: 25000, resourceType: ResourceType.ELIXIR },
		],
	},
	cannon: {
		id: 'cannon',
		name: 'Cannon',
		category: BuildingCategory.DEFENSE,
		width: 3,
		height: 3,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 420, buildTime: 10, costGold: 250, costElixir: 0, dps: 9, range: 9 },
			{ level: 2, hp: 470, buildTime: 20, costGold: 1000, costElixir: 0, dps: 11, range: 9 },
			{ level: 3, hp: 520, buildTime: 45, costGold: 4000, costElixir: 0, dps: 15, range: 9 },
			{ level: 4, hp: 570, buildTime: 90, costGold: 16000, costElixir: 0, dps: 19, range: 9 },
			{ level: 5, hp: 620, buildTime: 180, costGold: 50000, costElixir: 0, dps: 25, range: 9 },
		],
	},
	archertower: {
		id: 'archertower',
		name: 'Archer Tower',
		category: BuildingCategory.DEFENSE,
		width: 3,
		height: 3,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 380, buildTime: 10, costGold: 1000, costElixir: 0, dps: 11, range: 10 },
			{ level: 2, hp: 420, buildTime: 20, costGold: 2000, costElixir: 0, dps: 15, range: 10 },
			{ level: 3, hp: 460, buildTime: 45, costGold: 5000, costElixir: 0, dps: 19, range: 10 },
			{ level: 4, hp: 500, buildTime: 90, costGold: 20000, costElixir: 0, dps: 25, range: 10 },
			{ level: 5, hp: 540, buildTime: 180, costGold: 80000, costElixir: 0, dps: 30, range: 10 },
		],
	},
	wall: {
		id: 'wall',
		name: 'Wall',
		category: BuildingCategory.DEFENSE,
		width: 1,
		height: 1,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 300, buildTime: 0, costGold: 50, costElixir: 0 },
			{ level: 2, hp: 500, buildTime: 0, costGold: 1000, costElixir: 0 },
			{ level: 3, hp: 700, buildTime: 0, costGold: 5000, costElixir: 0 },
			{ level: 4, hp: 900, buildTime: 0, costGold: 10000, costElixir: 0 },
			{ level: 5, hp: 1400, buildTime: 0, costGold: 30000, costElixir: 0 },
		],
	},
	barracks: {
		id: 'barracks',
		name: 'Barracks',
		category: BuildingCategory.ARMY,
		width: 3,
		height: 3,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 250, buildTime: 10, costElixir: 200, costGold: 0 },
			{ level: 2, hp: 290, buildTime: 20, costElixir: 1000, costGold: 0 },
			{ level: 3, hp: 330, buildTime: 45, costElixir: 2500, costGold: 0 },
			{ level: 4, hp: 370, buildTime: 90, costElixir: 5000, costGold: 0 },
			{ level: 5, hp: 420, buildTime: 180, costElixir: 10000, costGold: 0 },
		],
	},
	armycamp: {
		id: 'armycamp',
		name: 'Army Camp',
		category: BuildingCategory.ARMY,
		width: 4,
		height: 4,
		maxLevel: 5,
		levels: [
			{ level: 1, hp: 250, buildTime: 10, costElixir: 250, costGold: 0, storageCapacity: 20 },
			{ level: 2, hp: 270, buildTime: 20, costElixir: 2000, costGold: 0, storageCapacity: 30 },
			{ level: 3, hp: 290, buildTime: 45, costElixir: 10000, costGold: 0, storageCapacity: 35 },
			{ level: 4, hp: 310, buildTime: 90, costElixir: 100000, costGold: 0, storageCapacity: 40 },
			{ level: 5, hp: 330, buildTime: 180, costElixir: 250000, costGold: 0, storageCapacity: 50 },
		],
	},
};

// ============================================
// TROOP DEFINITIONS
// ============================================

export interface TroopDef {
	id: string;
	name: string;
	housingSpace: number;
	trainingTime: number; // seconds
	maxLevel: number;
	targetPriority: TargetPriority;
	isRanged: boolean;
	attackRange: number;
	levels: TroopLevelDef[];
}

export interface TroopLevelDef {
	level: number;
	hp: number;
	dps: number;
	trainingCostElixir: number;
	moveSpeed: number; // tiles per second
}

export const TROOPS: Record<string, TroopDef> = {
	barbarian: {
		id: 'barbarian',
		name: 'Barbarian',
		housingSpace: 1,
		trainingTime: 5,
		maxLevel: 5,
		targetPriority: TargetPriority.NEAREST,
		isRanged: false,
		attackRange: 0.7,
		levels: [
			{ level: 1, hp: 45, dps: 8, trainingCostElixir: 25, moveSpeed: 3 },
			{ level: 2, hp: 54, dps: 11, trainingCostElixir: 40, moveSpeed: 3 },
			{ level: 3, hp: 65, dps: 14, trainingCostElixir: 60, moveSpeed: 3 },
			{ level: 4, hp: 78, dps: 18, trainingCostElixir: 100, moveSpeed: 3 },
			{ level: 5, hp: 95, dps: 23, trainingCostElixir: 150, moveSpeed: 3 },
		],
	},
	archer: {
		id: 'archer',
		name: 'Archer',
		housingSpace: 1,
		trainingTime: 6,
		maxLevel: 5,
		targetPriority: TargetPriority.NEAREST,
		isRanged: true,
		attackRange: 3.5,
		levels: [
			{ level: 1, hp: 20, dps: 7, trainingCostElixir: 50, moveSpeed: 3.5 },
			{ level: 2, hp: 23, dps: 9, trainingCostElixir: 80, moveSpeed: 3.5 },
			{ level: 3, hp: 28, dps: 12, trainingCostElixir: 120, moveSpeed: 3.5 },
			{ level: 4, hp: 33, dps: 16, trainingCostElixir: 200, moveSpeed: 3.5 },
			{ level: 5, hp: 40, dps: 20, trainingCostElixir: 300, moveSpeed: 3.5 },
		],
	},
	giant: {
		id: 'giant',
		name: 'Giant',
		housingSpace: 5,
		trainingTime: 15,
		maxLevel: 5,
		targetPriority: TargetPriority.DEFENSES,
		isRanged: false,
		attackRange: 0.7,
		levels: [
			{ level: 1, hp: 300, dps: 11, trainingCostElixir: 250, moveSpeed: 1.5 },
			{ level: 2, hp: 360, dps: 14, trainingCostElixir: 750, moveSpeed: 1.5 },
			{ level: 3, hp: 430, dps: 19, trainingCostElixir: 1250, moveSpeed: 1.5 },
			{ level: 4, hp: 520, dps: 24, trainingCostElixir: 2000, moveSpeed: 1.5 },
			{ level: 5, hp: 620, dps: 31, trainingCostElixir: 3000, moveSpeed: 1.5 },
		],
	},
	wallbreaker: {
		id: 'wallbreaker',
		name: 'Wall Breaker',
		housingSpace: 2,
		trainingTime: 10,
		maxLevel: 5,
		targetPriority: TargetPriority.WALLS,
		isRanged: false,
		attackRange: 0.7,
		levels: [
			{ level: 1, hp: 20, dps: 12, trainingCostElixir: 1000, moveSpeed: 4 },
			{ level: 2, hp: 24, dps: 16, trainingCostElixir: 1500, moveSpeed: 4 },
			{ level: 3, hp: 29, dps: 24, trainingCostElixir: 2000, moveSpeed: 4 },
			{ level: 4, hp: 35, dps: 32, trainingCostElixir: 2500, moveSpeed: 4 },
			{ level: 5, hp: 42, dps: 46, trainingCostElixir: 3000, moveSpeed: 4 },
		],
	},
};

// Wall breakers do 40x damage to walls
export const WALL_BREAKER_WALL_MULTIPLIER = 40;

// Starting resources
export const STARTING_RESOURCES = {
	gold: 500,
	elixir: 500,
	gems: 50,
};

// Battle config
export const BATTLE = {
	DURATION: 180, // 3 minutes
	STAR_THRESHOLDS: [50, 100], // destruction % for 2nd and 3rd star (1st is Town Hall)
	LOOT_PERCENTAGE: 0.2, // attacker gets 20% of available loot
};

// Camera config for isometric view
export const CAMERA = {
	ISO_ANGLE: Math.PI / 6, // 30 degrees
	INITIAL_DISTANCE: 35,
	MIN_DISTANCE: 15,
	MAX_DISTANCE: 60,
	PAN_SPEED: 0.5,
	ZOOM_SPEED: 2,
};

// Colors for different tile/building types
export const COLORS = {
	grass: '#4a8c3f',
	grassLight: '#5ca04e',
	grassDark: '#3d7a34',
	gridLine: '#3d7a34',
	goldBuilding: '#d4a017',
	elixirBuilding: '#8b45a6',
	defenseBuilding: '#8b8b8b',
	armyBuilding: '#b8860b',
	townhall: '#c9a44a',
	wall: '#a0906a',
	constructing: '#ffaa00',
	validPlacement: '#00ff0066',
	invalidPlacement: '#ff000066',
	healthBarGreen: '#00cc00',
	healthBarYellow: '#cccc00',
	healthBarRed: '#cc0000',
};
