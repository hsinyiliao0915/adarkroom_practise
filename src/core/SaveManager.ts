import { GameData, INITIAL_GAME_DATA } from './GameState';
import { EventBus, Events } from './EventBus';

const SAVE_KEY = 'ADARKROOM_SAVE_V1';

export class SaveManager {
  private static instance: SaveManager;
  private autoSaveInterval: number | null = null;

  private constructor() {}

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public save(data: GameData): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, serialized);
      EventBus.getInstance().emit(Events.SAVE_GAME, data);
      return true;
    } catch (e) {
      console.error('Failed to save game state to LocalStorage:', e);
      return false;
    }
  }

  public load(): GameData {
    try {
      const serialized = localStorage.getItem(SAVE_KEY);
      if (!serialized) {
        return JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
      }
      const parsed = JSON.parse(serialized);
      // Merge with initial data to ensure new properties in newer versions are preserved
      return this.deepMerge(JSON.parse(JSON.stringify(INITIAL_GAME_DATA)), parsed);
    } catch (e) {
      console.error('Failed to load game state, falling back to initial data:', e);
      return JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
    }
  }

  public clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  public exportSave(data: GameData): string {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }

  public importSave(encodedStr: string): GameData | null {
    try {
      const decoded = decodeURIComponent(escape(atob(encodedStr.trim())));
      const parsed = JSON.parse(decoded);
      return this.deepMerge(JSON.parse(JSON.stringify(INITIAL_GAME_DATA)), parsed);
    } catch (e) {
      console.error('Invalid save import string:', e);
      return null;
    }
  }

  public startAutoSave(getData: () => GameData, intervalMs = 15000): void {
    this.stopAutoSave();
    this.autoSaveInterval = window.setInterval(() => {
      this.save(getData());
    }, intervalMs);
  }

  public stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  private deepMerge(target: any, source: any): any {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target && !(source[key] instanceof Array)) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  }
}
