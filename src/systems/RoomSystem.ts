import { GameData, FireState, WarmthLevel } from '../core/GameState';
import { EventBus, Events } from '../core/EventBus';

export class RoomSystem {
  private static instance: RoomSystem;

  // Opening sequence timers (in seconds)
  private strangerArrivalTimer: number = -1;
  private forestUnlockTimer: number = -1;
  private strangerWarmTimer: number = 15;
  private strangerWarmStage: number = 0;
  private warmthPoints: number = 0;

  private constructor() {}

  public static getInstance(): RoomSystem {
    if (!RoomSystem.instance) {
      RoomSystem.instance = new RoomSystem();
    }
    return RoomSystem.instance;
  }

  public resetTimers(): void {
    this.strangerArrivalTimer = -1;
    this.forestUnlockTimer = -1;
    this.strangerWarmTimer = 15;
    this.strangerWarmStage = 0;
    this.warmthPoints = 0;
  }

  public lightFire(state: GameData): boolean {
    if (state.fireState !== 'dead') return false;

    // After forest is unlocked, lighting a dead fire costs 5 wood
    if (state.unlockedForest) {
      if (state.resources.wood < 5) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '沒有足夠的木頭來生火。', 'warn');
        return false;
      }
      state.resources.wood -= 5;
      EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    }

    state.fireFuel = 60;
    state.fireState = 'burning';
    
    EventBus.getInstance().emit(Events.LOG_MESSAGE, '火堆燃燒著。', 'story');
    
    // ONLY trigger stranger arrival if builder has never arrived
    if (state.strangerState === 'none' && !state.unlockedBuilder) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '火光映出窗外，投入黑暗之中。', 'story');
      this.strangerArrivalTimer = 8;
    }

    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public getWarmthMessage(warmthLevel: WarmthLevel): string {
    const warmthMap: Record<WarmthLevel, string> = {
      freezing: '房間寒冷刺骨。',
      cold: '房間很冷。',
      mild: '房間很宜人。',
      warm: '房間很暖和。'
    };
    return warmthMap[warmthLevel] || '房間很冷。';
  }

  private getFireMessage(fireState: FireState): string {
    const fireMap: Record<FireState, string> = {
      dead: '火堆熄滅了。',
      smoldering: '火堆開始冒煙。',
      flickering: '火堆冒出火苗。',
      burning: '火堆燃燒著。',
      roaring: '火堆熊熊燃燒。'
    };
    return fireMap[fireState] || '火堆燃燒著。';
  }

  public stokeFire(state: GameData): boolean {
    // Before forest is unlocked, stoking is free (twigs/leaves)
    if (!state.unlockedForest) {
      state.fireFuel = Math.min(100, state.fireFuel + 30);
      this.updateFireState(state);
      EventBus.getInstance().emit(Events.LOG_MESSAGE, this.getFireMessage(state.fireState), 'info');
      EventBus.getInstance().emit(Events.LOG_MESSAGE, this.getWarmthMessage(state.warmthLevel), 'info');
      EventBus.getInstance().emit(Events.STATE_CHANGED);
      return true;
    }

    // After forest is unlocked, stoking requires wood
    if (state.fireState === 'dead') {
      return this.lightFire(state);
    }

    if (state.resources.wood < 1) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '木頭不夠了。', 'warn');
      return false;
    }

    state.resources.wood -= 1;
    state.fireFuel = Math.min(100, state.fireFuel + 25);
    this.updateFireState(state);

    EventBus.getInstance().emit(Events.LOG_MESSAGE, this.getFireMessage(state.fireState), 'info');
    EventBus.getInstance().emit(Events.LOG_MESSAGE, this.getWarmthMessage(state.warmthLevel), 'info');
    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public tick(state: GameData, deltaSeconds: number): void {
    const oldFireState: FireState = state.fireState;

    // Authentic ADR: if builder is awake and fire is low, builder auto-stokes fire if wood available
    const hasBuilder = Boolean(state.unlockedBuilder) || state.strangerState === 'awake' || state.strangerState === 'helping';
    if (hasBuilder && state.resources.wood > 0 && state.fireState !== 'dead' && state.fireFuel <= 15) {
      state.resources.wood -= 1;
      state.fireFuel = Math.min(100, state.fireFuel + 25);
      this.updateFireState(state);
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '建造者添了些柴火。', 'info');
      EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
      EventBus.getInstance().emit(Events.STATE_CHANGED);
    }

    if (oldFireState !== 'dead') {
      // Fire fuel decays over time
      const decayRate = 0.5; // fuel per second
      state.fireFuel = Math.max(0, state.fireFuel - decayRate * deltaSeconds);
      this.updateFireState(state);

      if (state.fireState === 'dead') {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '壁爐裡的火熄滅了。屋內再次陷入刺骨寒冷。', 'warn');
        EventBus.getInstance().emit(Events.STATE_CHANGED);
      }
    }

    // Warmth level gradual adjustment based on fire heat points
    this.adjustWarmth(state, deltaSeconds);

    // 1. Opening sequence: Stranger arrival (only if builder hasn't arrived)
    if (this.strangerArrivalTimer > 0) {
      this.strangerArrivalTimer -= deltaSeconds;
      if (this.strangerArrivalTimer <= 0) {
        if (state.strangerState === 'none' && !state.unlockedBuilder) {
          state.strangerState = 'sleeping';
          this.strangerWarmStage = 1;
          this.strangerWarmTimer = 15;
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '一個衣衫襤褸的陌生人步履蹣跚地步入門來，癱倒在角落裡。', 'story');
          // Stranger arrived -> set forest unlock timer (~12 seconds)
          this.forestUnlockTimer = 12;
          EventBus.getInstance().emit(Events.STATE_CHANGED);
        }
      }
    }

    // 2. Opening sequence: Forest unlock & initial wood
    if (this.forestUnlockTimer > 0) {
      this.forestUnlockTimer -= deltaSeconds;
      if (this.forestUnlockTimer <= 0) {
        if (!state.unlockedForest) {
          state.resources.wood = 4;
          state.unlockedForest = true;
          state.unlockedTabs.forest = true;
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '屋外寒風呼嘯。', 'story');
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '木頭就快燒完了。', 'story');
          EventBus.getInstance().emit(Events.TAB_UNLOCKED, 'forest');
          EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
          EventBus.getInstance().emit(Events.STATE_CHANGED);
        }
      }
    }

    // 3. Stranger recovery / builder progression
    if (state.strangerState === 'sleeping' && (state.warmthLevel === 'mild' || state.warmthLevel === 'warm')) {
      if (this.strangerWarmStage === 0) {
        this.strangerWarmStage = 1;
      }
      this.strangerWarmTimer -= deltaSeconds;
      if (this.strangerWarmTimer <= 0) {
        if (this.strangerWarmStage === 1) {
          this.strangerWarmStage = 2;
          this.strangerWarmTimer = 15;
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '陌生人瑟瑟發抖，呢喃不已，聽不清在說些什麼。', 'story');
          EventBus.getInstance().emit(Events.STATE_CHANGED);
        } else if (this.strangerWarmStage === 2) {
          this.strangerWarmStage = 3;
          this.strangerWarmTimer = 15;
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '角落裡的陌生人不再顫抖了，她的呼吸平靜了下來。', 'story');
          EventBus.getInstance().emit(Events.STATE_CHANGED);
        } else if (this.strangerWarmStage === 3) {
          state.strangerState = 'awake';
          state.unlockedBuilder = true;
          state.unlockedTabs.village = true;
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '那名陌生人站在火堆旁。她說她可以幫忙。她說她會建造東西。', 'story');
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '建造者說她能夠製作陷阱來捕捉那些仍在野外活動的野獸。', 'story');
          EventBus.getInstance().emit(Events.LOG_MESSAGE, '建造者說她能夠製造出貨車，用來運載木頭。', 'story');
          EventBus.getInstance().emit(Events.TAB_UNLOCKED, 'village');
          EventBus.getInstance().emit(Events.STATE_CHANGED);
        }
      }
    }
  }

  private adjustWarmth(state: GameData, deltaSeconds: number): void {
    const oldLevel = state.warmthLevel;

    // Initialize warmthPoints from current state warmthLevel if needed
    if (this.warmthPoints === 0 && state.warmthLevel !== 'freezing') {
      const initPoints: Record<WarmthLevel, number> = {
        freezing: 0,
        cold: 35,
        mild: 65,
        warm: 95
      };
      this.warmthPoints = initPoints[state.warmthLevel] || 0;
    }

    // Accumulate warmth points depending on fire intensity
    if (state.fireState === 'roaring') {
      this.warmthPoints += 0.8 * deltaSeconds;
    } else if (state.fireState === 'burning') {
      this.warmthPoints += 0.4 * deltaSeconds;
    } else if (state.fireState === 'flickering') {
      if (this.warmthPoints > 35) this.warmthPoints -= 0.3 * deltaSeconds;
      else this.warmthPoints += 0.1 * deltaSeconds;
    } else if (state.fireState === 'smoldering') {
      this.warmthPoints -= 0.8 * deltaSeconds;
    } else if (state.fireState === 'dead') {
      this.warmthPoints -= 2.0 * deltaSeconds;
    }

    this.warmthPoints = Math.max(0, Math.min(100, this.warmthPoints));

    let newLevel: WarmthLevel = 'freezing';
    if (this.warmthPoints >= 85) {
      newLevel = 'warm';
    } else if (this.warmthPoints >= 55) {
      newLevel = 'mild';
    } else if (this.warmthPoints >= 25) {
      newLevel = 'cold';
    } else {
      newLevel = 'freezing';
    }

    state.warmthLevel = newLevel;

    if (newLevel !== oldLevel) {
      const warmthMsg: Record<WarmthLevel, string> = {
        freezing: '房間寒冷刺骨。',
        cold: '房間很冷。',
        mild: '房間很宜人。',
        warm: '房間很熱。'
      };
      EventBus.getInstance().emit(Events.LOG_MESSAGE, warmthMsg[newLevel], 'story');
      EventBus.getInstance().emit(Events.STATE_CHANGED);
    }
  }

  private updateFireState(state: GameData): void {
    if (state.fireFuel <= 0) {
      state.fireState = 'dead';
    } else if (state.fireFuel < 20) {
      state.fireState = 'smoldering';
    } else if (state.fireFuel < 50) {
      state.fireState = 'flickering';
    } else if (state.fireFuel < 85) {
      state.fireState = 'burning';
    } else {
      state.fireState = 'roaring';
    }
  }
}
