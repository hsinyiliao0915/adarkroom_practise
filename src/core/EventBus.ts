export type EventCallback = (...args: any[]) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return un-subscribe function
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  public emit(event: string, ...args: any[]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(...args);
        } catch (err) {
          console.error(`Error in event listener for "${event}":`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const Events = {
  LOG_MESSAGE: 'LOG_MESSAGE',
  STATE_CHANGED: 'STATE_CHANGED',
  RESOURCE_CHANGED: 'RESOURCE_CHANGED',
  TAB_UNLOCKED: 'TAB_UNLOCKED',
  COMBAT_EVENT: 'COMBAT_EVENT',
  MAP_MOVED: 'MAP_MOVED',
  SAVE_GAME: 'SAVE_GAME'
} as const;
