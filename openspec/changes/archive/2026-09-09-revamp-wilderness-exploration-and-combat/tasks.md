## 1. 遊戲狀態與資料模型擴充

- [x] 1.1 擴充 GameState.ts 中的 ExpeditionState 與 Landmark 定義，加入 weaponCooldowns、enemyAttackCooldown、isOutpost 與 requiresTorch 屬性，並透過單元測試驗證初始化
- [x] 1.2 在 SaveManager.ts 的 validateAndSanitize 增強對新戰鬥冷卻欄位的安全預設值填補，驗證舊存檔載入相容性

## 2. 前期經濟、推車、誘餌與指南針解鎖修復

- [x] 2.1 修正 recipes.ts 中的指南針與推車配方：推車改為 30 木材、指南針移除精鐵要求（改為 scales, teeth, fur），並以單元測試驗證製作條件
- [x] 2.2 在 ResourceSystem.ts 與 RoomSystem.ts 實作陷阱投放誘餌（trapBaitMeat）與檢查誘餌消耗，顯著提升尖牙/鱗片捕獲率，並編寫單元測試驗證
- [x] 2.3 在 RoomView.ts 增加「投放誘餌 (1 生肉)」按鈕，並於 VillageView.ts 實作工作職位漸進式揭露（未解鎖時隱藏）

## 3. 前哨站補水、肉乾醫療與火把洞穴探索

- [x] 3.1 修改 MapSystem.ts 移動邏輯：移除缺水時自動消耗肉乾，改為斷水每步扣減 2 HP；踏入已肅清之前哨站自動補滿水壺，並以單元測試驗證
- [x] 3.2 在 MapSystem.ts 實作主動 eatCuredMeat 方法，消耗 1 肉乾回復 10 HP（不超過上限），並以單元測試驗證
- [x] 3.3 修改 MapSystem.ts 的 scavengeLandmark：對洞穴地標要求並扣除 1 支火把，無火把則阻斷搜刮，並以單元測試驗證

## 4. 迷霧視野與大地圖介面修正

- [x] 4.1 修改 MapView.ts 的 renderAsciiMap：消除未造訪地標之洩漏渲染，未探索區域統一為迷霧，僅在視距 2 格內或已造訪時揭曉
- [x] 4.2 在 MapView.ts 大地圖介面加入吃肉乾回血按鈕與前哨站狀態標籤

## 5. 半即時冷卻戰鬥系統

- [x] 5.1 在 MapSystem.ts 實作 updateCombat(delta, state)，依時間推進玩家各武器冷卻與敵人 speed 週期攻擊計時，以單元測試驗證計時運算
- [x] 5.2 在 MapSystem.ts 實作 attackWithWeapon(state, weaponType)，嚴格檢驗獨立冷卻與步槍子彈，並以單元測試驗證
- [x] 5.3 在 MapView.ts 重構戰鬥介面：動態產生已攜帶武器之專屬攻擊按鈕、冷卻倒數進度、敵方攻擊計時條與戰時吃肉乾急救

## 6. 地標肅清與村莊採礦解鎖聯動

- [x] 6.1 修改 src/data/recipes.ts 與 VillageSystem.ts：將鐵礦工與煤礦工的前置解鎖條件綁定至對應礦坑地標是否已清空，並以單元測試驗證

## 7. 整合驗證

- [x] 7.1 執行 npm test 確保所有單元測試通過
- [x] 7.2 執行 npm run build 確保 TypeScript 型別檢查與前端打包無任何錯誤
