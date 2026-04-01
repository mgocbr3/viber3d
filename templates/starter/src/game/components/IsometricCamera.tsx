import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { CAMERA, GRID, BUILDINGS } from '../config';
import { useGameStore } from '../store';
import { worldToGrid, canPlaceBuilding } from '../grid';

/** Isometric camera with pan and zoom, also handles grid raycasting for placement */
export function IsometricCamera({ gridCells }: { gridCells: Int32Array }) {
	const { camera, gl } = useThree();
	const targetRef = useRef(new THREE.Vector3(0, 0, 0));
	const distanceRef = useRef(CAMERA.INITIAL_DISTANCE);
	const angleRef = useRef(Math.PI / 4);
	const isDraggingRef = useRef(false);
	const lastMouseRef = useRef({ x: 0, y: 0 });
	const isPinchingRef = useRef(false);
	const lastPinchDistRef = useRef(0);

	const placementMode = useGameStore((s) => s.placementMode);
	const buildingType = useGameStore((s) => s.selectedBuildingType);
	const setPlacementPosition = useGameStore((s) => s.setPlacementPosition);

	// Setup camera
	useEffect(() => {
		camera.near = 0.1;
		camera.far = 200;
		(camera as THREE.PerspectiveCamera).fov = 45;
		(camera as THREE.PerspectiveCamera).updateProjectionMatrix();
	}, [camera]);

	// Raycaster for grid intersection
	const raycasterRef = useRef(new THREE.Raycaster());
	const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
	const intersectionRef = useRef(new THREE.Vector3());

	const getGridFromMouse = useCallback((clientX: number, clientY: number): [number, number] | null => {
		const rect = gl.domElement.getBoundingClientRect();
		const mouse = new THREE.Vector2(
			((clientX - rect.left) / rect.width) * 2 - 1,
			-((clientY - rect.top) / rect.height) * 2 + 1
		);
		raycasterRef.current.setFromCamera(mouse, camera);
		const hit = raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionRef.current);
		if (!hit) return null;
		return worldToGrid(hit.x, hit.z);
	}, [camera, gl]);

	// Mouse/touch event handlers
	useEffect(() => {
		const canvas = gl.domElement;

		const onPointerDown = (e: PointerEvent) => {
			isDraggingRef.current = true;
			lastMouseRef.current = { x: e.clientX, y: e.clientY };
		};

		const onPointerMove = (e: PointerEvent) => {
			if (placementMode && buildingType) {
				const grid = getGridFromMouse(e.clientX, e.clientY);
				if (grid) {
					const def = BUILDINGS[buildingType];
					if (def) {
						const valid = canPlaceBuilding(gridCells, grid[0], grid[1], def.width, def.height);
						setPlacementPosition(grid[0], grid[1], valid);
					}
				}
			}

			if (isDraggingRef.current && !placementMode) {
				const dx = e.clientX - lastMouseRef.current.x;
				const dy = e.clientY - lastMouseRef.current.y;

				// Pan camera
				const right = new THREE.Vector3();
				const forward = new THREE.Vector3();
				camera.getWorldDirection(forward);
				forward.y = 0;
				forward.normalize();
				right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

				const panSpeed = CAMERA.PAN_SPEED * distanceRef.current * 0.003;
				targetRef.current.addScaledVector(right, dx * panSpeed);
				targetRef.current.addScaledVector(forward, -dy * panSpeed);

				// Clamp to grid bounds
				const halfGrid = (GRID.SIZE / 2) * GRID.TILE_SIZE;
				targetRef.current.x = Math.max(-halfGrid, Math.min(halfGrid, targetRef.current.x));
				targetRef.current.z = Math.max(-halfGrid, Math.min(halfGrid, targetRef.current.z));

				lastMouseRef.current = { x: e.clientX, y: e.clientY };
			}
		};

		const onPointerUp = () => {
			isDraggingRef.current = false;
		};

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			distanceRef.current += e.deltaY * 0.03;
			distanceRef.current = Math.max(CAMERA.MIN_DISTANCE, Math.min(CAMERA.MAX_DISTANCE, distanceRef.current));
		};

		// Touch events for mobile pinch zoom
		const onTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				isPinchingRef.current = true;
				const dx = e.touches[0].clientX - e.touches[1].clientX;
				const dy = e.touches[0].clientY - e.touches[1].clientY;
				lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
			}
		};

		const onTouchMove = (e: TouchEvent) => {
			if (isPinchingRef.current && e.touches.length === 2) {
				const dx = e.touches[0].clientX - e.touches[1].clientX;
				const dy = e.touches[0].clientY - e.touches[1].clientY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const delta = lastPinchDistRef.current - dist;
				distanceRef.current += delta * 0.1;
				distanceRef.current = Math.max(CAMERA.MIN_DISTANCE, Math.min(CAMERA.MAX_DISTANCE, distanceRef.current));
				lastPinchDistRef.current = dist;
			}
		};

		const onTouchEnd = () => {
			isPinchingRef.current = false;
		};

		canvas.addEventListener('pointerdown', onPointerDown);
		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerup', onPointerUp);
		canvas.addEventListener('pointerleave', onPointerUp);
		canvas.addEventListener('wheel', onWheel, { passive: false });
		canvas.addEventListener('touchstart', onTouchStart, { passive: true });
		canvas.addEventListener('touchmove', onTouchMove, { passive: true });
		canvas.addEventListener('touchend', onTouchEnd);

		return () => {
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerup', onPointerUp);
			canvas.removeEventListener('pointerleave', onPointerUp);
			canvas.removeEventListener('wheel', onWheel);
			canvas.removeEventListener('touchstart', onTouchStart);
			canvas.removeEventListener('touchmove', onTouchMove);
			canvas.removeEventListener('touchend', onTouchEnd);
		};
	}, [camera, gl, placementMode, buildingType, gridCells, getGridFromMouse, setPlacementPosition]);

	// Update camera position each frame
	useFrame(() => {
		const distance = distanceRef.current;
		const angle = angleRef.current;
		const elevation = CAMERA.ISO_ANGLE;

		const target = targetRef.current;

		camera.position.set(
			target.x + Math.sin(angle) * Math.cos(elevation) * distance,
			target.y + Math.sin(elevation) * distance,
			target.z + Math.cos(angle) * Math.cos(elevation) * distance
		);

		camera.lookAt(target);
	});

	return null;
}
