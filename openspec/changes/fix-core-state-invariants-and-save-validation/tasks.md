## 1. 測試環境建置

- [ ] 1.1 在 package.json 中配置測試腳本，並建立測試執行環境以驗證測試可正常執行
- [ ] 1.2 建立測試用模擬狀態與資料產生輔助模組

## 2. 存檔健全度與邊界驗證

- [ ] 2.1 在 SaveManager 實作狀態校驗與清洗器（Sanitizer），過濾 NaN 與負數數值，並編寫測試驗證防護有效
- [ ] 2.2 修正 MainScene 存檔按鈕回呼，依據 save() 回傳值呈現成功或警告通知

## 3. 遠征狀態與物資槍彈守恆

- [ ] 3.1 修正 MapSystem 遠征出發邏輯，正確扣減子彈庫存與設定裝備，並以單元測試驗證守恆
- [ ] 3.2 修正遠征戰鬥子彈消耗與平安返航時的物資歸還回寫機制
- [ ] 3.3 修正 MapSystem.dieInWilderness，重置遠征狀態、物資與座標回安全屋出生點

## 4. 系統業務邏輯前置守衛

- [ ] 4.1 於 CraftSystem.craft 加入 unlockRequirement 前置檢核，阻斷未解鎖物品製作
- [ ] 4.2 於 VillageSystem.build 加入 unlockRequirement 前置檢核，阻斷未解鎖建築建造
- [ ] 4.3 於 VillageSystem.assignWorker 加入 job.requiredBuilding 前置檢核，阻斷無建築指派工人

## 5. 整合驗證

- [ ] 5.1 執行 npm test 確保所有狀態不變量與守衛單元測試通過
- [ ] 5.2 執行 npm run build 確保 TypeScript 型別檢查與前端打包無任何錯誤
