import { GameData } from './GameState';

export interface LeaderboardEntry {
  rank?: number;
  name: string;
  score: number;
  days: number;
  clearedCount: number;
  date: string;
}

const LEADERBOARD_KEY = 'ADARKROOM_LEADERBOARD_SCORES';

export class LeaderboardManager {
  private static instance: LeaderboardManager;

  private constructor() {}

  public static getInstance(): LeaderboardManager {
    if (!LeaderboardManager.instance) {
      LeaderboardManager.instance = new LeaderboardManager();
    }
    return LeaderboardManager.instance;
  }

  /**
   * 從 localStorage 讀取排行榜資料
   */
  public getLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      if (!data) {
        // 預設提供初始探險家紀錄
        const defaultList: LeaderboardEntry[] = [
          { name: '先驅者・艾倫', score: 3850, days: 24, clearedCount: 4, date: '2026/09/01' },
          { name: '流浪者・凱爾', score: 2400, days: 15, clearedCount: 2, date: '2026/09/02' },
          { name: '守夜人・席娜', score: 1650, days: 10, clearedCount: 1, date: '2026/09/03' }
        ];
        this.saveRaw(defaultList);
        return defaultList;
      }
      const parsed: LeaderboardEntry[] = JSON.parse(data);
      return parsed.sort((a, b) => b.score - a.score);
    } catch (e) {
      console.error('Failed to read leaderboard from localStorage:', e);
      return [];
    }
  }

  /**
   * 計算當前遊戲得分
   * 分數規則：
   * 1. 聚落人口：每人 100 分
   * 2. 大地圖已探勘步道：每格 25 分
   * 3. 攻克並搜刮的地標：每座 500 分
   * 4. 聚落各類建築：每座 150 分
   * 5. 生存時間：每過 60 秒相當於生存 1 天，每天 50 分
   */
  public calculateScore(state: GameData): { score: number; days: number; clearedCount: number } {
    const days = Math.max(1, Math.floor(state.gameTime / 60));
    const clearedCount = state.clearedLandmarks ? state.clearedLandmarks.length : 0;
    const tilesCount = state.visitedTiles ? state.visitedTiles.length : 1;

    let buildingCount = 0;
    if (state.buildings) {
      buildingCount = Object.values(state.buildings).reduce((sum, count) => sum + (count || 0), 0);
    }

    const popScore = (state.population || 0) * 100;
    const tileScore = tilesCount * 25;
    const landmarkScore = clearedCount * 500;
    const buildingScore = buildingCount * 150;
    const survivalScore = days * 50;

    const totalScore = popScore + tileScore + landmarkScore + buildingScore + survivalScore;

    return {
      score: totalScore,
      days,
      clearedCount
    };
  }

  /**
   * 登錄新分數並儲存至 localStorage，自動依分數高低排序並保留前 10 名
   */
  public addScore(name: string, state: GameData): LeaderboardEntry[] {
    const { score, days, clearedCount } = this.calculateScore(state);
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

    const newEntry: LeaderboardEntry = {
      name: name.trim() || '無名旅人',
      score,
      days,
      clearedCount,
      date: dateStr
    };

    const currentList = this.getLeaderboard();
    currentList.push(newEntry);

    // 依分數由高至低排序，取前 10 名
    const sortedList = currentList
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    this.saveRaw(sortedList);
    return sortedList;
  }

  /**
   * 清除 localStorage 中的排行榜紀錄
   */
  public clearLeaderboard(): void {
    try {
      localStorage.removeItem(LEADERBOARD_KEY);
    } catch (e) {
      console.error('Failed to clear leaderboard in localStorage:', e);
    }
  }

  private saveRaw(list: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to write leaderboard to localStorage:', e);
    }
  }
}
