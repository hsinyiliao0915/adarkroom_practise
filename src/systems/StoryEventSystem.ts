import { GameData } from '../core/GameState';
import { EventBus, Events } from '../core/EventBus';
import { STORY_EVENTS, StoryEvent, StoryScene, StoryChoice } from '../data/storyEvents';

export interface ActiveEventState {
  event: StoryEvent;
  sceneKey: string;
  scene: StoryScene;
}

export interface ChoiceResult {
  success: boolean;
  closed: boolean;
  reason?: string;
  nextScene?: string;
  notification?: string;
}

export class StoryEventSystem {
  private static instance: StoryEventSystem;

  private activeEvent: StoryEvent | null = null;
  private currentSceneKey: string = 'start';
  private eventCooldowns: Map<string, number> = new Map();
  private timeSinceLastEvent: number = 0;
  private nextEventDelay: number = 45; // seconds before checking

  private constructor() {
    this.nextEventDelay = 45 + Math.random() * 30;
  }

  public static getInstance(): StoryEventSystem {
    if (!StoryEventSystem.instance) {
      StoryEventSystem.instance = new StoryEventSystem();
    }
    return StoryEventSystem.instance;
  }

  public getActiveEvent(): ActiveEventState | null {
    if (!this.activeEvent) return null;
    const scene = this.activeEvent.scenes[this.currentSceneKey];
    if (!scene) return null;
    return {
      event: this.activeEvent,
      sceneKey: this.currentSceneKey,
      scene
    };
  }

  public tick(state: GameData, deltaSeconds: number): void {
    // Only trigger events if forest is unlocked (opening sequence must be uninterrupted)
    if (!state.unlockedForest) return;

    // Do not trigger another event if one is currently waiting for player interaction
    if (this.activeEvent !== null) return;

    this.timeSinceLastEvent += deltaSeconds;

    if (this.timeSinceLastEvent >= this.nextEventDelay) {
      this.timeSinceLastEvent = 0;
      this.nextEventDelay = 50 + Math.random() * 40; // Every 50-90s
      this.triggerRandomEvent(state);
    }
  }

  public triggerRandomEvent(state: GameData): StoryEvent | null {
    if (!state.unlockedForest) return null;
    if (this.activeEvent !== null) return null;

    const eligible = STORY_EVENTS.filter((ev) => {
      if (!ev.isAvailable(state)) return false;
      const lastTriggered = this.eventCooldowns.get(ev.id) ?? -99999;
      const cd = ev.cooldownSeconds ?? 60;
      return (state.gameTime - lastTriggered) >= cd;
    });

    if (eligible.length === 0) return null;

    const totalWeight = eligible.reduce((sum, ev) => sum + ev.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const ev of eligible) {
      if (rand < ev.weight) {
        return this.startEvent(ev, state);
      }
      rand -= ev.weight;
    }

    return this.startEvent(eligible[0], state);
  }

  public triggerEventById(eventId: string, state: GameData): StoryEvent | null {
    const ev = STORY_EVENTS.find((e) => e.id === eventId);
    if (!ev) return null;
    return this.startEvent(ev, state);
  }

