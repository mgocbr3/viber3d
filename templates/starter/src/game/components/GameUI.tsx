import { useGameStore } from '../store';
import { BUILDINGS, TROOPS, BuildingState, BattlePhase } from '../config';

// ============================================
// RESOURCE BAR (top of screen)
// ============================================
function ResourceBar() {
	const gold = useGameStore((s) => s.gold);
	const elixir = useGameStore((s) => s.elixir);
	const gems = useGameStore((s) => s.gems);
	const maxGold = useGameStore((s) => s.maxGold);
	const maxElixir = useGameStore((s) => s.maxElixir);
	const thLevel = useGameStore((s) => s.townHallLevel);

	return (
		<div style={{
			position: 'absolute', top: 0, left: 0, right: 0,
			display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16,
			padding: '8px 16px',
			background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
			zIndex: 10,
		}}>
			{/* TH Level */}
			<div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 14 }}>
				TH {thLevel}
			</div>

			{/* Gold */}
			<div style={{
				display: 'flex', alignItems: 'center', gap: 4,
				background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '4px 12px',
				border: '1px solid #d4a017',
			}}>
				<div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FFD700' }} />
				<span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 13, minWidth: 50, textAlign: 'right' }}>
					{formatNumber(gold)}
				</span>
				<span style={{ color: '#888', fontSize: 10 }}>/{formatNumber(maxGold)}</span>
			</div>

			{/* Elixir */}
			<div style={{
				display: 'flex', alignItems: 'center', gap: 4,
				background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '4px 12px',
				border: '1px solid #8b45a6',
			}}>
				<div style={{ width: 18, height: 18, borderRadius: '50%', background: '#9B59B6' }} />
				<span style={{ color: '#D8A0E8', fontWeight: 'bold', fontSize: 13, minWidth: 50, textAlign: 'right' }}>
					{formatNumber(elixir)}
				</span>
				<span style={{ color: '#888', fontSize: 10 }}>/{formatNumber(maxElixir)}</span>
			</div>

			{/* Gems */}
			<div style={{
				display: 'flex', alignItems: 'center', gap: 4,
				background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '4px 12px',
				border: '1px solid #2ECC71',
			}}>
				<div style={{ width: 16, height: 16, background: '#2ECC71', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
				<span style={{ color: '#2ECC71', fontWeight: 'bold', fontSize: 13, minWidth: 30, textAlign: 'right' }}>
					{gems}
				</span>
			</div>
		</div>
	);
}

// ============================================
// BOTTOM ACTION BAR
// ============================================
function ActionBar({ onBuild, onArmy, onBattle }: {
	onBuild: () => void;
	onArmy: () => void;
	onBattle: () => void;
}) {
	const battlePhase = useGameStore((s) => s.battlePhase);

	if (battlePhase !== BattlePhase.NONE) return null;

	return (
		<div style={{
			position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
			display: 'flex', gap: 12, zIndex: 10,
		}}>
			<ActionButton label="Build" color="#d4a017" onClick={onBuild} icon="B" />
			<ActionButton label="Army" color="#8b45a6" onClick={onArmy} icon="A" />
			<ActionButton label="Attack" color="#cc3333" onClick={onBattle} icon="!" />
		</div>
	);
}

function ActionButton({ label, color, onClick, icon }: {
	label: string; color: string; onClick: () => void; icon: string;
}) {
	return (
		<button
			onClick={onClick}
			style={{
				background: `linear-gradient(180deg, ${color} 0%, ${darkenColor(color)} 100%)`,
				border: `2px solid ${lightenColor(color)}`,
				borderRadius: 12,
				padding: '12px 20px',
				color: 'white',
				fontWeight: 'bold',
				fontSize: 14,
				cursor: 'pointer',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 2,
				minWidth: 70,
				boxShadow: `0 4px 8px rgba(0,0,0,0.4)`,
				touchAction: 'manipulation',
			}}
		>
			<span style={{ fontSize: 20 }}>{icon}</span>
			<span>{label}</span>
		</button>
	);
}

