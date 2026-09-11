export type FireState = 'dead' | 'smoldering' | 'flickering' | 'burning' | 'roaring';
export type WarmthLevel = 'freezing' | 'cold' | 'mild' | 'warm';
export type StrangerState = 'none' | 'sleeping' | 'awake' | 'helping';
export type ActiveTab = 'room' | 'forest' | 'village' | 'craft' | 'map' | 'ship';

export interface StarshipState {
  unlocked: boolean;
  hullLevel: number;
  engineLevel: number;
  clearedEscape: boolean;
}

export interface Resources {
  wood: number;
  fur: number;
  meat: number;
  curedMeat: number;
  leather: number;
  teeth: number;
  scales: number;
  iron: number;
  coal: number;
  steel: number;
  torches: number;
  bullets: number;
  alienAlloy: number;
  cloth: number;
  bait: number;
  // Unique / equipment counters
  cart: number;
  wagon: number;
  canteenLevel: number;
  compass: number;
  boneSpear: number;
  ironSword: number;
  steelSword: number;
  rifle: number;
  bolas: number;
  medicine: number;
}

export interface Buildings {
  huts: number;
  traps: number;
  lodge: number;
  tradingPost: number;
  smokehouse: number;
  workshop: number;
  tannery: number;
  furnace: number;
  armory: number;
}

export interface Workers {
  gatherers: number;
  hunters: number;
  trappers: number;
  tanners: number;
  curedMeatMakers: number;
  ironMiners: number;
  coalMiners: number;
  steelworkers: number;
}

export interface Landmark {
  id: string;
  name: string;
  type: 'iron_mine' | 'coal_mine' | 'abandoned_town' | 'ruined_city' | 'crashed_starship' | 'outpost' | 'cave';
  x: number;
  y: number;
  cleared: boolean;
  loot?: Partial<Resources>;
  description: string;
  isOutpost?: boolean;
  requiresTorch?: boolean;
}

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  accuracy: number;
  speed: number;
  loot: Partial<Resources>;
}

export interface ExpeditionState {
  active: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  water: number;
  maxWater: number;
  curedMeat: number;
  torches: number;
  weapon: 'fists' | 'boneSpear' | 'ironSword' | 'steelSword' | 'rifle';
  bullets: number;
  carriedLoot: Partial<Resources>;
  inCombat: boolean;
  enemy: Enemy | null;
  combatLog: string[];
  weaponCooldowns: Record<string, number>;
  enemyAttackCooldown: number;
  enemyMaxAttackCooldown: number;
}

export interface GameData {
  version: number;
  gameTime: number; // in seconds
  fireState: FireState;
  fireFuel: number; // 0 - 100
  warmthLevel: WarmthLevel;
  strangerState: StrangerState;
  strangerName: string;
  
  // Tabs & Features unlocked
  unlockedTabs: {
    room: boolean;
    forest: boolean;
    village: boolean;
    craft: boolean;
    map: boolean;
    ship: boolean;
  };
  activeTab: ActiveTab;

  // Unlocks & Triggers
  unlockedTraps: boolean;
  unlockedForest: boolean;
  unlockedBuilder: boolean;
  unlockedCompass: boolean;
  hasVisitedForest?: boolean;
  hasGatheredWood?: boolean;
  unlockedBuildings?: Record<string, boolean>;
  
  resources: Resources;
  buildings: Buildings;
  workers: Workers;
  population: number;

  // Traps catch timer
  trapBaitMeat: number;

  // Map state
  mapSeed: number;
  mapWidth: number;
  mapHeight: number;
  visitedTiles: string[]; // "x,y" keys
  clearedLandmarks: string[]; // landmark IDs
  expedition: ExpeditionState;

  // Starship state
  starship: StarshipState;

  // Message logs
  logs: Array<{ text: string; time: number; type?: 'info' | 'warn' | 'event' | 'story' }>;
}

export interface SaveMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  days: number;
  population: number;
  summary: string;
}

export const INITIAL_GAME_DATA: GameData = {
  version: 1,
  gameTime: 0,
  fireState: 'dead',
  fireFuel: 0,
  warmthLevel: 'freezing',
  strangerState: 'none',
  strangerName: '神秘女子',

  unlockedTabs: {
    room: true,
    forest: false,
    village: false,
    craft: false,
    map: false,
    ship: false
  },
  activeTab: 'room',

  unlockedTraps: false,
  unlockedForest: false,
  unlockedBuilder: false,
  unlockedCompass: false,
  hasVisitedForest: false,
  hasGatheredWood: false,
  unlockedBuildings: {},

  resources: {
    wood: 0,
    fur: 0,
    meat: 0,
    curedMeat: 0,
    leather: 0,
    teeth: 0,
    scales: 0,
    iron: 0,
    coal: 0,
    steel: 0,
    torches: 0,
    bullets: 0,
    alienAlloy: 0,
    cloth: 0,
    bait: 0,
    cart: 0,
    wagon: 0,
    canteenLevel: 0,
    compass: 0,
    boneSpear: 0,
    ironSword: 0,
    steelSword: 0,
    rifle: 0,
    bolas: 0,
    medicine: 0
  },

  buildings: {
    huts: 0,
    traps: 0,
    lodge: 0,
    tradingPost: 0,
    smokehouse: 0,
    workshop: 0,
    tannery: 0,
    furnace: 0,
    armory: 0
  },

  workers: {
    gatherers: 0,
    hunters: 0,
    trappers: 0,
    tanners: 0,
    curedMeatMakers: 0,
    ironMiners: 0,
    coalMiners: 0,
    steelworkers: 0
  },

  population: 0,
  trapBaitMeat: 0,

  mapSeed: 42,
  mapWidth: 41,
  mapHeight: 41,
  visitedTiles: ['20,20'], // Start at center (20,20)
  clearedLandmarks: [],
  expedition: {
    active: false,
    x: 20,
    y: 20,
    hp: 20,
    maxHp: 20,
    water: 10,
    maxWater: 10,
    curedMeat: 0,
    torches: 0,
    weapon: 'fists',
    bullets: 0,
    carriedLoot: {},
    inCombat: false,
    enemy: null,
    combatLog: [],
    weaponCooldowns: {},
    enemyAttackCooldown: 0,
    enemyMaxAttackCooldown: 0
  },

  starship: {
    unlocked: false,
    hullLevel: 0,
    engineLevel: 1,
    clearedEscape: false
  },

  logs: [
    { text: '房間寒冷刺骨。', time: 0, type: 'story' },
    { text: '火堆熄滅了。', time: 0, type: 'story' }
  ]
};
