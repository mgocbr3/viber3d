import { trait } from 'koota';
import {
	BuildingState,
	BuildingCategory,
	ResourceType,
	TargetPriority,
	BattlePhase,
} from './config';

// ============================================
// TAG TRAITS (markers)
// ============================================
export const IsBuilding = trait();
export const IsTroop = trait();
export const IsDefense = trait();
export const IsResourceBuilding = trait();
export const IsWall = trait();
export const IsProjectile = trait();
export const IsSelected = trait();

// ============================================
// BUILDING TRAITS
// ============================================
export const Building = trait({
	buildingId: 'townhall' as string,
	level: 1,
	state: BuildingState.ACTIVE as BuildingState,
	category: BuildingCategory.OTHER as BuildingCategory,
	gridX: 0,
	gridY: 0,
	width: 3,
	height: 3,
});

export const BuildTimer = trait({
	startTime: 0,
	duration: 0, // seconds
	isUpgrade: false,
});

export const Health = trait({
	current: 100,
	max: 100,
});

export const Defense = trait({
	dps: 0,
	range: 9,
	attackCooldown: 1, // seconds between attacks
	lastAttackTime: 0,
	targetEntity: -1 as number, // entity id of current target
});

export const ResourceProducer = trait({
	resourceType: ResourceType.GOLD as ResourceType,
	productionRate: 0, // per second
	stored: 0,
	storageCapacity: 500,
	lastCollectTime: 0,
});

export const ResourceStorage = trait({
	resourceType: ResourceType.GOLD as ResourceType,
	capacity: 1500,
	stored: 0,
});

// ============================================
// TROOP TRAITS
// ============================================
export const Troop = trait({
	troopId: 'barbarian' as string,
	level: 1,
	dps: 8,
	attackRange: 0.7,
	moveSpeed: 3,
	targetPriority: TargetPriority.NEAREST as TargetPriority,
	isRanged: false,
	attackCooldown: 1,
	lastAttackTime: 0,
	targetEntity: -1 as number,
});

export const PathNode = trait({
	pathX: () => [] as number[],
	pathY: () => [] as number[],
	pathIndex: 0,
});

// ============================================
// PROJECTILE TRAITS
// ============================================
export const Projectile = trait({
	damage: 0,
	targetEntity: -1 as number,
	speed: 15,
});

// ============================================
// WORLD-LEVEL TRAITS (game state)
// ============================================
export const GameResources = trait({
	gold: 500,
	elixir: 500,
	gems: 50,
	maxGold: 1500,
	maxElixir: 1500,
});

export const GameState = trait({
	townHallLevel: 1,
	battlePhase: BattlePhase.NONE as BattlePhase,
	battleTimeRemaining: 180,
	destructionPercentage: 0,
	stars: 0,
	totalBuildingHp: 0,
	destroyedBuildingHp: 0,
});

// Grid occupancy map - stored as a flat array
export const GridMap = trait({
	// 44*44 = 1936 cells, -1 means empty, otherwise entity id
	cells: () => new Int32Array(44 * 44).fill(-1),
});

// UI state
export const UIState = trait({
	selectedBuildingType: '' as string,
	placementMode: false,
	placementX: 0,
	placementY: 0,
	placementValid: false,
	showBuildMenu: false,
	showArmyMenu: false,
	selectedEntity: -1 as number,
	isBattleMode: false,
	selectedTroopType: '' as string,
});

// Army state
export const ArmyState = trait({
	trainedTroops: () => new Map<string, number>(), // troopId -> count
	maxCapacity: 20,
	trainingQueue: () => [] as { troopId: string; finishTime: number }[],
});

// Camera control
export const CameraControl = trait({
	targetX: 22,
	targetY: 22,
	distance: 35,
	angle: Math.PI / 4,
	elevation: Math.PI / 6,
	isDragging: false,
	lastMouseX: 0,
	lastMouseY: 0,
});
