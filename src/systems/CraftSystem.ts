import { GameData, Resources } from '../core/GameState';
import { CRAFT_RECIPES } from '../data/recipes';
import { EventBus, Events } from '../core/EventBus';

export class CraftSystem {
  private static instance: CraftSystem;

  private constructor() {}

  public static getInstance(): CraftSystem {
    if (!CraftSystem.instance) {
      CraftSystem.instance = new CraftSystem();
    }
    return CraftSystem.instance;
  }

  public craft(state: GameData, recipeId: keyof Resources): boolean {
    const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;

    const currentCount = state.resources[recipeId] || 0;
    if (recipe.maxCount && currentCount >= recipe.maxCount) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '已達到該物品的製作上限。', 'warn');
      return false;
    }

    // Check unlock requirement guard
    if (recipe.unlockRequirement && !recipe.unlockRequirement(state.resources, state.buildings)) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '尚未達成該物品的解鎖條件。', 'warn');
      return false;
    }

    if (recipe.requiresWorkshop && (!state.buildings.workshop || state.buildings.workshop < 1)) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '需要建造工作坊才能製作此物品。', 'warn');
      return false;
    }

    // Check afford
    for (const [resKey, amount] of Object.entries(recipe.cost)) {
      if ((state.resources[resKey as keyof Resources] || 0) < amount) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, resKey === 'wood' ? '木頭不夠了。' : '資源不足，無法製作。', 'warn');
        return false;
      }
    }

    // Deduct
    for (const [resKey, amount] of Object.entries(recipe.cost)) {
      state.resources[resKey as keyof Resources] -= amount;
    }

    // Produce
    const gain = recipeId === 'bullets' ? 10 : 1;
    state.resources[recipeId] = currentCount + gain;

    if (recipeId === 'compass' && !state.unlockedTabs.map) {
      state.unlockedTabs.map = true;
      state.unlockedCompass = true;
      EventBus.getInstance().emit(Events.TAB_UNLOCKED, 'map');
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '指南針指示了方向，荒野【大地圖探索】已解鎖！', 'story');
    }

    if (recipeId === 'cart') {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '造好了一輛簡陋手推車，能運回更多木頭。', 'story');
    } else {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `成功製作了【${recipe.name}】。`, 'info');
    }
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }
}
