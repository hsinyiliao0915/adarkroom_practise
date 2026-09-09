import { GameData } from '../core/GameState';
import { RoomSystem } from './RoomSystem';
import { ResourceSystem } from './ResourceSystem';
import { EventBus, Events } from '../core/EventBus';

export class DevAutoSystem {
  private static instance: DevAutoSystem;
  private enabled: boolean = false;

  private stokeCooldownMs: number = 0;
  private gatherCooldownMs: number = 0;
  private checkTrapsCooldownMs: number = 0;

  public static readonly STOKE_INTERVAL_MS = 10000;
  public static readonly GATHER_INTERVAL_MS = 60000;
  public static readonly TRAP_INTERVAL_MS = 90000;

  private unsubActions: Array<() => void> = [];

  private constructor() {
    // When manual actions happen, sync cooldowns so auto doesn't double trigger
    this.unsubActions.push(
      EventBus.getInstance().on(Events.ACTION_STOKE_FIRE, () => {
        this.stokeCooldownMs = DevAutoSystem.STOKE_INTERVAL_MS;
      })
    );
    this.unsubActions.push(
      EventBus.getInstance().on(Events.ACTION_GATHER_WOOD, () => {
        this.gatherCooldownMs = DevAutoSystem.GATHER_INTERVAL_MS;
      })
    );
    this.unsubActions.push(
      EventBus.getInstance().on(Events.ACTION_CHECK_TRAPS, () => {
        this.checkTrapsCooldownMs = DevAutoSystem.TRAP_INTERVAL_MS;
      })
    );
  }

  public static getInstance(): DevAutoSystem {
    if (!DevAutoSystem.instance) {
      DevAutoSystem.instance = new DevAutoSystem();
    }
    return DevAutoSystem.instance;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    EventBus.getInstance().emit(Events.AUTO_MODE_CHANGED, this.enabled);
    if (this.enabled) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '自動模式已啟動（將自動添柴、拾柴與收陷阱）。', 'info');
    } else {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '自動模式已關閉。', 'info');
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public resetCooldowns(): void {
    this.stokeCooldownMs = 0;
    this.gatherCooldownMs = 0;
    this.checkTrapsCooldownMs = 0;
  }

  public update(delta: number, state: GameData): void {
    if (!this.enabled || !state) return;

    if (this.stokeCooldownMs > 0) {
      this.stokeCooldownMs -= delta;
    }
    if (this.gatherCooldownMs > 0) {
      this.gatherCooldownMs -= delta;
    }
    if (this.checkTrapsCooldownMs > 0) {
      this.checkTrapsCooldownMs -= delta;
    }

    // 1. Auto Fire handling
    if (this.stokeCooldownMs <= 0) {
      if (state.fireState === 'dead') {
        RoomSystem.getInstance().lightFire(state);
        this.stokeCooldownMs = DevAutoSystem.STOKE_INTERVAL_MS;
        EventBus.getInstance().emit(Events.ACTION_STOKE_FIRE);
      } else if (state.fireState === 'flickering' || state.fireState === 'smoldering' || (state.fireFuel <= 35 && state.fireState !== 'roaring')) {
        const canStoke = !state.unlockedForest || state.resources.wood >= 1;
        if (canStoke) {
          const success = RoomSystem.getInstance().stokeFire(state);
          if (success) {
            this.stokeCooldownMs = DevAutoSystem.STOKE_INTERVAL_MS;
            EventBus.getInstance().emit(Events.ACTION_STOKE_FIRE);
          }
        }
      }
    }

    // 2. Auto Gather Wood handling
    if (this.gatherCooldownMs <= 0 && state.unlockedForest) {
      ResourceSystem.getInstance().gatherWood(state);
      this.gatherCooldownMs = DevAutoSystem.GATHER_INTERVAL_MS;
      EventBus.getInstance().emit(Events.ACTION_GATHER_WOOD);
    }

    // 3. Auto Check Traps handling
    if (this.checkTrapsCooldownMs <= 0 && state.buildings.traps > 0) {
      ResourceSystem.getInstance().checkTraps(state);
      this.checkTrapsCooldownMs = DevAutoSystem.TRAP_INTERVAL_MS;
      EventBus.getInstance().emit(Events.ACTION_CHECK_TRAPS);
    }
  }
}
