## Why

目前遊戲核心狀態（GameState）與存檔（SaveManager）缺乏嚴格的型別、邊界與數值範圍校驗，且存檔機制為單一硬編碼槽位，無法為存檔命名、無法保留多份進度，且點擊重置會抹殺所有歷史紀錄。此外，遠征系統在槍彈、物資消耗與死亡重置上存在狀態不守恆與不一致的嚴重邏輯缺陷，建築製作與工人指派的前置條件也未在 System 核心層進行檢核。此變更旨在修復這些核心狀態不變量（State Invariants），升級為支援「自訂命名存檔、多存檔槽位與新遊戲」的健全儲存體系，並補齊自動化測試。

## What Changes

- **SaveManager 健全度重構與多槽位命名存檔**：
  - 加入完整的狀態 Schema 驗證、版本號檢核、型別與範圍保護（防止 NaN、負數資源、非法字串注入）。
  - 支援「建立命名存檔（Named Saves）」：存檔時可輸入自訂名稱，並記錄時間、人口與天數等元資訊。
  - 支援「開啟新遊戲（New Game）」：可開啟全新開局並另存新檔，不破壞既有的其他歷史進度。
  - 支援「存檔列表管理」：可檢視既有存檔清單、切換載入不同進度或刪除舊存檔。
  - 自動遷移舊版單一存檔（`ADARKROOM_SAVE_V1`）至預設槽位，確保玩家資料無縫過渡。
  - 修正 `save()` 回傳值處理，當 localStorage 寫入失敗或配額超限時，UI 顯示警告而非虛假成功訊息。
- **遠征系統守恆與重置邏輯修正**：
  - 修正獵槍（rifle）與子彈（bullets）的庫存扣減、戰鬥消耗與返航結算守恆機制。
  - 修正遠征死亡邏輯（`dieInWilderness`），確保將座標正確重置回出生點（SPAWN_POINT），並清除殘留的遠征物資與戰鬥狀態。
- **System 層前置守衛（Guard Conditions）**：
  - `CraftSystem.craft()`：在 System 層強制校驗 `recipe.unlockRequirement`。
  - `VillageSystem.build()`：在 System 層強制校驗 `recipe.unlockRequirement`。
  - `VillageSystem.assignWorker()`：在 System 層強制校驗各職業的 `job.requiredBuilding`。
- **測試基礎設施建置**：
  - 在 `package.json` 中配置原生測試腳本，為多槽位存檔驗證與核心狀態不變量提供自動化單元測試。

## Capabilities

### New Capabilities
- `state-validation`: 存檔驗證、Schema 檢核與防禦性預設還原機制。
- `named-saves`: 支援自訂命名存檔、多槽位儲存管理與獨立開啟新遊戲功能。
- `expedition-invariants`: 遠征物資、槍彈守恆與生死狀態一致性保證。
- `system-guards`: 建築建造、物品製作與工人指派之底層規則守衛。

### Modified Capabilities
<!-- 本變更為初始引進 OpenSpec 規範，無現有 capability spec 需要修改 -->

## Impact

- `src/core/SaveManager.ts`：實作槽位索引（Save Index）、命名存檔與校驗清洗器。
- `src/core/GameState.ts`：增加存檔元資料（SaveMetadata）介面與型別定義。
- `src/ui/SaveLoadModal.ts`：新增存檔/讀檔/新遊戲之管理互動視窗。
- `src/systems/MapSystem.ts`：修復物資守恆與死亡重置。
- `src/systems/CraftSystem.ts`：加入解鎖前置條件守衛。
- `src/systems/VillageSystem.ts`：加入建築與工人職位前置條件守衛。
- `src/scenes/MainScene.ts`：串接存檔管理視窗與新遊戲流程。
- `package.json`：新增 `test` 腳本與測試檔案。