// ============================================
// BUILD MENU
// ============================================
function BuildMenu({ onSelect, onClose }: {
	onSelect: (buildingId: string) => void;
	onClose: () => void;
}) {
	const show = useGameStore((s) => s.showBuildMenu);
	const gold = useGameStore((s) => s.gold);
	const elixir = useGameStore((s) => s.elixir);

	if (!show) return null;

	const categories = [
		{ label: 'Defense', items: ['cannon', 'archertower', 'wall'] },
		{ label: 'Resources', items: ['goldmine', 'elixircollector', 'goldstorage', 'elixirstorage'] },
		{ label: 'Army', items: ['barracks', 'armycamp'] },
	];

	return (
		<div style={{
			position: 'absolute', bottom: 80, left: 8, right: 8,
			background: 'rgba(20,15,10,0.95)',
			borderRadius: 16,
			padding: 16,
			zIndex: 20,
			maxHeight: '50vh',
			overflowY: 'auto',
			border: '2px solid #6b5a3e',
		}}>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
				<h3 style={{ color: '#FFD700', margin: 0, fontSize: 16 }}>Build</h3>
				<button onClick={onClose} style={closeButtonStyle}>X</button>
			</div>

			{categories.map((cat) => (
				<div key={cat.label} style={{ marginBottom: 12 }}>
					<div style={{ color: '#aaa', fontSize: 11, marginBottom: 6, textTransform: 'uppercase' }}>{cat.label}</div>
					<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
						{cat.items.map((id) => {
							const def = BUILDINGS[id];
							if (!def) return null;
							const level = def.levels[0];
							const costGold = level.costGold;
							const costElixir = level.costElixir;
							const canAfford = gold >= costGold && elixir >= costElixir;

							return (
								<button
									key={id}
									onClick={() => canAfford && onSelect(id)}
									style={{
										background: canAfford ? 'rgba(60,50,30,0.9)' : 'rgba(40,30,20,0.5)',
										border: `1px solid ${canAfford ? '#8b7355' : '#444'}`,
										borderRadius: 8,
										padding: '8px 10px',
										color: canAfford ? '#fff' : '#666',
										cursor: canAfford ? 'pointer' : 'not-allowed',
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: 4,
										minWidth: 72,
										opacity: canAfford ? 1 : 0.5,
										touchAction: 'manipulation',
									}}
								>
									<div style={{ fontSize: 12, fontWeight: 'bold' }}>{def.name}</div>
									<div style={{ fontSize: 10, color: costGold > 0 ? '#FFD700' : '#D8A0E8' }}>
										{costGold > 0 ? `${costGold} G` : `${costElixir} E`}
									</div>
									<div style={{ fontSize: 9, color: '#888' }}>{def.width}x{def.height}</div>
								</button>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}

// ============================================
// ARMY MENU
// ============================================
function ArmyMenu({ onTrain, onClose }: {
	onTrain: (troopId: string) => void;
	onClose: () => void;
}) {
	const show = useGameStore((s) => s.showArmyMenu);
	const elixir = useGameStore((s) => s.elixir);
	const trainedTroops = useGameStore((s) => s.trainedTroops);
	const capacity = useGameStore((s) => s.armyCapacity);
	const maxCapacity = useGameStore((s) => s.maxArmyCapacity);

	if (!show) return null;

	return (
		<div style={{
			position: 'absolute', bottom: 80, left: 8, right: 8,
			background: 'rgba(20,15,10,0.95)',
			borderRadius: 16,
			padding: 16,
			zIndex: 20,
			border: '2px solid #6b5a3e',
		}}>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
				<h3 style={{ color: '#9B59B6', margin: 0, fontSize: 16 }}>
					Army ({capacity}/{maxCapacity})
				</h3>
				<button onClick={onClose} style={closeButtonStyle}>X</button>
			</div>

			<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
				{Object.entries(TROOPS).map(([id, def]) => {
					const level = def.levels[0];
					const canAfford = elixir >= level.trainingCostElixir && capacity + def.housingSpace <= maxCapacity;
					const count = trainedTroops[id] || 0;

					return (
						<button
							key={id}
							onClick={() => canAfford && onTrain(id)}
							style={{
								background: canAfford ? 'rgba(60,30,60,0.9)' : 'rgba(40,20,40,0.5)',
								border: `1px solid ${canAfford ? '#8b45a6' : '#444'}`,
								borderRadius: 8,
								padding: '8px 10px',
								color: canAfford ? '#fff' : '#666',
								cursor: canAfford ? 'pointer' : 'not-allowed',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 4,
								minWidth: 72,
								opacity: canAfford ? 1 : 0.5,
								position: 'relative',
								touchAction: 'manipulation',
							}}
						>
							<div style={{ fontSize: 12, fontWeight: 'bold' }}>{def.name}</div>
							<div style={{ fontSize: 10, color: '#D8A0E8' }}>{level.trainingCostElixir} E</div>
							<div style={{ fontSize: 9, color: '#888' }}>HP: {level.hp} | DPS: {level.dps}</div>
							{count > 0 && (
								<div style={{
									position: 'absolute', top: -6, right: -6,
									background: '#cc3333', borderRadius: '50%',
									width: 20, height: 20,
									display: 'flex', alignItems: 'center', justifyContent: 'center',
									fontSize: 11, fontWeight: 'bold', color: 'white',
								}}>{count}</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

// ============================================
// BUILDING INFO PANEL (when a building is selected)
// ============================================
function BuildingInfoPanel({ onUpgrade, onCollect, onClose }: {
	onUpgrade: () => void;
	onCollect: () => void;
	onClose: () => void;
}) {
	const info = useGameStore((s) => s.selectedBuildingInfo);
	const gold = useGameStore((s) => s.gold);
	const elixir = useGameStore((s) => s.elixir);

	if (!info) return null;

	const def = BUILDINGS[info.buildingId];
	if (!def) return null;

	const isMaxLevel = info.level >= def.maxLevel;
	const nextLevel = !isMaxLevel ? def.levels[info.level] : null;
	const canUpgrade = nextLevel && gold >= nextLevel.costGold && elixir >= nextLevel.costElixir;
	const isActive = info.state === BuildingState.ACTIVE;
	const hasResources = (info.stored || 0) > 0;

	return (
		<div style={{
			position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
			background: 'rgba(20,15,10,0.95)',
			borderRadius: 16,
			padding: 16,
			zIndex: 20,
			minWidth: 250,
			border: '2px solid #6b5a3e',
		}}>
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
				<h3 style={{ color: '#FFD700', margin: 0, fontSize: 15 }}>
					{def.name} (Lv {info.level})
				</h3>
				<button onClick={onClose} style={closeButtonStyle}>X</button>
			</div>

			<div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>
				HP: {Math.floor(info.hp)}/{info.maxHp}
			</div>

			{info.state === BuildingState.CONSTRUCTING && (
				<div style={{ color: COLORS_UI.constructing, fontSize: 12 }}>Under Construction...</div>
			)}
			{info.state === BuildingState.UPGRADING && (
				<div style={{ color: COLORS_UI.constructing, fontSize: 12 }}>Upgrading...</div>
			)}

			<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
				{isActive && hasResources && (
					<button onClick={onCollect} style={panelButtonStyle('#2ECC71')}>
						Collect
					</button>
				)}
				{isActive && !isMaxLevel && nextLevel && (
					<button
						onClick={() => canUpgrade && onUpgrade()}
						style={panelButtonStyle(canUpgrade ? '#d4a017' : '#555')}
					>
						Upgrade Lv{info.level + 1}
						<br />
						<span style={{ fontSize: 10 }}>
							{nextLevel.costGold > 0 ? `${nextLevel.costGold}G` : ''}
							{nextLevel.costElixir > 0 ? `${nextLevel.costElixir}E` : ''}
						</span>
					</button>
				)}
				{isMaxLevel && (
					<div style={{ color: '#FFD700', fontSize: 12, padding: 8 }}>MAX LEVEL</div>
				)}
			</div>
		</div>
	);
}

// ============================================
// PLACEMENT CONTROLS
// ============================================
function PlacementControls({ onConfirm, onCancel }: {
	onConfirm: () => void;
	onCancel: () => void;
}) {
	const placementMode = useGameStore((s) => s.placementMode);
	const placementValid = useGameStore((s) => s.placementValid);
	const buildingType = useGameStore((s) => s.selectedBuildingType);

	if (!placementMode) return null;

	const def = BUILDINGS[buildingType];

	return (
		<div style={{
			position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
			display: 'flex', gap: 12, alignItems: 'center', zIndex: 20,
		}}>
			<div style={{ color: '#fff', fontSize: 14, background: 'rgba(0,0,0,0.7)', padding: '8px 12px', borderRadius: 8 }}>
				Placing: {def?.name || buildingType}
			</div>
			<button
				onClick={onConfirm}
				disabled={!placementValid}
				style={{
					...panelButtonStyle(placementValid ? '#2ECC71' : '#555'),
					opacity: placementValid ? 1 : 0.5,
					cursor: placementValid ? 'pointer' : 'not-allowed',
				}}
			>
				Confirm
			</button>
			<button onClick={onCancel} style={panelButtonStyle('#cc3333')}>
				Cancel
			</button>
		</div>
	);
}

// ============================================
// BATTLE UI
// ============================================
function BattleUI({ onEndBattle }: {
	onEndBattle: () => void;
}) {
	const battlePhase = useGameStore((s) => s.battlePhase);
	const timeRemaining = useGameStore((s) => s.battleTimeRemaining);
	const destruction = useGameStore((s) => s.destructionPercentage);
	const stars = useGameStore((s) => s.stars);
	const trainedTroops = useGameStore((s) => s.trainedTroops);
	const selectedTroop = useGameStore((s) => s.selectedTroopType);
	const setSelectedTroop = useGameStore((s) => s.setSelectedTroop);

	if (battlePhase === BattlePhase.NONE) return null;

	if (battlePhase === BattlePhase.RESULTS) {
		return (
			<div style={{
				position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
				background: 'rgba(0,0,0,0.9)',
				borderRadius: 20,
				padding: 32,
				zIndex: 30,
				textAlign: 'center',
				border: '2px solid #FFD700',
				minWidth: 280,
			}}>
				<h2 style={{ color: '#FFD700', margin: '0 0 12px', fontSize: 24 }}>Battle Over!</h2>
				<div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
					{[0, 1, 2].map((i) => (
						<span key={i} style={{ fontSize: 32, color: i < stars ? '#FFD700' : '#444' }}>
							*
						</span>
					))}
				</div>
				<div style={{ color: '#fff', fontSize: 18, marginBottom: 16 }}>
					{destruction}% Destruction
				</div>
				<button onClick={onEndBattle} style={panelButtonStyle('#2ECC71')}>
					Return to Village
				</button>
			</div>
		);
	}

	// Battle / Preparation phase
	return (
		<>
			{/* Top battle bar */}
			<div style={{
				position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
				display: 'flex', alignItems: 'center', gap: 16,
				background: 'rgba(0,0,0,0.8)', borderRadius: 12, padding: '8px 16px',
				zIndex: 10,
			}}>
				<div style={{ color: '#fff', fontSize: 14 }}>
					{Math.floor(timeRemaining / 60)}:{String(Math.floor(timeRemaining % 60)).padStart(2, '0')}
				</div>
				<div style={{ display: 'flex', gap: 4 }}>
					{[0, 1, 2].map((i) => (
						<span key={i} style={{ fontSize: 20, color: i < stars ? '#FFD700' : '#444' }}>*</span>
					))}
				</div>
				<div style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: 14 }}>
					{destruction}%
				</div>
			</div>

			{/* Troop deployment bar */}
			<div style={{
				position: 'absolute', bottom: 16, left: 8, right: 8,
				display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'flex-end',
				zIndex: 10,
			}}>
				{Object.entries(trainedTroops).map(([id, count]) => {
					if (count <= 0) return null;
					const def = TROOPS[id];
					if (!def) return null;
					const isSelected = selectedTroop === id;

					return (
						<button
							key={id}
							onClick={() => setSelectedTroop(isSelected ? '' : id)}
							style={{
								background: isSelected ? 'rgba(200,100,50,0.9)' : 'rgba(60,30,60,0.9)',
								border: `2px solid ${isSelected ? '#ff8c42' : '#8b45a6'}`,
								borderRadius: 12,
								padding: '10px 14px',
								color: '#fff',
								cursor: 'pointer',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 4,
								minWidth: 64,
								touchAction: 'manipulation',
							}}
						>
							<div style={{ fontSize: 12, fontWeight: 'bold' }}>{def.name}</div>
							<div style={{ fontSize: 16, fontWeight: 'bold' }}>x{count}</div>
						</button>
					);
				})}
				<button onClick={onEndBattle} style={{
					...panelButtonStyle('#cc3333'),
					marginLeft: 16,
				}}>
					End
				</button>
			</div>
		</>
	);
}

// ============================================
// MAIN GAME UI COMPONENT
// ============================================
export function GameUI({ onBuild, onArmy, onBattle, onSelectBuilding, onTrain, onUpgrade, onCollect,
	onConfirmPlacement, onCancelPlacement, onEndBattle }: {
	onBuild: () => void;
	onArmy: () => void;
	onBattle: () => void;
	onSelectBuilding: (buildingId: string) => void;
	onTrain: (troopId: string) => void;
	onUpgrade: () => void;
	onCollect: () => void;
	onConfirmPlacement: () => void;
	onCancelPlacement: () => void;
	onEndBattle: () => void;

}) {
	const closeBuildMenu = useGameStore((s) => s.toggleBuildMenu);
	const closeArmyMenu = useGameStore((s) => s.toggleArmyMenu);
	const deselectEntity = useGameStore((s) => s.deselectEntity);

	return (
		<div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: "'Segoe UI', sans-serif" }}>
			<div style={{ pointerEvents: 'auto' }}>
				<ResourceBar />
				<ActionBar onBuild={onBuild} onArmy={onArmy} onBattle={onBattle} />
				<BuildMenu onSelect={onSelectBuilding} onClose={closeBuildMenu} />
				<ArmyMenu onTrain={onTrain} onClose={closeArmyMenu} />
				<BuildingInfoPanel onUpgrade={onUpgrade} onCollect={onCollect} onClose={deselectEntity} />
				<PlacementControls onConfirm={onConfirmPlacement} onCancel={onCancelPlacement} />
				<BattleUI onEndBattle={onEndBattle} />
			</div>
		</div>
	);
}

// ============================================
// HELPERS
// ============================================
function formatNumber(n: number): string {
	if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
	if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
	return Math.floor(n).toString();
}

function darkenColor(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgb(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.6)})`;
}

function lightenColor(hex: string): string {
	const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40);
	const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40);
	const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40);
	return `rgb(${r}, ${g}, ${b})`;
}

const COLORS_UI = {
	constructing: '#ffaa00',
};

const closeButtonStyle: React.CSSProperties = {
	background: 'rgba(200,50,50,0.8)',
	border: 'none',
	borderRadius: 6,
	color: '#fff',
	width: 28,
	height: 28,
	cursor: 'pointer',
	fontSize: 14,
	fontWeight: 'bold',
	touchAction: 'manipulation',
};

const panelButtonStyle = (color: string): React.CSSProperties => ({
	background: color,
	border: 'none',
	borderRadius: 8,
	padding: '8px 16px',
	color: '#fff',
	fontWeight: 'bold',
	fontSize: 13,
	cursor: 'pointer',
	touchAction: 'manipulation',
});
