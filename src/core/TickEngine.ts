import { GameData } from './GameState';
import { RoomSystem } from '../systems/RoomSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { RANDOM_VILLAGE_EVENTS } from '../data/events';
import { EventBus, Events } from './EventBus';

export class TickEngine {
  private static instance: TickEngine;
  private timer: number | null = null;
  private lastTickTime: number = Date.now();
  private eventCheckTimer: number = 0;

  private constructor() {}

  public static getInstance(): TickEngine {
    if (!TickEngine.instance) {
      TickEngine.instance = new TickEngine();
    }
    return TickEngine.instance;
  }

  public start(getState: () => GameData, intervalMs: number = 500): void {
    this.stop();
    this.lastTickTime = Date.now();

    this.timer = window.setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;

      const state = getState();
      state.gameTime += deltaSeconds;

      // 1. Room fire tick
      RoomSystem.getInstance().tick(state, deltaSeconds);

      // 2. Resource & worker tick
      ResourceSystem.getInstance().tick(state, deltaSeconds);

      // 3. Random events check every ~8 seconds
      this.eventCheckTimer += deltaSeconds;
      if (this.eventCheckTimer >= 8) {
        this.eventCheckTimer = 0;
        this.checkRandomEvents(state);
      }

      EventBus.getInstance().emit(Events.STATE_CHANGED);
    }, intervalMs);
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private checkRandomEvents(state: GameData): void {
    // Only check if village or forest is unlocked
    if (!state.unlockedForest) return;

    // Filter eligible events
    const eligible = RANDOM_VILLAGE_EVENTS.filter((e) => e.condition(state));
    if (eligible.length === 0) return;

    // 25% chance of an event triggering per check
    if (Math.random() < 0.25) {
      const totalWeight = eligible.reduce((sum, e) => sum + e.frequency, 0);
      let rand = Math.random() * totalWeight;

      for (const ev of eligible) {
        if (rand < ev.frequency) {
          const logMsg = ev.onTrigger(state);
          EventBus.getInstance().emit(Events.LOG_MESSAGE, logMsg, 'event');
          break;
        }
        rand -= ev.frequency;
      }
    }
  }
}
