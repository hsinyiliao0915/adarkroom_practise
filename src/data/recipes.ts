import { Resources, Buildings, Workers } from '../core/GameState';

export interface BuildingRecipe {
  id: keyof Buildings;
  name: string;
  description: string;
  cost: (currentCount: number) => Partial<Resources>;
  maxCount?: number;
  unlockRequirement?: (buildings: Buildings, resources: Resources) => boolean;
}

export interface WorkerJob {
  id: keyof Workers;
  name: string;
  description: string;
  production: Partial<Record<keyof Resources, number>>; // Per 10 seconds per worker
  consumption: Partial<Record<keyof Resources, number>>; // Per 10 seconds per worker
  requiredBuilding?: keyof Buildings;
  requiredLandmark?: string;
}

export interface CraftRecipe {
  id: keyof Resources;
  name: string;
  description: string;
  cost: Partial<Resources>;
  isEquipment?: boolean;
  maxCount?: number;
  requiresWorkshop?: boolean;
  unlockRequirement?: (resources: Resources, buildings: Buildings) => boolean;
}

export const BUILDING_RECIPES: BuildingRecipe[] = [
  {
    id: 'traps',
    name: '陷阱 (Trap)',
    description: '設置在森林中的簡易陷阱，定期捕捉小型獵物、毛皮與碎骨。',
    cost: (current) => ({
      wood: 10 + current * 10
    }),
    maxCount: 10
  },
  {
    id: 'huts',
    name: '小屋 (Hut)',
    description: '為無家可歸的流浪者提供遮風避雨之所。每座小屋可容納 4 名村民。',
    cost: (current) => ({
      wood: 100 + Math.floor(Math.pow(current, 1.4) * 50)
    }),
    maxCount: 20
  },
  {
    id: 'lodge',
    name: '狩獵小屋 (Lodge)',
    description: '深入森林狩獵的前進營地，解鎖獵人與陷阱師。',
    cost: () => ({
      wood: 200,
      fur: 10,
      meat: 5
    }),
    maxCount: 1,
    unlockRequirement: (_, res) => (res.wood || 0) >= 100 && (res.fur || 0) > 0 && (res.meat || 0) > 0
  },
  {
    id: 'tradingPost',
    name: '貿易站 (Trading Post)',
    description: '吸引過路商人，在此交易各類荒野物資。',
    cost: () => ({
      wood: 400,
      fur: 100
    }),
    maxCount: 1,
    unlockRequirement: (b) => (b.huts || 0) >= 1
  },
  {
    id: 'workshop',
    name: '工作坊 (Workshop)',
    description: '打造各類工具、防具與武器的專用作坊。',
    cost: () => ({
      wood: 400,
      leather: 100
    }),
    maxCount: 1,
    unlockRequirement: (_, res) => (res.wood >= 150 && res.leather >= 30) || res.fur >= 100
  },
  {
    id: 'tannery',
    name: '製革廠 (Tannery)',
    description: '讓製革工將粗糙毛皮加工成強韌皮革。',
    cost: () => ({
      wood: 300,
      fur: 150
    }),
    maxCount: 1,
    unlockRequirement: (_, res) => res.fur >= 50
  },
  {
    id: 'smokehouse',
    name: '燻肉房 (Smokehouse)',
    description: '將生肉燻製成不易腐敗的肉乾，是遠征冒險必備乾糧。',
    cost: () => ({
      wood: 600,
      meat: 200
    }),
    maxCount: 1,
    unlockRequirement: (_, res) => res.meat >= 50
  },
  {
    id: 'furnace',
    name: '熔爐 (Furnace)',
    description: '燃燒木材與煤炭，將鐵礦冶煉為高強度鋼鐵。',
    cost: () => ({
      wood: 1000,
      iron: 200
    }),
    maxCount: 1,
    unlockRequirement: (_, res) => res.iron >= 50
  },
  {
    id: 'armory',
    name: '軍械庫 (Armory)',
    description: '製造精良的鋼鐵武器與彈藥。',
    cost: () => ({
      wood: 1500,
      steel: 300
    }),
    maxCount: 1,
    unlockRequirement: (_, res) => res.steel >= 50
  }
];

