## Purpose

規範遊戲頂部右側實用導航列（存檔管理、新遊戲與主題切換）之視覺顯眼度、字級可讀性、互動懸停反饋與深淺色雙主題對比規範。

## ADDED Requirements

### Requirement: Enhanced Utility Navigation Visibility and Sizing
系統 SHALL 在頂部右側以不小於 12px 的清晰字級展示「存檔管理」、「新遊戲」與主題切換（「開燈」或「熄燈」）功能，並提供明確的視覺邊界與對比度，使玩家能立即辨識其為可互動功能項。

#### Scenario: Utility links are clearly legible at top right
- **WHEN** 玩家進入遊戲主畫面
- **THEN** 頂部右側清晰顯示「開燈/熄燈」、「存檔管理」與「新遊戲」，字級與對比度顯著高於背景且無模糊縮小現象

#### Scenario: Clear separation between utility actions
- **WHEN** 玩家檢視頂部工具列
- **THEN** 各個功能項目之間 SHALL 具備可清晰識別的間距與分隔元素，避免項目黏著無法辨識

### Requirement: Interactive Hover and Feedback State
系統 SHALL 為頂部實用功能連結提供滑鼠懸停（Hover）及點擊互動回饋，當游標移入時顯著變更文字亮度或反色。

#### Scenario: Hovering over Save Management link
- **WHEN** 玩家將滑鼠游標移至「存檔管理」文字上方
- **THEN** 該項目即時變亮或產生反白互動回饋，移出時平滑回復預設樣式

#### Scenario: Clicking New Game link
- **WHEN** 玩家點擊「新遊戲」
- **THEN** 系統彈出防誤觸確認視窗，確認後乾淨重啟開局並保留既有本機歷史存檔

### Requirement: Seamless Dark and Light Mode Alignment
頂部功能導航 SHALL 依據當前遊戲主題（Dark 或 Light）動態切換色彩階層，在暗色背景（黑底）下維持高對比純白/明亮文字，在亮色背景（白底）下維持深色/純黑文字。

#### Scenario: Switching from Dark to Light mode
- **WHEN** 玩家點擊「開燈」按鈕切換至亮色主題
- **THEN** 頂部工具列所有項目與分隔線立即無縫轉換為亮色模式之深色高對比配色，且按鈕文字即時更新為「熄燈」

#### Scenario: Switching from Light to Dark mode
- **WHEN** 玩家點擊「熄燈」按鈕切換至暗色主題
- **THEN** 頂部工具列所有項目與分隔線立即無縫轉換為暗色模式之高對比配色，且按鈕文字即時更新為「開燈」

### Requirement: Pure Monochrome Palette Harmonization
遊戲介面（包含日誌面板、生火間狀態、彈窗與導航）SHALL 遵循純黑白單色美學，SHALL NOT 出現非黑白的亮橘、亮藍等雜色。日誌訊息的時間先後與層次 SHALL 僅透過透明度（Alpha）漸層表達。

#### Scenario: All log messages render in pure monochrome
- **WHEN** 系統發送不同類型（story, warn, info 等）的日誌訊息
- **THEN** 所有文字均以純白（Dark 模式）或純黑（Light 模式）呈現，無彩色高亮，僅依據訊息新舊呈現透明度層次

#### Scenario: Room and modal text in pure monochrome
- **WHEN** 檢視生火間火勢狀態或開啟存檔彈窗
- **THEN** 所有標題與狀態文字均維持與主題對應之純白、純黑或中性灰，無彩色字體干擾
