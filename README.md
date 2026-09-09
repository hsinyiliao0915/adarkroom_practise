# 小黑屋 (A Dark Room) - Phaser 3 & TypeScript Edition

> ⚠️ **練習與學習用途聲明 / Practice & Educational Disclaimer**
>
> - **中文說明**：本專案**僅作為個人前端遊戲架構開發、TypeScript 與 Phaser 3 引擎之技術學習與練習用途**，非商業專案。遊戲原作創意、故事文字及世界觀設計歸原創作者所有（原版開源網頁遊戲 *A Dark Room* 由 Michael Townsend 創作）。
> - **English Notice**: This project is developed **strictly for personal learning, technical research, and practice purposes** (exploring modern game architecture using TypeScript, Phaser 3, and OpenSpec specification-driven workflows). It is non-commercial and not intended for commercial distribution. All original story, mechanics, and design concepts belong to the original creators of *A Dark Room* (created by Michael Townsend).

---

## 專案簡介 (Overview)

本專案使用 **Phaser 3 + TypeScript + Vite**，以現代模組化架構與響應式系統重構經典文字經營冒險遊戲《小黑屋 (A Dark Room)》的核心機制：

1. **核心迴圈 (Core Loop)**：點火保暖、手工採集木材、陷阱狩獵、興建聚落木屋與工作坊。
2. **聚落自動化 (Village Economy)**：指派陷阱獵人、伐木工、鐵礦工與煤礦工，動態計算生產速率與資源天花板。
3. **荒野迷霧與探索 (Wilderness Exploration)**：動態視野霧化揭示、ASCII 座標網格、水壺與乾肉消耗、前哨站供水補給。
4. **即時荒野遭遇戰 (Real-time Combat)**：拳頭、骨矛、鐵劍與步槍武器系統，具備真實冷卻條與戰鬥日誌。
5. **終局星艦與太空逃逸 (Endgame & Space Flight)**：
   - 搜刮大地圖外星星艦殘骸 (`crashed_starship`) 解鎖星艦整備分頁。
   - 消耗外星合金與鋼材進行船體裝甲（Hull HP）與推進引擎推力（Climb Speed）升級。
   - 太空升空躲避下墜隕石障礙（WASD / 方向鍵操控），突破 1000m 引力井達成終局全破與敘事結算。
6. **多槽位存檔管理 (Save Management)**：支援多命名存檔插槽、自動定期存檔、歷史存檔載入與舊版存檔相容防禦清洗。

---

## 技術棧 (Tech Stack)

- **遊戲引擎 (Game Engine)**: [Phaser 3](https://phaser.io/) (v3.90.0)
- **程式語言 (Language)**: [TypeScript](https://www.typescriptlang.org/) (v5.8.0, strict mode)
- **建置工具 (Build Tool)**: [Vite](https://vite.dev/) (v6.0.0)
- **規格驅動開發 (Spec-Driven Dev)**: [OpenSpec](https://github.com/Fission-AI/openspec)
- **測試框架 (Testing)**: Node.js Test Runner + [tsx](https://github.com/privatenumber/tsx)

---

## 本機開發與執行 (Getting Started)

### 安裝相依套件 (Install dependencies)
```bash
npm install
```

### 啟動開發伺服器 (Start Dev Server)
```bash
npm run dev
```
瀏覽器訪問 `http://localhost:3001/` 即可遊玩。

### 執行單元測試 (Run Tests)
```bash
npm test
```

### 建置打包 (Build for Production)
```bash
npm run build
```

---

## 授權與聲明 (License & Credits)

- 本專案代碼僅供學習與練習交流使用 (For practice and study only)。
- 原始《小黑屋》(A Dark Room) 為 Michael Townsend / Doublespeak Games 創作之開源遊戲作品。
