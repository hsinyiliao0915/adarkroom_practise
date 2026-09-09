## 1. 資料模型與狀態持久化 (Data Models & Save Compatibility)

- [x] 1.1 在 GameState.ts 擴充 ActiveTab 加入 'ship'，定義 StarshipState（包含 unlocked, hullLevel, engineLevel, clearedEscape），並於 INITIAL_GAME_DATA 補全預設值
- [x] 1.2 在 SaveManager.ts 的 validateAndSanitize 補充 starship 欄位防禦清理，並以單元測試驗證存檔載入相容性

## 2. 星艦領域邏輯與地標解鎖聯動 (Starship Domain Logic)

- [x] 2.1 實作 StarshipSystem.ts，涵蓋 upgradeHull、upgradeEngine 與 canLaunch 邏輯，並透過單元測試驗證消耗扣除與升級邊界
- [x] 2.2 修改 MapSystem.ts 的 scavengeLandmark：當搜刮 crashed_starship 地標時自動將 starship.unlocked 與 unlockedTabs.ship 設為 true，並發送事件

## 3. 星艦維修分頁介面 (Ship View & Upgrades UI)

- [x] 3.1 實作 src/ui/ShipView.ts，提供外星合金與鋼材庫存顯示、船體升級按鈕、引擎升級按鈕與「啟動升空」按鈕
- [x] 3.2 在 MainScene.ts 整合頂部「星艦」分頁按鈕切換與資料更新

## 4. 太空升空小遊戲與結局敘事 (Space Flight Mini-Game & Ending)

- [x] 4.1 實作 src/ui/SpaceFlightView.ts，包含星艦即時操控（WASD / 方向鍵）、隕石障礙群垂直生成與動態下落
- [x] 4.2 實作碰撞偵測與船體生命值扣除，處理生命歸零墜毀返回地面與保留升級等級
- [x] 4.3 實作高度攀升與 1000m 軌道逃逸成功邏輯，展示通關文字打字機敘事、生存數據統計與重新開始功能

## 5. 自動化測試與整合驗證 (Verification)

- [x] 5.1 編寫 tests/starshipSystem.test.ts 涵蓋升級數值、物資消耗與升空條件判定
- [x] 5.2 執行 npm test 確保所有單元測試通過
- [x] 5.3 執行 npm run build 確保 TypeScript 型別與 Vite 打包無任何錯誤
