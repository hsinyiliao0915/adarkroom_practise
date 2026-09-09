## 1. 頁籤導航重構 (Inline Tab Navigation)

- [ ] 1.1 在 `MainScene.ts` 中建立中央頂部行內文字導航（`生火間 | 靜謐森林 | ...`），支援文字點擊與啟用底線標記，透過瀏覽器點擊驗證。
- [ ] 1.2 移除舊有的寬版導航列按鈕，將存檔與新遊戲移至簡約輔助文字連結，透過執行測試與視覺檢驗。

## 2. 視圖職責分離 (RoomView & OutsideView)

- [ ] 2.1 建立 `src/ui/OutsideView.ts`（靜謐森林），承接伐木、巡視陷阱與誘餌操作，並驗證冷卻動畫與產出正常。
- [ ] 2.2 重構 `src/ui/RoomView.ts`（生火間），專注於壁爐狀態、點火/添柴與建造者解鎖的建築物清單（陷阱、貨車、棚屋等）。
- [ ] 2.3 在 `GameState.ts` 與 `RoomSystem.ts` 確保森林與生火間的解鎖狀態流轉無縫，執行 `npm test` 驗證所有遊戲邏輯不破壞。

## 3. 緊湊 Fieldset 物資與聚落面板 (Compact Fieldset Panels)

- [ ] 3.1 更新 `ResourcePanel.ts`，開局資源為 0 時完全隱藏，獲得資源後自適應高度包裹項目。
- [ ] 3.2 在右側建立或整合人口與村民分配緊湊線框，當有棚屋時自適應顯示於庫存上方。

## 4. 系統整合與驗證 (Integration & Verification)

- [ ] 4.1 執行 `npm test` 確認所有單元測試 100% 通過。
- [ ] 4.2 執行 `npm run build` 確認 TypeScript 與 Vite 生產環境編譯零錯誤。
