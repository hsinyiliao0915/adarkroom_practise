import { GameData } from './GameState';
import { RoomSystem } from '../systems/RoomSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { VillageSystem } from '../systems/VillageSystem';
import { StoryEventSystem } from '../systems/StoryEventSystem';
import { EventBus, Events } from './EventBus';

export class TickEngine {
  private static instance: TickEngine;
  private timer: number | null = null;
  private lastTickTime: number = Date.now();
  private speedMultiplier: number = 1;

  private constructor() {}

  public static getInstance(): TickEngine {
    if (!TickEngine.instance) {
      TickEngine.instance = new TickEngine();
    }
    return TickEngine.instance;
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.1, multiplier);
  }

  public start(getState: () => GameData, intervalMs: number = 500): void {
    this.stop();
    this.lastTickTime = Date.now();

    this.timer = window.setInterval(() => {
      const now = Date.now();
      const deltaSeconds = ((now - this.lastTickTime) / 1000) * this.speedMultiplier;
      this.lastTickTime = now;

      const state = getState();
      state.gameTime += deltaSeconds;

      // 1. Room fire tick
      RoomSystem.getInstance().tick(state, deltaSeconds);

      // 2. Resource & worker tick
      ResourceSystem.getInstance().tick(state, deltaSeconds);

      // 3. Village population growth tick
      VillageSystem.getInstance().tick(state, deltaSeconds);

      // 4. Authentic story events tick
      StoryEventSystem.getInstance().tick(state, deltaSeconds);

      EventBus.getInstance().emit(Events.STATE_CHANGED);
    }, intervalMs);
  }

  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
