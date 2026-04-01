import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { syncView } from './systems/sync-view';
import { updateTime } from './systems/update-time';

export function GameLoop() {
	const world = useWorld();

	useFrame(() => {
		updateTime(world);
		syncView(world);
	});

	return null;
}
