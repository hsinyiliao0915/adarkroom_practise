## Context

參見 `proposal.md`。本遊戲採用 Phaser 3 與 TypeScript 建構，所有遊戲核心狀態（資源、工人、建築、遠征）均集中於 `GameState`。目前資料存取缺乏邊界校驗，System 業務邏輯缺乏前置檢查，且專案完全沒有自動化測試覆蓋核心狀態。

## Goals / Non-Goals

**Goals:**
- 建立純 TypeScript 的狀態校驗與清洗器（State Sanitizer），提供數值邊界防護（clamp 非負整數、NaN 防護、物件完整性補齊）。
- 在 `CraftSystem`、`VillageSystem` 與 `MapSystem` 加入不可繞過的前置守衛（Guards）。
- 修復遠征時槍彈、物資的守恆及陣亡時的狀態重置。
- 在 `package.json` 配置原生 `node --test` 自動化測試腳本，涵蓋存檔與狀態不變量。

**Non-Goals:**
- 不引入重型第三方 Schema 庫（如 Zod、Joi、Yup），避免膨脹前端 Bundle 體積。
- 不改變 LocalStorage 儲存機制的既有 Key 結構，維持向下相容性。
- 不在此 Change 調整 Phaser Canvas 解析度縮放或 UI 佈局（留待後續專屬 Change 處理）。

## Decisions

### 決策 1：輕量化純 TS 防護函式（`validateAndSanitizeSave`）
- **選擇**：在 `SaveManager` 內部建立專屬的驗證與清洗函式，自動將負數、NaN 與未定義欄位修正為合法預設值。
- **替代方案評估**：引入 Zod。雖然語法宣告簡潔，但在純前端打包環境會增加依賴大小，手寫純函式更加透明且無任何外部依賴。

### 決策 2：System 層實施「前置條件強制檢核」
- **選擇**：在 `CraftSystem.craft` 與 `VillageSystem.build` 扣款前呼叫 `unlockRequirement`；在 `assignWorker` 前呼叫 `job.requiredBuilding` 檢驗。
- **替代方案評估**：僅在 UI 層禁用按鈕。已被證明存在安全與一致性漏洞，由 System 層作為 Single Source of Truth 才能確保規則不被旁路。

### 決策 3：採用 Node.js 原生測試執行器
- **選擇**：使用 Node.js 內建的 `node --test` 模組建立單元測試。
- **替代方案評估**：安裝 Vitest / Jest。需要額外安裝多個開發依賴；Node 原生 test runner 反應極快且完全不需安裝額外套件。

## Risks / Trade-offs

- **[風險]** 嚴格驗證可能導致極少數損壞嚴重的既有存檔被重設為初始狀態。
  - **緩解措施**：採取「盡可能修復（Sanitize）」而非「直接拋出異常並拒載」，例如將 `-50` 的木材自動校正為 `0`，保留其他完好的進度。
- **[風險]** 遠征子彈扣減可能影響玩家既有戰力。
  - **緩解措施**：出發時只鎖定當前攜帶的子彈，返航時剩餘子彈全數歸還聚落庫存，維持物理守恆。
