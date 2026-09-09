## 1. 純黑白色彩收斂與主題常數 (Monochrome Palette & Theme Constants)

- [x] 1.1 在 `ThemeManager.ts` 中移除日誌、房間狀態與彈窗的橘色與藍色雜色，統一為純白（Dark）或純黑（Light），並擴充頂部導航高對比色彩定義。
- [x] 1.2 在 `LogPanel.ts`、`RoomView.ts` 與 `SaveLoadModal.ts` 中全面收斂為純黑白單色，日誌僅以時間透明度（Alpha）漸層表達歷史層次。

## 2. 開發者 / 自動模式核心系統 (DevAutoSystem)

- [x] 2.1 建立 `src/systems/DevAutoSystem.ts`，提供 `setEnabled(enabled: boolean)`、`toggle()`、`isEnabled()` 以及自動巡檢執行邏輯（自動點火/添柴、自動拾柴、自動收陷阱）。
- [x] 2.2 撰寫 `tests/devAutoSystem.test.ts` 單元測試，驗證自動模式在火勢減弱、拾柴就緒時能精準觸發相應動作且冷卻中不重複觸發。

## 3. 頂部導航元件可讀性與互動強化 (Header Utility UI Enhancement)

- [x] 3.1 在 `MainScene.ts` 重構 `createUtilityLinks()`，將字級提升至 12px~13px，採用 `[ 存檔管理 ]`、`[ 新遊戲 ]`、`[ 自動: 關/開 ]` 與 `[ 開燈 / 熄燈 ]` 微結構標籤樣式，並設置精準點擊熱區。
- [x] 3.2 實裝滑鼠移入（Hover）即時黑白反白高亮與移出復原效果，顯著提升操作目標識別度。
- [x] 3.3 綁定 `[ 自動: 關/開 ]` 點擊事件至 `DevAutoSystem`，即時更新按鈕標籤與發送系統日誌訊息。
- [x] 3.4 確保在 Dark 模式與 Light 模式切換時，所有頂部連結、方括號、狀態標籤與分隔符號皆即時無縫切換。

## 4. 系統驗證與回歸測試 (Verification)

- [x] 4.1 執行 `npm test` 確認既有 38 個測試與新增之 `devAutoSystem.test.ts` 全數通過。
- [x] 4.2 執行 `npm run build` 確認 TypeScript 與 Vite 生產建置無誤。
