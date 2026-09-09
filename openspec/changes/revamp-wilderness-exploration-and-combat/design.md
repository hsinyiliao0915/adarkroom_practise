## Context

當前《小黑屋》網頁版之荒野探索模組集中於 MapSystem.ts（邏輯層）與 MapView.ts（展示層）。
在先前的實作中，遠征探索缺乏「前哨站」中途補水跳板機制，且錯誤將肉乾當作口渴時的替代水分，導致生存數值循環中斷；同時，戰鬥邏輯被簡化為單一按鈕的回合式互攻，未發揮敵人資料中的 speed 屬性，亦缺乏小黑屋標誌性的多武器獨立冷卻槽。

本設計將確立前哨站補水、肉乾醫療、火把探索要求、迷霧視距遮罩以及 Phaser 時鐘驅動的半即時冷卻戰鬥系統。

## Goals / Non-Goals

**Goals:**
- **前哨站補水跳板**：清理地圖上的哨所地標（Outpost）後，踏入該格子立即將水壺全數補滿，建立深入探索的補給基地。
- **肉乾醫療與斷水受傷**：
  - 移除缺水自動吃肉乾邏輯，水歸零時每走一步扣減 2 HP。
  - 大地圖與戰鬥介面皆提供「吃肉乾 (Eat Cured Meat)」按鈕，每塊恢復 10 HP（不超過 maxHp）。
- **半即時冷卻戰鬥架構**：
  - 由 Phaser update(delta) 驅動戰鬥倒數。
  - 玩家擁有武器各自獨立計算冷卻條（拳頭 2s、骨矛 1.5s、鐵劍 2.5s、鋼劍 2.5s、步槍 4s 扣子彈）。
  - 敵人依據 speed 週期性攻擊，具備即時攻擊進度條。
  - 戰鬥中支援隨時吃肉乾急救與冷卻逃跑。
- **動態迷霧遮罩**：未探索區域（包括未造訪地標）不繪出任何標記（消除透視點 ·），僅在視野範圍內（視距 2 格）或已踏足過時顯現地標。
- **火把洞穴消耗**：搜刮深層地下洞穴需消耗 1 火把。
- **礦坑肅清連動村莊**：村莊指派鐵礦工與煤礦工前，需確認對應地標已在野外被清理。

**Non-Goals:**
- 不引入額外像素 Sprite 圖集，維持純 ASCII 文字網格與極簡風格。
- 暫不引入陷阱、毒氣或特殊天候系統，聚焦核心經典要素。

## Decisions

### 1. 戰鬥計時驅動：Phaser 遊戲主時鐘驅動
- **決定**：在 MapSystem 中提供 updateCombat(delta: number, state: GameData) 方法，由 MainScene.update -> MapView.update 逐幀呼叫。
- **理由**：比起獨立的 setInterval 或 setTimeout，透過 Phaser 原生 delta 推進計時，能確保在遊戲暫停、分頁切換或場景重置時時間步長一致，避免計時器殘留或幽靈扣血。
- **替代方案**：使用 DOM setInterval（缺點：與 Phaser 生命週期脫節、容易發生記憶體洩漏與背景跳幀時序混亂）。

### 2. 多武器冷卻狀態儲存與介面呈現
- **決定**：在 ExpeditionState 中加入 weaponCooldowns: Record<string, number> 與 enemyAttackCooldown: number。戰鬥面板動態產生已攜帶武器的專屬按鈕，按鈕下方或文字旁即時更新冷卻百分比／剩餘秒數。
- **理由**：讓玩家能根據戰況靈活安排武器攻擊順序（例如：起手開槍、長矛穿插、長劍重擊、拳頭補刀），高度重現小黑屋的戰鬥精髓。

### 3. 前哨站與地標識別機制
- **決定**：地標定義中加入 isOutpost?: boolean 屬性（如哨所 outpost 與小鎮 bandoned_town）。當 state.clearedLandmarks 包含該地標時，地圖符號保持為高亮 O / V，且 MapSystem.move 判定踏入該座標時自動執行 state.expedition.water = state.expedition.maxWater 並發送補水日誌。

### 4. 迷霧視野動態判定
- **決定**：以玩家當前座標為中心計算曼哈頓或切比雪夫距離（半徑 2 格）。若未踏足過且距離 > 2，繪製全空白 '   '；若在視野內且為地標，未訪問時標記為  ? ，已訪問則標記為專屬符號（如 I、C、O）。

## Risks / Trade-offs

- **[Risk: 舊存檔相容性]** 擴充 ExpeditionState 欄位（weaponCooldowns、enemyAttackCooldown）可能在載入舊版存檔時為 undefined。
  → **Mitigation**：在 SaveManager.validateAndSanitize 與 startExpedition 中初始化完整的空字典與數值預設值。
- **[Risk: 高頻點擊或冷卻不同步]** 玩家在冷卻期間頻繁點擊攻擊按鈕。
  → **Mitigation**：按鈕在冷卻中設為 Disabled 或文字變灰，且在 ttackWithWeapon 邏輯層嚴格檢查冷卻值 <= 0，雙重守衛。
