## Why

目前遊戲核心狀態（GameState）與存檔（SaveManager）缺乏嚴格的型別、邊界與數值範圍校驗，且遠征系統在槍彈、物資消耗與死亡重置上存在狀態不守恆與不一致的嚴重邏輯缺陷。此外，建築製作與工人指派的前置條件僅依賴前端 UI 隱藏，未在 System 核心層進行檢核。此變更旨在修復這些核心狀態不變量（State Invariants）並補齊自動化測試，確保資料持久化與遊戲規則的健全性。

## What Changes

- **SaveManager 健全度重構**：
  - 加入完整的狀態 Schema 驗證、版本號檢核、型別與範圍保護（防止 NaN、負數資源、非法字串注入）。
  - 修正 `save()` 回傳值處理，當 localStorage 寫入失敗或配額超限時，UI 顯示警告而非虛假成功訊息。
- **遠征系統守恆與重置邏輯修正**：
  - 修正獵槍（rifle）與子彈（bullets）的庫存扣減、戰鬥消耗與返航結算守恆機制。
  - 修正遠征死亡邏輯（`dieInWilderness`），確保將座標正確重置回出生點（SPAWN_POINT），並清除殘留的遠征物資與戰鬥狀態。
- **System 層前置守衛（Guard Conditions）**：
  - `CraftSystem.craft()`：在 System 層強制校驗 `recipe.unlockRequirement`。
  - `VillageSystem.build()`：在 System 層強制校驗 `recipe.unlockRequirement`。
  - `VillageSystem.assignWorker()`：在 System 層強制校驗各職業的 `job.requiredBuilding`。
- **測試基礎設施建置**：
  - 在 `package.json` 中配置原生或輕量測試腳本，為存檔驗證與核心狀態不變量提供自動化單元測試。

## Capabilities

### New Capabilities
- `state-validation`: 存檔驗證、Schema 檢核與防禦性預設還原機制。
- `expedition-invariants`: 遠征物資、槍彈守恆與生死狀態一致性保證。
- `system-guards`: 建築建造、物品製作與工人指派之底層規則守衛。

### Modified Capabilities
<!-- 本變更為初始引進 OpenSpec 規範，無現有 capability spec 需要修改 -->

## Impact

- `src/core/SaveManager.ts`：增加校驗器與健全的錯誤處理。
- `src/core/GameState.ts`：明確規範型別邊界。
- `src/systems/MapSystem.ts`：修復物資守恆與死亡重置。
- `src/systems/CraftSystem.ts`：加入解鎖前置條件守衛。
- `src/systems/VillageSystem.ts`：加入建築與工人職位前置條件守衛。
- `src/scenes/MainScene.ts`：正確響應存檔失敗。
- `package.json`：新增 `test` 腳本與測試檔案。
