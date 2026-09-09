import { Enemy } from '../core/GameState';

export const WILDERNESS_ENEMIES: Record<string, Enemy> = {
  wild_dog: {
    name: '狂暴野狗',
    hp: 12,
    maxHp: 12,
    attack: 3,
    accuracy: 0.8,
    speed: 1.5,
    loot: { meat: 3, fur: 2, teeth: 1 }
  },
  scavenger: {
    name: '荒野拾荒者',
    hp: 18,
    maxHp: 18,
    attack: 4,
    accuracy: 0.75,
    speed: 1.8,
    loot: { curedMeat: 2, torches: 1, iron: 3 }
  },
  bandit: {
    name: '強盜劫掠者',
    hp: 28,
    maxHp: 28,
    attack: 6,
    accuracy: 0.8,
    speed: 2.0,
    loot: { curedMeat: 4, leather: 5, iron: 8, teeth: 2 }
  },
  mutant_beast: {
    name: '變異巨獸',
    hp: 45,
    maxHp: 45,
    attack: 10,
    accuracy: 0.7,
    speed: 2.5,
    loot: { meat: 10, fur: 8, teeth: 5, scales: 6 }
  },
  sniper: {
    name: '廢墟狙擊手',
    hp: 35,
    maxHp: 35,
    attack: 15,
    accuracy: 0.85,
    speed: 3.0,
    loot: { bullets: 8, steel: 5, curedMeat: 3 }
  },
  sentinel_drone: {
    name: '古老守衛機械',
    hp: 70,
    maxHp: 70,
    attack: 18,
    accuracy: 0.9,
    speed: 2.2,
    loot: { alienAlloy: 2, steel: 15, bullets: 10 }
  }
};
