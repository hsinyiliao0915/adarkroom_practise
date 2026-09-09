import { GameData, INITIAL_GAME_DATA, SaveMetadata, Resources, Buildings, Workers } from './GameState';
import { EventBus, Events } from './EventBus';

export const SAVE_INDEX_KEY = 'ADARKROOM_SAVES_INDEX_V1';
export const ACTIVE_SAVE_KEY = 'ADARKROOM_ACTIVE_SAVE_ID_V1';
export const SAVE_SLOT_PREFIX = 'ADARKROOM_SAVE_SLOT_';
export const LEGACY_SAVE_KEY = 'ADARKROOM_SAVE_V1';

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

  /**
   * 狀態清洗與驗證器（Sanitizer & Validator）
   * 確保所有數值皆為合法非負有限數值，防止 NaN、負數或無效型別注入
   */
  public validateAndSanitize(raw: any): GameData {
    const base: GameData = JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
    if (!raw || typeof raw !== 'object') {
      return base;
    }

    const cleanNum = (val: any, fallback: number = 0): number => {
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        return Math.max(0, val);
      }
      return fallback;
    };

    const cleanInt = (val: any, fallback: number = 0): number => {
      return Math.floor(cleanNum(val, fallback));
    };

    // 1. 基本屬性
    base.version = cleanInt(raw.version, base.version);
    base.gameTime = cleanNum(raw.gameTime, base.gameTime);
    base.fireFuel = cleanNum(raw.fireFuel, base.fireFuel);
    base.strangerName = typeof raw.strangerName === 'string' ? raw.strangerName : base.strangerName;

    const validFireStates = ['dead', 'smoldering', 'flickering', 'burning', 'roaring'];
    if (validFireStates.includes(raw.fireState)) {
      base.fireState = raw.fireState;
    }

    const validWarmth = ['freezing', 'cold', 'mild', 'warm'];
    if (validWarmth.includes(raw.warmthLevel)) {
      base.warmthLevel = raw.warmthLevel;
    }

    const validStranger = ['none', 'sleeping', 'awake', 'helping'];
    if (validStranger.includes(raw.strangerState)) {
      base.strangerState = raw.strangerState;
    }

    base.unlockedTraps = Boolean(raw.unlockedTraps);
    base.unlockedForest = Boolean(raw.unlockedForest);
    base.unlockedBuilder = Boolean(raw.unlockedBuilder);
    base.unlockedCompass = Boolean(raw.unlockedCompass);

    // 2. Resources 清洗
    if (raw.resources && typeof raw.resources === 'object') {
      for (const key of Object.keys(base.resources) as Array<keyof Resources>) {
        base.resources[key] = cleanNum(raw.resources[key], base.resources[key]);
      }
    }

    // 3. Buildings 清洗
    if (raw.buildings && typeof raw.buildings === 'object') {
      for (const key of Object.keys(base.buildings) as Array<keyof Buildings>) {
        base.buildings[key] = cleanInt(raw.buildings[key], base.buildings[key]);
      }
    }

    // 4. Workers 清洗
    if (raw.workers && typeof raw.workers === 'object') {
      for (const key of Object.keys(base.workers) as Array<keyof Workers>) {
        base.workers[key] = cleanInt(raw.workers[key], base.workers[key]);
      }
    }

    base.population = cleanInt(raw.population, base.population);
    base.trapBaitMeat = cleanInt(raw.trapBaitMeat, base.trapBaitMeat);

    // 5. 分頁解鎖狀態
    if (raw.unlockedTabs && typeof raw.unlockedTabs === 'object') {
      base.unlockedTabs.room = true;
      base.unlockedTabs.village = Boolean(raw.unlockedTabs.village);
      base.unlockedTabs.craft = Boolean(raw.unlockedTabs.craft);
      base.unlockedTabs.map = Boolean(raw.unlockedTabs.map);
      base.unlockedTabs.ship = Boolean(raw.unlockedTabs.ship);
    }

    // 6. 地圖探索與遠征狀態
    base.mapSeed = cleanInt(raw.mapSeed, base.mapSeed);
    base.mapWidth = cleanInt(raw.mapWidth, base.mapWidth);
    base.mapHeight = cleanInt(raw.mapHeight, base.mapHeight);

    if (Array.isArray(raw.visitedTiles)) {
      base.visitedTiles = raw.visitedTiles.filter((t: any) => typeof t === 'string' && /^\d+,\d+$/.test(t));
    }
    if (Array.isArray(raw.clearedLandmarks)) {
      base.clearedLandmarks = raw.clearedLandmarks.filter((id: any) => typeof id === 'string');
    }

    if (raw.expedition && typeof raw.expedition === 'object') {
      const exp = raw.expedition;
      base.expedition.active = Boolean(exp.active);
      base.expedition.x = cleanInt(exp.x, base.expedition.x);
      base.expedition.y = cleanInt(exp.y, base.expedition.y);
      base.expedition.hp = cleanNum(exp.hp, base.expedition.hp);
      base.expedition.maxHp = cleanNum(exp.maxHp, base.expedition.maxHp);
      base.expedition.water = cleanNum(exp.water, base.expedition.water);
      base.expedition.maxWater = cleanNum(exp.maxWater, base.expedition.maxWater);
      base.expedition.curedMeat = cleanNum(exp.curedMeat, base.expedition.curedMeat);
      base.expedition.torches = cleanNum(exp.torches, base.expedition.torches);
      base.expedition.bullets = cleanNum(exp.bullets, base.expedition.bullets);
      base.expedition.inCombat = Boolean(exp.inCombat);
      base.expedition.enemy = exp.enemy && typeof exp.enemy === 'object' ? exp.enemy : null;
      base.expedition.weapon = exp.weapon || 'fists';
      base.expedition.carriedLoot = exp.carriedLoot && typeof exp.carriedLoot === 'object' ? exp.carriedLoot : {};
      base.expedition.combatLog = Array.isArray(exp.combatLog) ? exp.combatLog.map(String) : [];
      base.expedition.weaponCooldowns = exp.weaponCooldowns && typeof exp.weaponCooldowns === 'object'
        ? Object.fromEntries(
            Object.entries(exp.weaponCooldowns).map(([k, v]) => [k, cleanNum(v, 0)])
          )
        : {};
      base.expedition.enemyAttackCooldown = cleanNum(exp.enemyAttackCooldown, 0);
      base.expedition.enemyMaxAttackCooldown = cleanNum(exp.enemyMaxAttackCooldown, 0);
    }

    // 7. 星艦狀態清洗
    if (raw.starship && typeof raw.starship === 'object') {
      base.starship.unlocked = Boolean(raw.starship.unlocked);
      base.starship.hullLevel = cleanInt(raw.starship.hullLevel, base.starship.hullLevel);
      base.starship.engineLevel = cleanInt(raw.starship.engineLevel, base.starship.engineLevel);
      base.starship.clearedEscape = Boolean(raw.starship.clearedEscape);
    }

    // 8. 日誌紀錄
    if (Array.isArray(raw.logs)) {
      base.logs = raw.logs.slice(-50).map((l: any) => ({
        text: String(l.text || ''),
        time: cleanNum(l.time, Date.now()),
        type: l.type || 'info'
      }));
    }

    return base;
  }

  /**
   * 取得現有所有存檔索引清單（若有舊版存檔自動遷移）
   */
  public listSaves(): SaveMetadata[] {
    try {
      const indexRaw = localStorage.getItem(SAVE_INDEX_KEY);
      let list: SaveMetadata[] = [];

      if (indexRaw) {
        list = JSON.parse(indexRaw);
      } else {
        // 檢查是否存在舊版單一存檔進行遷移
        const legacyData = localStorage.getItem(LEGACY_SAVE_KEY);
        if (legacyData) {
          const parsed = JSON.parse(legacyData);
          const sanitized = this.validateAndSanitize(parsed);
          const legacyMeta: SaveMetadata = {
            id: 'slot_default',
            name: '旅人記錄 (預設存檔)',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            days: Math.max(1, Math.floor(sanitized.gameTime / 60)),
            population: sanitized.population || 0,
            summary: `人口: ${sanitized.population} | 地標: ${sanitized.clearedLandmarks.length}`
          };

          localStorage.setItem(SAVE_SLOT_PREFIX + legacyMeta.id, JSON.stringify(sanitized));
          list = [legacyMeta];
          localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(list));
          localStorage.setItem(ACTIVE_SAVE_KEY, legacyMeta.id);
        }
      }

      return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : [];
    } catch (e) {
      console.error('Failed to list saves:', e);
      return [];
    }
  }

  /**
   * 取得當前活躍存檔 ID
   */
  public getActiveSaveId(): string {
    try {
      const active = localStorage.getItem(ACTIVE_SAVE_KEY);
      if (active) return active;

      const saves = this.listSaves();
      if (saves.length > 0) {
        return saves[0].id;
      }
      return 'slot_default';
    } catch {
      return 'slot_default';
    }
  }

  /**
   * 設定當前活躍存檔 ID
   */
  public setActiveSaveId(slotId: string): void {
    try {
      localStorage.setItem(ACTIVE_SAVE_KEY, slotId);
    } catch (e) {
      console.error('Failed to set active save id:', e);
    }
  }

  /**
   * 核心存檔邏輯（相容舊版簽名並支援命名與多槽位）
   */
  public save(data: GameData, name?: string, slotId?: string): boolean {
    const res = this.saveSlot(data, name, slotId);
    return res.success;
  }

  /**
   * 儲存指定槽位或活躍槽位
   */
  public saveSlot(
    data: GameData,
    name?: string,
    slotId?: string
  ): { success: boolean; metadata?: SaveMetadata; error?: string } {
    try {
      const targetId = slotId || this.getActiveSaveId();
      const cleanData = this.validateAndSanitize(data);

      const saves = this.listSaves();
      let existingIndex = saves.findIndex((s) => s.id === targetId);

      const now = Date.now();
      const days = Math.max(1, Math.floor(cleanData.gameTime / 60));
      const population = cleanData.population || 0;
      const summary = `第 ${days} 天 | 人口 ${population} | 攻克 ${cleanData.clearedLandmarks.length} 地標`;

      let meta: SaveMetadata;
      if (existingIndex >= 0) {
        meta = {
          ...saves[existingIndex],
          name: name ? name.trim() : saves[existingIndex].name,
          updatedAt: now,
          days,
          population,
          summary
        };
        saves[existingIndex] = meta;
      } else {
        meta = {
          id: targetId,
          name: name && name.trim() ? name.trim() : `冒險進度 (${new Date().toLocaleDateString()})`,
          createdAt: now,
          updatedAt: now,
          days,
          population,
          summary
        };
        saves.unshift(meta);
      }

      // 限制最多儲存 10 個存檔
      const trimmedSaves = saves.slice(0, 10);

      // 寫入 Slot 資料與 Index
      localStorage.setItem(SAVE_SLOT_PREFIX + targetId, JSON.stringify(cleanData));
      localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(trimmedSaves));
      this.setActiveSaveId(targetId);

      EventBus.getInstance().emit(Events.SAVE_GAME, cleanData);
      return { success: true, metadata: meta };
    } catch (e: any) {
      console.error('SaveManager.save failed:', e);
      return {
        success: false,
        error: e?.name === 'QuotaExceededError' ? '儲存空間不足 (Quota Exceeded)' : '存檔寫入失敗'
      };
    }
  }

  /**
   * 建立全新命名存檔
   */
  public createSave(
    data: GameData,
    name: string
  ): { success: boolean; metadata?: SaveMetadata; error?: string } {
    const newId = `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return this.saveSlot(data, name, newId);
  }

  /**
   * 載入指定槽位（或當前活躍槽位）之遊戲進度
   */
  public load(slotId?: string): GameData {
    try {
      const targetId = slotId || this.getActiveSaveId();
      let serialized = localStorage.getItem(SAVE_SLOT_PREFIX + targetId);

      // 若未找到具體槽位，嘗試讀取舊版單一存檔
      if (!serialized) {
        serialized = localStorage.getItem(LEGACY_SAVE_KEY);
      }

      if (!serialized) {
        const fresh = JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
        return fresh;
      }

      const parsed = JSON.parse(serialized);
      const sanitized = this.validateAndSanitize(parsed);

      if (slotId) {
        this.setActiveSaveId(slotId);
      }

      return sanitized;
    } catch (e) {
      console.error('Failed to load game state, falling back to clean initial data:', e);
      return JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
    }
  }

  /**
   * 開啟全新遊戲（建立新的遊戲開局，不覆蓋既有歷史存檔）
   */
  public startNewGame(): { state: GameData; metadata: SaveMetadata } {
    const freshData = JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
    const newId = `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const name = `新旅途 (${timeStr})`;

    const saveResult = this.saveSlot(freshData, name, newId);
    return {
      state: freshData,
      metadata: saveResult.metadata!
    };
  }

  /**
   * 刪除指定存檔槽位
   */
  public deleteSave(slotId: string): boolean {
    try {
      localStorage.removeItem(SAVE_SLOT_PREFIX + slotId);

      const saves = this.listSaves().filter((s) => s.id !== slotId);
      localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(saves));

      if (this.getActiveSaveId() === slotId) {
        const nextActive = saves.length > 0 ? saves[0].id : 'slot_default';
        this.setActiveSaveId(nextActive);
      }

      return true;
    } catch (e) {
      console.error('Failed to delete save slot:', e);
      return false;
    }
  }

  /**
   * 清除所有存檔（完全重設）
   */
  public clear(): void {
    try {
      const saves = this.listSaves();
      for (const s of saves) {
        localStorage.removeItem(SAVE_SLOT_PREFIX + s.id);
      }
      localStorage.removeItem(SAVE_INDEX_KEY);
      localStorage.removeItem(ACTIVE_SAVE_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY);
    } catch (e) {
      console.error('Failed to clear saves in localStorage:', e);
    }
  }

  public exportSave(data: GameData): string {
    const clean = this.validateAndSanitize(data);
    return btoa(unescape(encodeURIComponent(JSON.stringify(clean))));
  }

  public importSave(encodedStr: string): GameData | null {
    try {
      const decoded = decodeURIComponent(escape(atob(encodedStr.trim())));
      const parsed = JSON.parse(decoded);
      return this.validateAndSanitize(parsed);
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
}
