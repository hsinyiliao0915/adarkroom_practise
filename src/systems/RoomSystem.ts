import { GameData, FireState } from '../core/GameState';
import { EventBus, Events } from '../core/EventBus';

export class RoomSystem {
  private static instance: RoomSystem;

  private constructor() {}

  public static getInstance(): RoomSystem {
    if (!RoomSystem.instance) {
      RoomSystem.instance = new RoomSystem();
    }
    return RoomSystem.instance;
  }

  public lightFire(state: GameData): boolean {
    if (state.fireState !== 'dead') return false;

    state.fireFuel = 30;
    state.fireState = 'smoldering';
    state.warmthLevel = 'cold';
    if (state.resources.wood === 0) {
      state.resources.wood = 4;
    }
    
    EventBus.getInstance().emit(Events.LOG_MESSAGE, '火苗在壁爐中微弱地燃起。冷風稍微被驅散了。', 'story');
    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public stokeFire(state: GameData): boolean {
    if (state.resources.wood < 1 && state.fireState === 'dead') {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '沒有木材可以生火。', 'warn');
      return false;
    }

    if (state.fireState === 'dead') {
      if (state.resources.wood >= 5) {
        state.resources.wood -= 5;
        state.fireFuel = 40;
        state.fireState = 'flickering';
        state.warmthLevel = 'cold';
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '用剩餘的木柴重新點燃了壁爐。', 'story');
        EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
        EventBus.getInstance().emit(Events.STATE_CHANGED);
        return true;
      } else {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '需要至少 5 根木材才能重新點燃熄滅的壁爐。', 'warn');
        return false;
      }
    }

    if (state.resources.wood < 1) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '木柴耗盡了。', 'warn');
      return false;
    }

    state.resources.wood -= 1;
    state.fireFuel = Math.min(100, state.fireFuel + 25);
    this.updateFireState(state);

    if (!state.unlockedForest) {
      state.unlockedForest = true;
      state.unlockedTabs.forest = true;
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '庫存的乾柴不多了。必須踏入外面的森林採集木材。', 'story');
      EventBus.getInstance().emit(Events.TAB_UNLOCKED, 'forest');
    }

    EventBus.getInstance().emit(Events.LOG_MESSAGE, '你向壁爐中添了一根木柴。火光跳躍著。', 'info');
    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public tick(state: GameData, deltaSeconds: number): void {
    const oldFireState: FireState = state.fireState;
    if (oldFireState === 'dead') {
      state.warmthLevel = 'freezing';
      return;
    }

    // Fire fuel decays over time
    const decayRate = 1.0; // fuel per second
    state.fireFuel = Math.max(0, state.fireFuel - decayRate * deltaSeconds);

    this.updateFireState(state);

    if (state.fireState === 'dead') {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '壁爐裡的火熄滅了。屋內再次陷入刺骨的寒冷。', 'warn');
    }

    if (state.fireState !== 'dead' && state.resources.wood <= 1 && !state.unlockedForest) {
      state.unlockedForest = true;
      state.unlockedTabs.forest = true;
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '庫存的乾柴快要燒完了。必須踏入外面的森林採集木材。', 'story');
      EventBus.getInstance().emit(Events.TAB_UNLOCKED, 'forest');
    }

    // Stranger arrival trigger
    if (state.strangerState === 'none' && (state.warmthLevel === 'mild' || state.warmthLevel === 'warm')) {
      if (Math.random() < 0.05 * deltaSeconds) {
        state.strangerState = 'sleeping';
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '門外傳來虛弱的敲門聲。一名昏迷的旅人倒在門檻上，你將她扶至壁爐旁。', 'story');
      }
    } else if (state.strangerState === 'sleeping' && state.warmthLevel === 'warm') {
      if (Math.random() < 0.08 * deltaSeconds) {
        state.strangerState = 'awake';
        state.unlockedTabs.village = true;
        state.unlockedForest = true;
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '旅人醒來了。她自稱是一位建造者，願意協助你在這片荒蕪之地建立聚落。', 'story');
        EventBus.getInstance().emit(Events.TAB_UNLOCKED, 'village');
      }
    }
  }

  private updateFireState(state: GameData): void {
    if (state.fireFuel <= 0) {
      state.fireState = 'dead';
      state.warmthLevel = 'freezing';
    } else if (state.fireFuel < 20) {
      state.fireState = 'smoldering';
      state.warmthLevel = 'cold';
    } else if (state.fireFuel < 50) {
      state.fireState = 'flickering';
      state.warmthLevel = 'mild';
    } else if (state.fireFuel < 85) {
      state.fireState = 'burning';
      state.warmthLevel = 'warm';
    } else {
      state.fireState = 'roaring';
      state.warmthLevel = 'warm';
    }
  }
}
