import { GRID } from './config';

// ============================================
// GRID UTILITIES
// ============================================

/** Convert grid coordinates to world position (center of tile) */
export function gridToWorld(gridX: number, gridY: number): [number, number, number] {
	const x = (gridX - GRID.SIZE / 2) * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
	const z = (gridY - GRID.SIZE / 2) * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
	return [x, 0, z];
}

/** Convert grid coordinates to world position for a building (centered based on size) */
export function buildingGridToWorld(gridX: number, gridY: number, width: number, height: number): [number, number, number] {
	const centerX = gridX + width / 2;
	const centerY = gridY + height / 2;
	const x = (centerX - GRID.SIZE / 2) * GRID.TILE_SIZE;
	const z = (centerY - GRID.SIZE / 2) * GRID.TILE_SIZE;
	return [x, 0, z];
}

/** Convert world position to grid coordinates */
export function worldToGrid(worldX: number, worldZ: number): [number, number] {
	const gridX = Math.floor((worldX / GRID.TILE_SIZE) + GRID.SIZE / 2);
	const gridY = Math.floor((worldZ / GRID.TILE_SIZE) + GRID.SIZE / 2);
	return [gridX, gridY];
}

/** Check if grid coordinates are within bounds */
export function isInBounds(gridX: number, gridY: number): boolean {
	return gridX >= 0 && gridX < GRID.SIZE && gridY >= 0 && gridY < GRID.SIZE;
}

/** Check if grid coordinates are in the playable area */
export function isPlayable(gridX: number, gridY: number): boolean {
	return gridX >= GRID.PLAYABLE_MIN && gridX <= GRID.PLAYABLE_MAX &&
		gridY >= GRID.PLAYABLE_MIN && gridY <= GRID.PLAYABLE_MAX;
}

/** Get flat index from grid coordinates */
export function gridIndex(x: number, y: number): number {
	return y * GRID.SIZE + x;
}

/** Check if a building can be placed at the given position */
export function canPlaceBuilding(
	cells: Int32Array,
	gridX: number,
	gridY: number,
	width: number,
	height: number,
	ignoreEntityId: number = -1
): boolean {
	for (let dy = 0; dy < height; dy++) {
		for (let dx = 0; dx < width; dx++) {
			const cx = gridX + dx;
			const cy = gridY + dy;
			if (!isPlayable(cx, cy)) return false;
			const idx = gridIndex(cx, cy);
			if (cells[idx] !== -1 && cells[idx] !== ignoreEntityId) return false;
		}
	}
	return true;
}

/** Mark grid cells as occupied by a building entity */
export function occupyGrid(cells: Int32Array, gridX: number, gridY: number, width: number, height: number, entityId: number): void {
	for (let dy = 0; dy < height; dy++) {
		for (let dx = 0; dx < width; dx++) {
			cells[gridIndex(gridX + dx, gridY + dy)] = entityId;
		}
	}
}

/** Clear grid cells occupied by a building */
export function clearGrid(cells: Int32Array, gridX: number, gridY: number, width: number, height: number): void {
	for (let dy = 0; dy < height; dy++) {
		for (let dx = 0; dx < width; dx++) {
			cells[gridIndex(gridX + dx, gridY + dy)] = -1;
		}
	}
}

// ============================================
// A* PATHFINDING
// ============================================

interface PathNode {
	x: number;
	y: number;
	g: number; // cost from start
	h: number; // heuristic (manhattan distance)
	f: number; // g + h
	parent: PathNode | null;
}

/** Find path using A* algorithm */
export function findPath(
	cells: Int32Array,
	startX: number,
	startY: number,
	targetX: number,
	targetY: number,
	canBreakWalls: boolean = false
): { x: number; y: number }[] | null {
	// Clamp to grid bounds
	startX = Math.max(0, Math.min(GRID.SIZE - 1, Math.round(startX)));
	startY = Math.max(0, Math.min(GRID.SIZE - 1, Math.round(startY)));
	targetX = Math.max(0, Math.min(GRID.SIZE - 1, Math.round(targetX)));
	targetY = Math.max(0, Math.min(GRID.SIZE - 1, Math.round(targetY)));

	const open: PathNode[] = [];
	const closed = new Set<number>();

	const startNode: PathNode = {
		x: startX,
		y: startY,
		g: 0,
		h: Math.abs(targetX - startX) + Math.abs(targetY - startY),
		f: 0,
		parent: null,
	};
	startNode.f = startNode.g + startNode.h;
	open.push(startNode);

	const directions = [
		[0, 1], [1, 0], [0, -1], [-1, 0],
		[1, 1], [1, -1], [-1, 1], [-1, -1],
	];

	let iterations = 0;
	const maxIterations = 2000;

	while (open.length > 0 && iterations < maxIterations) {
		iterations++;

		// Find node with lowest f
		let bestIdx = 0;
		for (let i = 1; i < open.length; i++) {
			if (open[i].f < open[bestIdx].f) bestIdx = i;
		}
		const current = open.splice(bestIdx, 1)[0];

		// Check if we reached target (within 1 tile)
		if (Math.abs(current.x - targetX) <= 1 && Math.abs(current.y - targetY) <= 1) {
			// Reconstruct path
			const path: { x: number; y: number }[] = [];
			let node: PathNode | null = current;
			while (node) {
				path.unshift({ x: node.x, y: node.y });
				node = node.parent;
			}
			return path;
		}

		closed.add(gridIndex(current.x, current.y));

		for (const [dx, dy] of directions) {
			const nx = current.x + dx;
			const ny = current.y + dy;

			if (!isInBounds(nx, ny)) continue;
			if (closed.has(gridIndex(nx, ny))) continue;

			const cellValue = cells[gridIndex(nx, ny)];
			// Cell is occupied and we can't go through
			if (cellValue !== -1 && !canBreakWalls) continue;

			const moveCost = dx !== 0 && dy !== 0 ? 1.414 : 1;
			// Walls cost more to path through
			const wallPenalty = cellValue !== -1 ? 10 : 0;
			const g = current.g + moveCost + wallPenalty;
			const h = Math.abs(targetX - nx) + Math.abs(targetY - ny);
			const f = g + h;

			// Check if already in open with better score
			const existingIdx = open.findIndex(n => n.x === nx && n.y === ny);
			if (existingIdx >= 0 && open[existingIdx].f <= f) continue;

			if (existingIdx >= 0) open.splice(existingIdx, 1);

			open.push({ x: nx, y: ny, g, h, f, parent: current });
		}
	}

	return null; // No path found
}

/** Get distance between two grid positions */
export function gridDistance(x1: number, y1: number, x2: number, y2: number): number {
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
