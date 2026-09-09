## 1. 測試環境建置

- [x] 1.1 在 package.json 中配置測試腳本，並建立測試執行環境以驗證測試可正常執行
- [x] 1.2 建立測試用模擬狀態與資料產生輔助模組

## 2. 存檔健全度與多槽位命名儲存（SaveManager）

- [x] 2.1 在 SaveManager 實作狀態校驗與清洗器（Sanitizer），過濾 NaN 與負數數值，並編寫測試驗證防護有效
- [x] 2.2 實作多槽位索引（Save Index）與舊存檔自動相容遷移機制
- [x] 2.3 實作「建立命名存檔」、「覆蓋現有存檔」、「載入指定存檔」與「刪除存檔」方法，並編寫單元測試驗證
- [x] 2.4 實作「開啟新遊戲」流程，在保留既有存檔前提下重置活躍狀態為全新開局
- [x] 2.5 建立 SaveLoadModal 存檔管理彈窗 UI，支援輸入自訂名稱存檔、檢視存檔列表與新遊戲操作

## 3. 遠征狀態與物資槍彈守恆

- [x] 3.1 修正 MapSystem 遠征出發邏輯，正確扣減子彈庫存與設定裝備，並以單元測試驗證守恆
- [x] 3.2 修正遠征戰鬥子彈消耗與平安返航時的物資歸還回寫機制
- [x] 3.3 修正 MapSystem.dieInWilderness，重置遠征狀態、物資與座標回安全屋出生點

## 4. 系統業務邏輯前置守衛

- [x] 4.1 於 CraftSystem.craft 加入 unlockRequirement 前置檢核，阻斷未解鎖物品製作
- [x] 4.2 於 VillageSystem.build 加入 unlockRequirement 前置檢核，阻斷未解鎖建築建造
- [x] 4.3 於 VillageSystem.assignWorker 加入 job.requiredBuilding 前置檢核，阻斷無建築指派工人

## 5. 整合驗證

- [x] 5.1 執行 npm test 確保所有存檔槽位、狀態不變量與守衛單元測試通過
- [x] 5.2 執行 npm run build 確保 TypeScript 型別檢查與前端打包無任何錯誤
