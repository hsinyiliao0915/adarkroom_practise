import { GameData, Buildings, Workers, Resources } from '../core/GameState';
import { BUILDING_RECIPES } from '../data/recipes';
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

  public getFreeVillagers(state: GameData): number {
    let assigned = 0;
    for (const count of Object.values(state.workers)) {
      assigned += count;
    }
    return Math.max(0, state.population - assigned);
  }

  public getMaxPopulation(state: GameData): number {
    return state.buildings.huts * 4;
  }

  public build(state: GameData, buildingId: keyof Buildings): boolean {
    const recipe = BUILDING_RECIPES.find((r) => r.id === buildingId);
    if (!recipe) return false;

    const currentCount = state.buildings[buildingId] || 0;
    if (recipe.maxCount && currentCount >= recipe.maxCount) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '已達到該建築物的建造上限。', 'warn');
      return false;
    }

    const costs = recipe.cost(currentCount);

    // Check afford
    for (const [resKey, amount] of Object.entries(costs)) {
      if ((state.resources[resKey as keyof Resources] || 0) < amount) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '資源不足，無法建造。', 'warn');
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

    EventBus.getInstance().emit(Events.LOG_MESSAGE, `成功建造了【${recipe.name}】。`, 'info');
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public assignWorker(state: GameData, job: keyof Workers, delta: number): boolean {
    const current = state.workers[job] || 0;
    const free = this.getFreeVillagers(state);

    if (delta > 0) {
      if (free < delta) return false;
      state.workers[job] = current + delta;
    } else if (delta < 0) {
      const reduceAmount = Math.min(current, Math.abs(delta));
      if (reduceAmount <= 0) return false;
      state.workers[job] = current - reduceAmount;
    }

    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }
}
