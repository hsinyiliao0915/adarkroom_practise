import { GameData, Landmark, Enemy, Resources, ExpeditionState } from '../core/GameState';
import { WILDERNESS_ENEMIES } from '../data/enemies';
import { EventBus, Events } from '../core/EventBus';

export const MAP_SIZE = 41;
export const SPAWN_POINT = { x: 20, y: 20 };

export interface WeaponConfig {
  id: 'fists' | 'boneSpear' | 'ironSword' | 'steelSword' | 'rifle';
  name: string;
  damage: number;
  cooldownMs: number;
  requiresBullet?: boolean;
  requiredResource?: keyof Resources;
}

export const WEAPON_CONFIGS: Record<string, WeaponConfig> = {
  fists: { id: 'fists', name: '拳頭', damage: 2, cooldownMs: 2000 },
  boneSpear: { id: 'boneSpear', name: '獸骨長矛', damage: 4, cooldownMs: 1500, requiredResource: 'boneSpear' },
  ironSword: { id: 'ironSword', name: '鋒利鐵劍', damage: 8, cooldownMs: 2500, requiredResource: 'ironSword' },
  steelSword: { id: 'steelSword', name: '精鋼長劍', damage: 14, cooldownMs: 2500, requiredResource: 'steelSword' },
  rifle: { id: 'rifle', name: '獵槍', damage: 30, cooldownMs: 4000, requiresBullet: true, requiredResource: 'rifle' }
};

export class MapSystem {
  private static instance: MapSystem;
  private landmarks: Landmark[] = [];

  private constructor() {
    this.generateWorldLandmarks();
  }

  public static getInstance(): MapSystem {
    if (!MapSystem.instance) {
      MapSystem.instance = new MapSystem();
    }
    return MapSystem.instance;
  }

  private generateWorldLandmarks(): void {
    // Procedural/deterministic placement of landmarks relative to spawn
    this.landmarks = [
      {
        id: 'iron_mine_1',
        name: '廢棄鐵礦坑 (I)',
        type: 'iron_mine',
        x: 17,
        y: 18,
        cleared: false,
        loot: { iron: 40, wood: 20 },
        description: '被遺棄的地下礦坑，隨處可見生鏽的開採工具與高純度鐵礦石。'
      },
      {
        id: 'abandoned_town_1',
        name: '荒蕪小鎮 (V)',
        type: 'abandoned_town',
        x: 23,
        y: 17,
        cleared: false,
        loot: { curedMeat: 10, leather: 15, torches: 3 },
        description: '一座倒塌的舊時代聚落，在廢墟斷垣間搜刮到了珍貴的物資。',
        isOutpost: true
      },
      {
        id: 'coal_mine_1',
        name: '黑石煤礦 (C)',
        type: 'coal_mine',
        x: 16,
        y: 25,
        cleared: false,
        loot: { coal: 50, iron: 20 },
        description: '佈滿黑煤灰的深坑，散發著硫磺的刺鼻氣味。'
      },
      {
        id: 'outpost_1',
        name: '軍事哨所 (O)',
        type: 'outpost',
        x: 26,
        y: 24,
        cleared: false,
        loot: { steel: 30, bullets: 25, rifle: 1 },
        description: '用鋼筋混凝土加固的舊哨站，重型軍械箱中依然保存著步槍與軍規鋼材。',
        isOutpost: true
      },
      {
        id: 'ruined_city_1',
        name: '傾頹大都市 (R)',
        type: 'ruined_city',
        x: 28,
        y: 14,
        cleared: false,
        loot: { steel: 80, alienAlloy: 1, bullets: 30 },
        description: '高聳的摩天樓骨架在黃沙中矗立，這裡曾是繁華的文明核心。'
      },
      {
        id: 'cave_1',
        name: '幽暗洞穴 (X)',
        type: 'cave',
        x: 13,
        y: 15,
        cleared: false,
        loot: { teeth: 20, scales: 15, curedMeat: 12 },
        description: '深不見底的天然鐘乳石洞，盤踞著巨大的變異野獸群。',
        requiresTorch: true
      },
      {
        id: 'crashed_starship',
        name: '墜毀的外星巡航艦 (★)',
        type: 'crashed_starship',
        x: 32,
        y: 30,
        cleared: false,
        loot: { alienAlloy: 10, steel: 100 },
        description: '半埋於沙丘中的未知星艦殘骸，反應爐依然閃爍著微光。'
      }
    ];
  }

