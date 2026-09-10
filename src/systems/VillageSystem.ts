import { GameData, Buildings, Workers, Resources } from '../core/GameState';
import { BUILDING_RECIPES, WORKER_JOBS } from '../data/recipes';
import { EventBus, Events } from '../core/EventBus';

export class VillageSystem {
  private static instance: VillageSystem;

  private constructor() {}

  public static getInstance(): VillageSystem {
    if (!VillageSystem.instance) {
      VillageSystem.instance = new VillageSystem();
    }
    return VillageSystem.instance;
  }

  private popGrowthTimer: number = 0;
  private nextPopInterval: number = 15;

  public getNumGatherers(state: GameData): number {
    let nonGatherers = 0;
    for (const [k, v] of Object.entries(state.workers)) {
      if (k !== 'gatherers') {
        nonGatherers += (v || 0);
      }
    }
    return Math.max(0, state.population - nonGatherers);
  }

  public getFreeVillagers(state: GameData): number {
    return this.getNumGatherers(state);
  }

  public getMaxPopulation(state: GameData): number {
    return (state.buildings.huts || 0) * 4;
  }

  public tick(state: GameData, deltaSeconds: number): void {
    const maxPop = this.getMaxPopulation(state);
    if ((state.buildings.huts || 0) <= 0 || state.population >= maxPop) {
      this.popGrowthTimer = 0;
      return;
    }

    this.popGrowthTimer += deltaSeconds;
    if (this.popGrowthTimer >= this.nextPopInterval) {
      this.popGrowthTimer = 0;
      this.nextPopInterval = 15 + Math.random() * 15;

      const space = maxPop - state.population;
      if (space > 0) {
        let num = Math.floor(Math.random() * (space / 2) + space / 2);
        if (num <= 0) num = 1;
        num = Math.min(space, num);

        state.population += num;
        state.workers.gatherers = this.getNumGatherers(state);

        if (num === 1) {
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '陌生人在夜裡抵達。', 'story');
        } else if (num < 5) {
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '一戶飽經風雨的人家住進一棟小屋。', 'story');
        } else if (num < 10) {
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '一小隊人風塵僕僕地抵達。', 'story');
        } else {
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '村落越發興旺，消息不脛而走。', 'story');
        }
        EventBus.getInstance().emit(Events.STATE_CHANGED);
      }
    }
  }

  public build(state: GameData, buildingId: keyof Buildings): boolean {
    const recipe = BUILDING_RECIPES.find((r) => r.id === buildingId);
    if (!recipe) return false;

    const currentCount = state.buildings[buildingId] || 0;
    if (recipe.maxCount && currentCount >= recipe.maxCount) {
      if (buildingId === 'traps') {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '再增加陷阱已毫無裨益。', 'warn');
      } else {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '已達到該建築物的建造上限。', 'warn');
      }
      return false;
    }

    // Check unlock requirement guard
    if (recipe.unlockRequirement && !recipe.unlockRequirement(state.buildings, state.resources)) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '尚未達成該建築的建造前置條件。', 'warn');
      return false;
    }

    const costs = recipe.cost(currentCount);

    // Check afford
    const resNameMap: Record<string, string> = {
      wood: '木頭',
      fur: '毛皮',
      meat: '肉',
      curedMeat: '肉乾',
      leather: '皮革',
      teeth: '牙齒',
      scales: '鱗片',
      iron: '精鐵',
      coal: '煤炭',
      steel: '鋼材'
    };

    for (const [resKey, amount] of Object.entries(costs)) {
      if ((state.resources[resKey as keyof Resources] || 0) < amount) {
        const name = resNameMap[resKey] || resKey;
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `${name}不夠了。`, 'warn');
        return false;
      }
    }

    // Deduct
    for (const [resKey, amount] of Object.entries(costs)) {
      state.resources[resKey as keyof Resources] -= amount;
    }

    // Increase
    state.buildings[buildingId] = currentCount + 1;

    if (buildingId === 'traps' && !state.unlockedTraps) {
      state.unlockedTraps = true;
    }

    if (buildingId === 'workshop' && !state.unlockedTabs.craft) {
      state.unlockedTabs.craft = true;
      EventBus.getInstance().emit(Events.TAB_UNLOCKED, 'craft');
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '工作坊建造完成，解鎖了【製造】功能。', 'story');
    }

    if (buildingId === 'traps') {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '陷阱越多，抓到的獵物就越多。', 'story');
    } else if (buildingId === 'huts') {
      if (currentCount === 0) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '建造者在林中建起一棟小屋，她說消息很快就會流傳出去。', 'story');
      } else {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '一棟新小屋建成了。', 'story');
      }
    } else if (buildingId === 'lodge') {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '假如工具齊備，村民也能幫忙狩獵。', 'story');
    } else {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `成功建造了【${recipe.name}】。`, 'info');
    }
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public assignWorker(state: GameData, job: keyof Workers, delta: number): boolean {
    if (job === 'gatherers') return false; // Gatherers is automatic default pool

    const current = state.workers[job] || 0;
    const free = this.getNumGatherers(state);

    if (delta > 0) {
      const jobDef = WORKER_JOBS.find((j) => j.id === job);
      if (jobDef?.requiredBuilding) {
        const hasBuilding = (state.buildings[jobDef.requiredBuilding] || 0) > 0;
        if (!hasBuilding) {
          EventBus.getInstance().emit(Events.LOG_MESSAGE, `需要建造相應設施才能指派【${jobDef.name}】。`, 'warn');
          return false;
        }
      }
      if (jobDef?.requiredLandmark) {
        const hasCleared = state.clearedLandmarks.includes(jobDef.requiredLandmark);
        if (!hasCleared) {
          EventBus.getInstance().emit(Events.LOG_MESSAGE, `需要先在荒野肅清對應礦坑才能指派【${jobDef.name}】。`, 'warn');
          return false;
        }
      }
      const actualAdd = Math.min(free, delta);
      if (actualAdd <= 0) return false;
      state.workers[job] = current + actualAdd;
    } else if (delta < 0) {
      const reduceAmount = Math.min(current, Math.abs(delta));
      if (reduceAmount <= 0) return false;
      state.workers[job] = current - reduceAmount;
    }

    state.workers.gatherers = this.getNumGatherers(state);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }
}