  private startEvent(ev: StoryEvent, state: GameData): StoryEvent {
    this.activeEvent = ev;
    this.currentSceneKey = 'start';
    this.eventCooldowns.set(ev.id, state.gameTime);

    const scene = ev.scenes['start'];
    if (scene.notification) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, scene.notification, 'event');
    }

    EventBus.getInstance().emit(Events.STORY_EVENT_TRIGGERED, {
      event: ev,
      sceneKey: 'start',
      scene
    });

    return ev;
  }

  public canAffordChoice(choice: StoryChoice, state: GameData): boolean {
    if (choice.condition && !choice.condition(state)) {
      return false;
    }

    if (choice.cost) {
      for (const [resKey, amount] of Object.entries(choice.cost)) {
        const current = state.resources[resKey as keyof GameData['resources']] || 0;
        if (current < (amount || 0)) {
          return false;
        }
      }
    }

    return true;
  }

  public selectChoice(buttonKey: string, state: GameData): ChoiceResult {
    if (!this.activeEvent) {
      return { success: false, closed: true, reason: 'no_active_event' };
    }

    const scene = this.activeEvent.scenes[this.currentSceneKey];
    if (!scene) {
      this.closeEvent();
      return { success: false, closed: true, reason: 'scene_not_found' };
    }

    const choice = scene.buttons[buttonKey];
    if (!choice) {
      return { success: false, closed: false, reason: 'choice_not_found' };
    }

    if (!this.canAffordChoice(choice, state)) {
      return { success: false, closed: false, reason: 'insufficient_resources' };
    }

    // Deduct standard costs
    if (choice.cost) {
      for (const [resKey, amount] of Object.entries(choice.cost)) {
        const key = resKey as keyof GameData['resources'];
        state.resources[key] = Math.max(0, (state.resources[key] || 0) - (amount || 0));
      }
    }

    // Grant standard rewards
    if (choice.reward) {
      for (const [resKey, amount] of Object.entries(choice.reward)) {
        const key = resKey as keyof GameData['resources'];
        state.resources[key] = (state.resources[key] || 0) + (amount || 0);
      }
    }

    // Apply standard stat changes
    if (choice.statChanges) {
      if (choice.statChanges.population !== undefined) {
        state.population = Math.max(0, state.population + choice.statChanges.population);
      }
      if (choice.statChanges.traps !== undefined) {
        state.buildings.traps = Math.max(0, state.buildings.traps + choice.statChanges.traps);
      }
    }

    let finalNotification = choice.notification;
    let nextSceneKey = choice.nextScene || 'end';

    // Execute dynamic logic if provided
    if (choice.onExecute) {
      const execResult = choice.onExecute(state);
      if (execResult.notification) {
        finalNotification = execResult.notification;
      }
      if (execResult.nextScene) {
        nextSceneKey = execResult.nextScene;
      }
      if (execResult.cost) {
        for (const [resKey, amount] of Object.entries(execResult.cost)) {
          const key = resKey as keyof GameData['resources'];
          state.resources[key] = Math.max(0, (state.resources[key] || 0) - (amount || 0));
        }
      }
      if (execResult.reward) {
        for (const [resKey, amount] of Object.entries(execResult.reward)) {
          const key = resKey as keyof GameData['resources'];
          state.resources[key] = (state.resources[key] || 0) + (amount || 0);
        }
      }
      if (execResult.statChanges) {
        if (execResult.statChanges.population !== undefined) {
          state.population = Math.max(0, state.population + execResult.statChanges.population);
        }
        if (execResult.statChanges.traps !== undefined) {
          state.buildings.traps = Math.max(0, state.buildings.traps + execResult.statChanges.traps);
        }
      }
    }

    // Route next scene or end
    if (nextSceneKey === 'end' || !this.activeEvent.scenes[nextSceneKey]) {
      if (finalNotification) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, finalNotification, 'event');
      }
      this.closeEvent();
      EventBus.getInstance().emit(Events.STATE_CHANGED);
      return { success: true, closed: true, notification: finalNotification };
    } else {
      this.currentSceneKey = nextSceneKey;
      const nextSceneObj = this.activeEvent.scenes[nextSceneKey];

      if (finalNotification) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, finalNotification, 'event');
      } else if (nextSceneObj.notification) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, nextSceneObj.notification, 'event');
      }

      EventBus.getInstance().emit(Events.STORY_EVENT_UPDATED, {
        event: this.activeEvent,
        sceneKey: nextSceneKey,
        scene: nextSceneObj
      });
      EventBus.getInstance().emit(Events.STATE_CHANGED);
      return { success: true, closed: false, nextScene: nextSceneKey, notification: finalNotification };
    }
  }

  public closeEvent(): void {
    this.activeEvent = null;
    this.currentSceneKey = 'start';
    EventBus.getInstance().emit(Events.STORY_EVENT_CLOSED);
  }

  public reset(): void {
    this.activeEvent = null;
    this.currentSceneKey = 'start';
    this.eventCooldowns.clear();
    this.timeSinceLastEvent = 0;
  }
}
