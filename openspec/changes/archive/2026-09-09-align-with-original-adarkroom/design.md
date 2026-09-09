## Context

經過對齊官方原始碼（`room.js`、`outside.js`、`engine.js`），原版《A Dark Room》前期有非常嚴謹的節奏狀態機：
- 開局：火已熄滅，溫度極冷，沒有任何頁籤，沒有右側庫存欄（`stores.wood` 為 undefined）。
- 點火：火堆燃燒（Burning），「火光穿過窗戶，灑在黑暗之中」，溫度逐步升高。按鈕切為添柴。此時庫存依然不存在，森林依然未解鎖。
- 陌生人跌入：衣衫襤褸的女子闖入並昏倒在角落。
- 森林解鎖（`unlockForest`）：陌生人昏倒後 15 秒，「屋外寒風呼嘯」、「木材快要燒完了」，此時 `stores.wood = 4`，右側「庫存」線框首次浮現，上方出現「生火間 | 靜謐森林」頁籤！
- 陌生人甦醒：屋內升溫到「溫暖」，陌生人停止發抖，起身成為建造者，生火間解鎖建造「陷阱」與「貨車」。

## Goals / Non-Goals

**Goals:**
- 1:1 還原上述狀態機時序與文本，徹底解決「開局就顯示庫存」與「森林突然彈出」的問題。
- 保留外層大框（`#game-container`）與全專案正體中文（繁體中文），自然在地化用語。
- 記憶體中 `discoveredKeys` 隨存檔切換/開新局重設，杜絕殘留狀態。

**Non-Goals:**
- 不修改後期大地圖戰鬥演算法與星艦逃脫小遊戲。

## Decisions

### 1. 開局與庫存重設
- 在 `ResourcePanel` 中增加 `resetDiscovered(state)`，開新遊戲或讀檔時強制重設 `discoveredKeys`。
- 新遊戲開局時 `state.unlockedForest = false`、`state.unlockedTabs.forest = false`，且 `stores.wood = 0`。庫存容器嚴格在 `unlockedForest` 觸發前保持 `visible = false`。

### 2. 生火間狀態機時序
- `RoomSystem.lightFire`:
  - 火堆設為 `burning`。
  - 發布日誌「火光穿透窗戶，灑入無邊的黑暗之中。」
  - 啟動陌生人接近計時器（約 8-10 秒觸發陌生人跌入門檻）。
- 陌生人跌入：
  - 發布日誌「一名衣衫襤褸的陌生人跌跌撞撞穿過門口，癱倒在角落。」
  - 啟動森林解鎖計時器（約 12-15 秒觸發）。
- `unlockForest`:
  - `state.resources.wood = 4`。
  - `state.unlockedForest = true`，`state.unlockedTabs.forest = true`。
  - 發布日誌「屋外寒風呼嘯。」「木材快要燒完了。」
  - 右側庫存框首次以動畫或自適應浮現，中央上方出現頁籤切換。
