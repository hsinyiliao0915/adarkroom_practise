## Why

當前小黑屋已完成前期經濟、村莊發展與荒野探索戰鬥，但遊戲流程尚未具備原版小黑屋的核心終局主線——「墜毀外星巡航艦的修復、星艦升空閃避障礙小遊戲與逃離地球通關結局」。實作此變更將補齊遊戲最後且最關鍵的一塊拼圖，讓玩家能達成完整的通關目標與通關結局。

## What Changes

- **星艦分頁解鎖 (Ship Tab)**：在荒野大地圖探索並肅清「墜毀的外星巡航艦 (★)」地標後，自動解鎖頂部「星艦」分頁 (`ship`)。
- **星艦修復與強化系統 (Starship Upgrades)**：
  - **船體加固 (Reinforced Hull)**：消耗合金強化星艦裝甲與生命值，吸收太空隕石撞擊。
  - **引擎推力 (Thruster Engine)**：消耗合金強化推進器，提高升空上升速率並縮短閃避生存時間。
- **太空升空閃避小遊戲 (Space Flight Mini-Game)**：
  - 玩家點擊「啟動升空」後進入全螢幕星際升空介面，使用鍵盤方向鍵或 WASD 操控星艦左右穿梭。
  - 太空隕石、殘骸碎屑與星際防禦雷達波束由上方持續向下襲擊。
  - 撞擊隕石扣減船體強度；船體歸零則墜回地面保留升級；航向高度達標（例如 1000m / 脫離引力井）則通關成功。
- **文字敘事結局與結算畫面 (Epilogue & Ending Screen)**：
  - 星艦成功逃逸大氣層時觸發原版經典文字結局（俯瞰荒涼凍土、回望安靜小室與村莊流浪者，航向未知星系）。
  - 結算統計通關天數、收集成果，並提供重新開啟新周目之選項。

## Capabilities

### New Capabilities
- `starship-repair-and-upgrades`: 規範墜毀星艦解鎖前置、外星合金修復消耗與船體／引擎數值強化機制。
- `space-flight-and-ending`: 規範太空升空操控、動態障礙物碰撞損耗、引力逃逸條件與終局敘事結算畫面。

### Modified Capabilities
<!-- None -->

## Impact
- `src/core/GameState.ts`: 新增 `'ship'` 分頁至 `ActiveTab`，擴充 `StarshipState` 包含船體強度、引擎等級與通關標記。
- `src/core/SaveManager.ts`: 增加星艦狀態的持久化儲存與防禦預設值。
- `src/systems/MapSystem.ts`: 搜刮星艦地標時觸發解鎖星艦分頁。
- `src/systems/StarshipSystem.ts`: 新增星艦升級與升空飛行邏輯系統。
- `src/ui/ShipView.ts`: 新增星艦整備維修分頁視圖。
- `src/ui/SpaceFlightView.ts`: 新增升空飛行閃避小遊戲與結局敘事視圖。
- `src/scenes/MainScene.ts`: 整合頂部星艦按鈕與飛行場景過渡。