  public getLandmarks(): Landmark[] {
    return this.landmarks;
  }

  public getLandmarkAt(x: number, y: number): Landmark | undefined {
    return this.landmarks.find((l) => l.x === x && l.y === y);
  }

  public startExpedition(state: GameData, curedMeatTaken: number, torchesTaken: number): boolean {
    if (state.expedition.active) return false;
    if (state.resources.curedMeat < curedMeatTaken || state.resources.torches < torchesTaken) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '攜帶物資不足。', 'warn');
      return false;
    }

    state.resources.curedMeat -= curedMeatTaken;
    state.resources.torches -= torchesTaken;

    // Calculate max water capacity from canteen upgrade
    const maxWater = 10 + (state.resources.canteenLevel || 0) * 15;

    // Pick best weapon
    let weapon: ExpeditionState['weapon'] = 'fists';
    let bulletsTaken = 0;
    if (state.resources.rifle > 0 && state.resources.bullets > 0) {
      weapon = 'rifle';
      bulletsTaken = state.resources.bullets;
      state.resources.bullets = 0;
    } else if (state.resources.steelSword > 0) weapon = 'steelSword';
    else if (state.resources.ironSword > 0) weapon = 'ironSword';
    else if (state.resources.boneSpear > 0) weapon = 'boneSpear';

    state.expedition = {
      active: true,
      x: SPAWN_POINT.x,
      y: SPAWN_POINT.y,
      hp: 20,
      maxHp: 20,
      water: maxWater,
      maxWater: maxWater,
      curedMeat: curedMeatTaken,
      torches: torchesTaken,
      weapon,
      bullets: bulletsTaken,
      carriedLoot: {},
      inCombat: false,
      enemy: null,
      combatLog: [],
      weaponCooldowns: {},
      enemyAttackCooldown: 0,
      enemyMaxAttackCooldown: 0
    };

    if (!state.visitedTiles.includes(`${SPAWN_POINT.x},${SPAWN_POINT.y}`)) {
      state.visitedTiles.push(`${SPAWN_POINT.x},${SPAWN_POINT.y}`);
    }

    EventBus.getInstance().emit(Events.LOG_MESSAGE, '你收拾行囊，踏上了荒涼的大地圖探索之路。', 'story');
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public move(state: GameData, dx: number, dy: number): boolean {
    if (!state.expedition.active || state.expedition.inCombat) return false;

    const newX = state.expedition.x + dx;
    const newY = state.expedition.y + dy;

    if (newX < 0 || newX >= MAP_SIZE || newY < 0 || newY >= MAP_SIZE) {
      return false;
    }

    // Returning to Village (Home)
    if (newX === SPAWN_POINT.x && newY === SPAWN_POINT.y) {
      this.returnHome(state);
      return true;
    }

    state.expedition.x = newX;
    state.expedition.y = newY;

    const key = `${newX},${newY}`;
    if (!state.visitedTiles.includes(key)) {
      state.visitedTiles.push(key);
    }

    // Water Consumption per step
    if (state.expedition.water > 0) {
      state.expedition.water -= 1;
    } else {
      // Dehydrated
      state.expedition.hp -= 2;
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '水壺乾涸了，極度乾渴正在侵蝕你的體力！(-2 生命值)', 'warn');
      if (state.expedition.hp <= 0) {
        this.dieInWilderness(state);
        return false;
      }
    }

    // Outpost water replenishment
    const currentLm = this.getLandmarkAt(newX, newY);
    if (currentLm && currentLm.isOutpost && state.clearedLandmarks.includes(currentLm.id)) {
      if (state.expedition.water < state.expedition.maxWater) {
        state.expedition.water = state.expedition.maxWater;
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `你在【${currentLm.name}】前哨站清泉旁歇息，水壺已全部裝滿。`, 'info');
      }
    }

    // Check landmark
    const landmark = this.getLandmarkAt(newX, newY);
    if (landmark && !state.clearedLandmarks.includes(landmark.id)) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `發現地標【${landmark.name}】！${landmark.description}`, 'story');
    } else {
      // Random combat encounter check
      const distFromSpawn = Math.hypot(newX - SPAWN_POINT.x, newY - SPAWN_POINT.y);
      const encounterChance = Math.min(0.35, 0.15 + distFromSpawn * 0.015);

      if (Math.random() < encounterChance) {
        this.triggerRandomCombat(state, distFromSpawn);
      }
    }

    EventBus.getInstance().emit(Events.MAP_MOVED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public eatCuredMeat(state: GameData): boolean {
    if (!state.expedition.active) return false;
    if (state.expedition.curedMeat <= 0) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '背包中沒有肉乾了。', 'warn');
      return false;
    }
    if (state.expedition.hp >= state.expedition.maxHp) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '你的生命值已是全滿狀態。', 'info');
      return false;
    }

    state.expedition.curedMeat -= 1;
    const healAmount = 10;
    state.expedition.hp = Math.min(state.expedition.maxHp, state.expedition.hp + healAmount);
    EventBus.getInstance().emit(Events.LOG_MESSAGE, `你吃下一塊肉乾，恢復了 ${healAmount} 點生命值。(當前: ${state.expedition.hp}/${state.expedition.maxHp})`, 'story');
    if (state.expedition.inCombat) {
      state.expedition.combatLog.push(`吃下肉乾，恢復了 ${healAmount} 點生命值！`);
    }
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public scavengeLandmark(state: GameData): void {
    if (!state.expedition.active || state.expedition.inCombat) return;

    const landmark = this.getLandmarkAt(state.expedition.x, state.expedition.y);
    if (!landmark || state.clearedLandmarks.includes(landmark.id)) return;

    if (landmark.requiresTorch) {
      if ((state.expedition.torches || 0) < 1) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `【${landmark.name}】深處漆黑一片，需要攜帶火把才能進入探索。`, 'warn');
        return;
      }
      state.expedition.torches -= 1;
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `你點燃了一支火把照亮深邃通道。(-1 火把)`, 'info');
    }

    if (landmark.loot) {
      for (const [key, amount] of Object.entries(landmark.loot)) {
        const k = key as keyof Resources;
        state.expedition.carriedLoot[k] = (state.expedition.carriedLoot[k] || 0) + (amount || 0);
      }
    }

    state.clearedLandmarks.push(landmark.id);
    EventBus.getInstance().emit(Events.LOG_MESSAGE, `你搜索了【${landmark.name}】，搜颳到了豐富的戰利品並放入背包！`, 'story');

    if (landmark.isOutpost) {
      state.expedition.water = state.expedition.maxWater;
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `此處已被建立為前哨基地，水壺已全部裝滿！`, 'story');
    }

    if (landmark.id === 'crashed_starship') {
      if (!state.starship) {
        state.starship = { unlocked: true, hullLevel: 0, engineLevel: 1, clearedEscape: false };
      } else {
        state.starship.unlocked = true;
      }
      state.unlockedTabs.ship = true;
      EventBus.getInstance().emit(Events.TAB_UNLOCKED, 'ship');
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '已尋獲並啟動外星巡航艦殘骸！解鎖了頂部【星艦】維修分頁。', 'story');
    }

    EventBus.getInstance().emit(Events.STATE_CHANGED);
  }

  private triggerRandomCombat(state: GameData, dist: number): void {
    let enemyKey = 'wild_dog';
    if (dist > 15) {
      const highPool = ['mutant_beast', 'sniper', 'sentinel_drone'];
      enemyKey = highPool[Math.floor(Math.random() * highPool.length)];
    } else if (dist > 8) {
      const midPool = ['scavenger', 'bandit', 'wild_dog'];
      enemyKey = midPool[Math.floor(Math.random() * midPool.length)];
    }

    const template = WILDERNESS_ENEMIES[enemyKey];
    if (!template) return;

    const enemy: Enemy = {
      name: template.name,
      hp: template.hp,
      maxHp: template.maxHp,
      attack: template.attack,
      accuracy: template.accuracy,
      speed: template.speed,
      loot: { ...template.loot }
    };

    const interval = Math.max(800, Math.round(3000 / enemy.speed));
    state.expedition.inCombat = true;
    state.expedition.enemy = enemy;
    state.expedition.enemyAttackCooldown = interval;
    state.expedition.enemyMaxAttackCooldown = interval;
    state.expedition.weaponCooldowns = {};
    state.expedition.combatLog = [`遭遇了【${enemy.name}】！進入戰鬥。`];

    EventBus.getInstance().emit(Events.LOG_MESSAGE, `荒野中竄出了【${enemy.name}】！`, 'warn');
    EventBus.getInstance().emit(Events.COMBAT_EVENT);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
  }

  public updateCombat(delta: number, state: GameData): void {
    if (!state.expedition.active || !state.expedition.inCombat || !state.expedition.enemy) return;

    // Player weapon cooldowns
    if (!state.expedition.weaponCooldowns) state.expedition.weaponCooldowns = {};
    for (const k of Object.keys(state.expedition.weaponCooldowns)) {
      state.expedition.weaponCooldowns[k] = Math.max(0, state.expedition.weaponCooldowns[k] - delta);
    }

    // Enemy attack timer
    state.expedition.enemyAttackCooldown -= delta;
    if (state.expedition.enemyAttackCooldown <= 0) {
      state.expedition.enemyAttackCooldown = state.expedition.enemyMaxAttackCooldown;
      const enemy = state.expedition.enemy;
      if (Math.random() < enemy.accuracy) {
        state.expedition.hp -= enemy.attack;
        state.expedition.combatLog.push(`【${enemy.name}】向你撲來，造成 ${enemy.attack} 點傷害！`);
      } else {
        state.expedition.combatLog.push(`【${enemy.name}】的攻擊落空了！`);
      }

      if (state.expedition.hp <= 0) {
        this.dieInWilderness(state);
        return;
      }
      EventBus.getInstance().emit(Events.STATE_CHANGED);
    }
  }

  public attackWithWeapon(state: GameData, weaponId: string): boolean {
    if (!state.expedition.inCombat || !state.expedition.enemy) return false;
    const config = WEAPON_CONFIGS[weaponId];
    if (!config) return false;

    if ((state.expedition.weaponCooldowns?.[weaponId] || 0) > 0) return false;

    if (config.requiresBullet) {
      if ((state.expedition.bullets || 0) < 1) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '彈藥耗盡，無法開火！', 'warn');
        return false;
      }
      state.expedition.bullets -= 1;
      state.resources.bullets = Math.max(0, state.resources.bullets - 1);
    }

    const enemy = state.expedition.enemy;
    enemy.hp -= config.damage;
    if (!state.expedition.weaponCooldowns) state.expedition.weaponCooldowns = {};
    state.expedition.weaponCooldowns[weaponId] = config.cooldownMs;
    state.expedition.combatLog.push(`你使用【${config.name}】攻擊，造成 ${config.damage} 點傷害！`);

    // Enemy dead
    if (enemy.hp <= 0) {
      state.expedition.inCombat = false;
      state.expedition.combatLog.push(`【${enemy.name}】倒下了！戰鬥勝利。`);

      for (const [key, amount] of Object.entries(enemy.loot)) {
        const k = key as keyof Resources;
        state.expedition.carriedLoot[k] = (state.expedition.carriedLoot[k] || 0) + (amount || 0);
      }

      EventBus.getInstance().emit(Events.LOG_MESSAGE, `擊敗了【${enemy.name}】，獲得了戰利品。`, 'info');
      state.expedition.enemy = null;
      EventBus.getInstance().emit(Events.STATE_CHANGED);
      return true;
    }

    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public attackEnemy(state: GameData): void {
    if (!state.expedition.inCombat || !state.expedition.enemy) return;

    // Pick best ready weapon for compatibility
    const candidates = ['rifle', 'steelSword', 'ironSword', 'boneSpear', 'fists'];
    for (const w of candidates) {
      const cfg = WEAPON_CONFIGS[w];
      if (!cfg) continue;
      if (cfg.requiredResource && (state.resources[cfg.requiredResource] || 0) <= 0) continue;
      if (cfg.requiresBullet && (state.expedition.bullets || 0) <= 0) continue;
      if ((state.expedition.weaponCooldowns?.[w] || 0) <= 0) {
        this.attackWithWeapon(state, w);
        return;
      }
    }
  }

  public fleeCombat(state: GameData): boolean {
    if (!state.expedition.inCombat) return false;

    if (Math.random() < 0.6) {
      state.expedition.inCombat = false;
      state.expedition.enemy = null;
      state.expedition.combatLog.push('你成功擺脫了敵人，狼狽逃離！');
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '你成功逃脫了戰鬥。', 'info');
      EventBus.getInstance().emit(Events.STATE_CHANGED);
      return true;
    } else {
      state.expedition.combatLog.push('逃跑失敗！');
      if (state.expedition.enemy) {
        state.expedition.hp -= state.expedition.enemy.attack;
        if (state.expedition.hp <= 0) {
          this.dieInWilderness(state);
          return false;
        }
      }
      EventBus.getInstance().emit(Events.STATE_CHANGED);
      return false;
    }
  }

  public returnHome(state: GameData): void {
    if (!state.expedition.active) return;

    // Deposit all carried loot
    let lootDesc: string[] = [];
    for (const [key, amount] of Object.entries(state.expedition.carriedLoot)) {
      const k = key as keyof Resources;
      state.resources[k] = (state.resources[k] || 0) + (amount || 0);
      lootDesc.push(`${k}: +${amount}`);
    }

    // Return remaining cured meat, torches, and bullets
    state.resources.curedMeat += state.expedition.curedMeat;
    state.resources.torches += state.expedition.torches;
    state.resources.bullets = (state.resources.bullets || 0) + (state.expedition.bullets || 0);

    state.expedition.active = false;
    state.expedition.x = SPAWN_POINT.x;
    state.expedition.y = SPAWN_POINT.y;
    state.expedition.curedMeat = 0;
    state.expedition.torches = 0;
    state.expedition.bullets = 0;
    state.expedition.inCombat = false;
    state.expedition.enemy = null;
    state.expedition.carriedLoot = {};
    state.expedition.combatLog = [];
    state.expedition.weaponCooldowns = {};
    state.expedition.enemyAttackCooldown = 0;
    state.expedition.enemyMaxAttackCooldown = 0;

    EventBus.getInstance().emit(Events.LOG_MESSAGE, `你平安返回了聚落！卸下了所有探索獲得的物資。`, 'story');
    EventBus.getInstance().emit(Events.STATE_CHANGED);
  }

  public dieInWilderness(state: GameData): void {
    state.expedition.active = false;
    state.expedition.x = SPAWN_POINT.x;
    state.expedition.y = SPAWN_POINT.y;
    state.expedition.hp = 0;
    state.expedition.water = 0;
    state.expedition.curedMeat = 0;
    state.expedition.torches = 0;
    state.expedition.bullets = 0;
    state.expedition.inCombat = false;
    state.expedition.enemy = null;
    state.expedition.carriedLoot = {};
    state.expedition.combatLog = [];
    state.expedition.weaponCooldowns = {};
    state.expedition.enemyAttackCooldown = 0;
    state.expedition.enemyMaxAttackCooldown = 0;

    EventBus.getInstance().emit(Events.LOG_MESSAGE, '你在殘酷的荒野中倒下了...背包中的所有戰利品遺失，你被村民救回了小屋。', 'warn');
    EventBus.getInstance().emit(Events.STATE_CHANGED);
  }
}
