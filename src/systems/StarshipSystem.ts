import { GameData } from '../core/GameState';
import { EventBus, Events } from '../core/EventBus';

export interface UpgradeCost {
  alienAlloy: number;
  steel: number;
}

export class StarshipSystem {
  private static instance: StarshipSystem;

  private constructor() {}

  public static getInstance(): StarshipSystem {
    if (!StarshipSystem.instance) {
      StarshipSystem.instance = new StarshipSystem();
    }
    return StarshipSystem.instance;
  }

  public getHullUpgradeCost(currentLevel: number): UpgradeCost {
    // Level 0 -> 1: 1 alienAlloy, 100 steel (Basic repair to fly)
    // Level 1 -> 2: 2 alienAlloy, 175 steel
    // Level 2 -> 3: 4 alienAlloy, 250 steel
    if (currentLevel <= 0) {
      return { alienAlloy: 1, steel: 100 };
    }
    return {
      alienAlloy: Math.max(2, Math.floor(currentLevel * 2)),
      steel: Math.floor(100 + currentLevel * 75)
    };
  }

  public getEngineUpgradeCost(currentLevel: number): UpgradeCost {
    // Level 1 -> 2: 2 alienAlloy, 100 steel
    // Level 2 -> 3: 4 alienAlloy, 200 steel
    return {
      alienAlloy: Math.max(2, Math.floor(currentLevel * 2)),
      steel: Math.floor(currentLevel * 100)
    };
  }

  public getHullHealth(hullLevel: number): number {
    if (hullLevel <= 0) return 0;
    // Base 40 HP at level 1, +30 per additional level
    return 40 + (hullLevel - 1) * 30;
  }

  public getClimbSpeed(engineLevel: number): number {
    // Base 25 m/s at level 1, +10 m/s per additional level
    return 25 + Math.max(0, engineLevel - 1) * 10;
  }

  public canLaunch(state: GameData): boolean {
    return state.starship.unlocked && state.starship.hullLevel >= 1;
  }

  public upgradeHull(state: GameData): boolean {
    if (!state.starship.unlocked) return false;

    const cost = this.getHullUpgradeCost(state.starship.hullLevel);
    if ((state.resources.alienAlloy || 0) < cost.alienAlloy || (state.resources.steel || 0) < cost.steel) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '強化船體所需之外星合金或精鋼不足。', 'warn');
      return false;
    }

    state.resources.alienAlloy -= cost.alienAlloy;
    state.resources.steel -= cost.steel;
    state.starship.hullLevel += 1;

    const newHp = this.getHullHealth(state.starship.hullLevel);
    EventBus.getInstance().emit(
      Events.LOG_MESSAGE,
      `船體外殼強化完成！目前等級 ${state.starship.hullLevel}（最大防禦強度 ${newHp} HP）。`,
      'story'
    );
    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public upgradeEngine(state: GameData): boolean {
    if (!state.starship.unlocked) return false;

    const cost = this.getEngineUpgradeCost(state.starship.engineLevel);
    if ((state.resources.alienAlloy || 0) < cost.alienAlloy || (state.resources.steel || 0) < cost.steel) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '升級推進引擎所需之外星合金或精鋼不足。', 'warn');
      return false;
    }

    state.resources.alienAlloy -= cost.alienAlloy;
    state.resources.steel -= cost.steel;
    state.starship.engineLevel += 1;

    const newSpeed = this.getClimbSpeed(state.starship.engineLevel);
    EventBus.getInstance().emit(
      Events.LOG_MESSAGE,
      `推進引擎校準升級完成！目前等級 ${state.starship.engineLevel}（上升推力 ${newSpeed} m/s）。`,
      'story'
    );
    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }
}
