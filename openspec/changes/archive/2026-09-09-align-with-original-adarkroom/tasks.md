## 1. 開局狀態機與森林解鎖時序重構 (Opening State Machine)

- [x] 1.1 重構 `RoomSystem.ts` 中的前期狀態機：點火切換為 burning 並發送火光穿窗訊息，依時序延遲觸發陌生人倒地（約 8s），再延遲觸發 `unlockForest`（約 12s）。
- [x] 1.2 在 `unlockForest` 觸發時才賦予 `wood = 4`、解鎖森林頁籤並顯示寒風與乾柴見底日誌，杜絕開局森林秒開問題。
- [x] 1.3 實裝陌生人在屋內升溫時的漸進甦醒（發抖 -> 平靜 -> 起身幫助），解鎖生火間內建造「陷阱」與「貨車」。

## 2. 庫存面板重設與純淨隱藏 (Stores Panel Clean Reset)

- [x] 2.1 在 `ResourcePanel.ts` 實裝 `resetDiscovered(state)`，開新遊戲與載入存檔時同步清除快取，未解鎖前完全隱藏。
- [x] 2.2 在 `MainScene.ts` 的開新局與載入邏輯中呼叫 `resetDiscovered`，確保新局右側 100% 空白無干擾。

## 3. 頁籤與介面視覺細節 (Visuals & Navigation)

- [x] 3.1 確保中央上方行內頁籤在只有生火間時不顯示孤立分隔線，當森林解鎖後平滑浮現 `生火間 | 靜謐森林`。
- [x] 3.2 檢查所有文本與日誌維持標準正體中文與詩意文筆。

## 4. 系統驗證與測試 (Verification)

- [x] 4.1 執行 `npm test` 確認 36 項測試通過。
- [x] 4.2 執行 `npm run build` 確認生產環境建置通過。