export const WORKER_JOBS: WorkerJob[] = [
  {
    id: 'gatherers',
    name: '伐木者',
    description: '在村莊周圍採集木材。',
    production: { wood: 1 }, // 1 wood / 10s per worker
    consumption: {}
  },
  {
    id: 'hunters',
    name: '獵人',
    description: '深入森林狩獵，提供生肉與毛皮。',
    production: { meat: 0.5, fur: 0.5 }, // 0.5 meat, 0.5 fur / 10s
    consumption: {},
    requiredBuilding: 'lodge'
  },
  {
    id: 'trappers',
    name: '陷阱師',
    description: '製作誘餌並維護陷阱，消耗生肉轉化為誘餌。',
    production: { bait: 1 }, // 1 bait / 10s
    consumption: { meat: 1 }, // 1 meat / 10s
    requiredBuilding: 'lodge'
  },
  {
    id: 'tanners',
    name: '製革工 (Tanner)',
    description: '將毛皮加工為耐用皮革。',
    production: { leather: 2 },
    consumption: { fur: 5 },
    requiredBuilding: 'tannery'
  },
  {
    id: 'curedMeatMakers',
    name: '燻肉工 (Smoker)',
    description: '消耗木材將生肉燻製為肉乾。',
    production: { curedMeat: 2 },
    consumption: { meat: 4, wood: 5 },
    requiredBuilding: 'smokehouse'
  },
  {
    id: 'ironMiners',
    name: '鐵礦工 (Iron Miner)',
    description: '在鐵礦坑開採鐵礦（需先在荒野肅清廢棄鐵礦坑）。',
    production: { iron: 2 },
    consumption: { curedMeat: 1 },
    requiredBuilding: 'workshop',
    requiredLandmark: 'iron_mine_1'
  },
  {
    id: 'coalMiners',
    name: '煤礦工 (Coal Miner)',
    description: '在煤礦坑開採煤炭（需先在荒野肅清黑石煤礦）。',
    production: { coal: 2 },
    consumption: { curedMeat: 1 },
    requiredBuilding: 'furnace',
    requiredLandmark: 'coal_mine_1'
  },
  {
    id: 'steelworkers',
    name: '煉鋼工 (Steelworker)',
    description: '使用煤炭精煉鐵礦產出鋼材。',
    production: { steel: 1 },
    consumption: { iron: 2, coal: 2 },
    requiredBuilding: 'furnace'
  }
];

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'torches',
    name: '火把 (Torch)',
    description: '照亮陰暗洞穴與廢墟的必需品。',
    cost: { wood: 5, curedMeat: 1 },
    requiresWorkshop: true
  },
  {
    id: 'canteenLevel',
    name: '水壺升級 (Canteen Upgrade)',
    description: '擴充外出探索時的水量攜帶上限（每次升級 +15 水量）。',
    cost: { leather: 50, iron: 20 },
    maxCount: 5,
    isEquipment: true,
    requiresWorkshop: true
  },
  {
    id: 'cart',
    name: '貨車 (Cart)',
    description: '簡陋貨車，大幅提升手動伐木獲得的木材量 (每次採集 50 木材)。',
    cost: { wood: 30 },
    maxCount: 1,
    isEquipment: true
  },
  {
    id: 'wagon',
    name: '大型貨車 (Wagon)',
    description: '大幅提升手動伐木獲取量 (每次採集 100 木材)。',
    cost: { wood: 300, iron: 50 },
    maxCount: 1,
    isEquipment: true,
    requiresWorkshop: true
  },
  {
    id: 'compass',
    name: '指南針 (Compass)',
    description: '靈敏的磁針，解鎖荒野「大地圖探索」路線。',
    cost: { scales: 15, teeth: 10, fur: 30 },
    maxCount: 1,
    isEquipment: true
  },
  {
    id: 'boneSpear',
    name: '骨矛 (Bone Spear)',
    description: '使用獸骨磨製的長矛，攻擊力 3。',
    cost: { wood: 50, teeth: 15 },
    maxCount: 1,
    isEquipment: true,
    requiresWorkshop: true
  },
  {
    id: 'ironSword',
    name: '鐵劍 (Iron Sword)',
    description: '鋒利的鍛鐵單手劍，攻擊力 6。',
    cost: { iron: 100, leather: 30 },
    maxCount: 1,
    isEquipment: true,
    requiresWorkshop: true
  },
  {
    id: 'steelSword',
    name: '鋼劍 (Steel Sword)',
    description: '堅硬耐用的精鋼長劍，攻擊力 12。',
    cost: { steel: 150, leather: 50 },
    maxCount: 1,
    isEquipment: true,
    requiresWorkshop: true
  },
  {
    id: 'rifle',
    name: '獵槍 (Hunting Rifle)',
    description: '老舊但威力強大的手動步槍，攻擊力 25。消耗子彈。',
    cost: { steel: 200, iron: 100, wood: 100 },
    maxCount: 1,
    isEquipment: true,
    requiresWorkshop: true
  },
  {
    id: 'bullets',
    name: '彈藥 x10 (Bullets)',
    description: '獵槍使用的火藥子彈。',
    cost: { steel: 10, coal: 20 },
    requiresWorkshop: true
  }
];
