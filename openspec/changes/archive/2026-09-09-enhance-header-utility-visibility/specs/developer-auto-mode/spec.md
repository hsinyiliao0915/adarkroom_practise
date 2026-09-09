## Purpose

為便於測試與快速推進遊戲流程，提供可隨時切換的「開發者 / 自動模式」（Auto Mode），系統於開啟時自動執行常規繁瑣操作（如自動添柴、自動拾柴、自動收陷阱），並以符合黑白純文字美學之形式整合於頂部功能列。

## ADDED Requirements

### Requirement: Toggleable Auto Mode
系統 SHALL 在頂部工具列提供「自動模式」切換項目（`[ 自動: 關 ]` / `[ 自動: 開 ]` 或 `[ 自動模式: 關 ]` / `[ 自動模式: 開 ]`），玩家或開發者點擊即可即時切換開啟或關閉狀態。

#### Scenario: Toggling auto mode ON
- **WHEN** 玩家點擊頂部的 `[ 自動: 關 ]` 項目
- **THEN** 系統切換為開啟狀態，項目文字更新為 `[ 自動: 開 ]`，並在日誌記錄「自動模式已啟動。」，啟動自動巡檢迴圈

#### Scenario: Toggling auto mode OFF
- **WHEN** 玩家點擊頂部的 `[ 自動: 開 ]` 項目
- **THEN** 系統切換為關閉狀態，項目文字更新為 `[ 自動: 關 ]`，並在日誌記錄「自動模式已停止。」，停止所有自動點擊行為

### Requirement: Automated Essential Actions
當自動模式處於開啟狀態時，系統 SHALL 依據冷卻時間與資源條件，自動依序執行基礎生存動作：
1. **自動添柴（Auto Stoke Fire）**：當火堆尚未點燃或火勢減弱（小於燃燒狀態），且添柴冷卻完成時，自動觸發點火或添柴（開局免費添柴，若已解鎖森林且木材 > 0 則消耗 1 木材添柴）。
2. **自動拾柴（Auto Gather Wood）**：當已解鎖拾柴功能且拾柴按鈕冷卻完畢時，自動觸發拾柴動作。
3. **自動檢查陷阱（Auto Check Traps）**：當已建造陷阱且有收穫可供領取時，自動觸發收陷阱動作。

#### Scenario: Auto-stoking fire when fire flickers or dies
- **GIVEN** 自動模式開啟
- **WHEN** 火勢為 dead 或 flickering，且添柴按鈕可點擊（非冷卻中）
- **THEN** 系統自動觸發添柴操作，維持房間溫度與火勢

#### Scenario: Auto-gathering wood when cooldown expires
- **GIVEN** 自動模式開啟且室外森林已解鎖
- **WHEN** 拾柴冷卻時間歸零、按鈕恢復可點擊
- **THEN** 系統自動觸發拾柴並獲得木材，重置冷卻時間

#### Scenario: Auto-checking traps when available
- **GIVEN** 自動模式開啟且玩家已建造陷阱
- **WHEN** 陷阱捕獲資源可供採集且冷卻完畢
- **THEN** 系統自動執行檢查陷阱並收取物資

### Requirement: Monochrome Visual Alignment
自動模式開關 SHALL 完全融入極簡黑白文字風格，在 Dark 模式下以純白/亮灰呈現，Light 模式下以純黑/深灰呈現，無彩色干擾。

#### Scenario: Visual styling matches theme
- **WHEN** 切換 Dark 與 Light 模式
- **THEN** 自動模式按鈕字體、邊框與懸停反饋立即依循當前主題之高對比黑白配色動態更新
