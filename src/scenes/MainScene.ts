import Phaser from 'phaser';
import { GameData, ActiveTab } from '../core/GameState';
import { SaveManager } from '../core/SaveManager';
import { TickEngine } from '../core/TickEngine';
import { EventBus, Events } from '../core/EventBus';
import { LogPanel } from '../ui/LogPanel';
import { ResourcePanel } from '../ui/ResourcePanel';
import { RoomView } from '../ui/RoomView';
import { VillageView } from '../ui/VillageView';
import { CraftView } from '../ui/CraftView';
import { MapView } from '../ui/MapView';
import { TextButton } from '../ui/TextButton';
import { createTextStyle } from '../config/typography';

export class MainScene extends Phaser.Scene {
  public gameState!: GameData;

  private logPanel!: LogPanel;
  private resourcePanel!: ResourcePanel;
  
  private roomView!: RoomView;
  private villageView!: VillageView;
  private craftView!: CraftView;
  private mapView!: MapView;

  private tabButtons: Map<ActiveTab, TextButton> = new Map();

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    // 1. Load saved state or default
    this.gameState = SaveManager.getInstance().load();

    // 2. Setup Top Bar (Title & Tabs & Utilities)
    this.createTopBar();

    // 3. Create Panels
    // Left: Event Log Panel
    this.logPanel = new LogPanel(this, 18, 55, 270, 645);
    this.logPanel.initFromState(this.gameState);

    // Center Views Container
    const centerViewX = 300;
    const centerViewY = 55;
    const centerViewW = 490;
    const centerViewH = 645;

    // View Background
    const viewBg = this.add.rectangle(centerViewX, centerViewY, centerViewW, centerViewH, 0x12141a, 0.95);
    viewBg.setOrigin(0);
    const viewBorder = this.add.rectangle(centerViewX, centerViewY, centerViewW, centerViewH);
    viewBorder.setStrokeStyle(1, 0x272c38);
    viewBorder.setFillStyle(0x000000, 0);
    viewBorder.setOrigin(0);

    this.roomView = new RoomView(this, centerViewX, centerViewY, centerViewW);
    this.villageView = new VillageView(this, centerViewX, centerViewY);
    this.craftView = new CraftView(this, centerViewX, centerViewY);
    this.mapView = new MapView(this, centerViewX, centerViewY);

    // Right: Resource Inventory Panel
    this.resourcePanel = new ResourcePanel(this, 802, 55, 230, 645);

    // 4. Switch to current tab
    this.switchTab(this.gameState.activeTab);

    // 5. Subscribe to EventBus
    EventBus.getInstance().on(Events.STATE_CHANGED, () => {
      this.refreshUI();
    });

    EventBus.getInstance().on(Events.TAB_UNLOCKED, (tabKey: ActiveTab) => {
      if (this.tabButtons.has(tabKey)) {
        this.tabButtons.get(tabKey)!.setVisible(true);
      }
    });

    // 6. Start Tick Engine & AutoSave
    TickEngine.getInstance().start(() => this.gameState, 500);
    SaveManager.getInstance().startAutoSave(() => this.gameState, 10000);

    // Initial render
    this.refreshUI();
  }

  private createTopBar(): void {
    // Title
    this.add.text(
      20,
      16,
      '小 黑 屋 (A Dark Room)',
      createTextStyle('15px', '#f8fafc')
    );

    // Tab buttons
    const tabs: Array<{ key: ActiveTab; label: string }> = [
      { key: 'room', label: '小黑屋' },
      { key: 'village', label: '聚落' },
      { key: 'craft', label: '製造所' },
      { key: 'map', label: '荒野探索' }
    ];

    let tabStartX = 300;
    tabs.forEach((tab) => {
      const btn = new TextButton(this, tabStartX + 45, 25, {
        text: tab.label,
        width: 85,
        height: 28,
        fontSize: '12px',
        onClick: () => {
          this.switchTab(tab.key);
        }
      });

      // Tab visibility
      btn.setVisible(this.gameState.unlockedTabs[tab.key]);
      this.tabButtons.set(tab.key, btn);
      tabStartX += 95;
    });

    // Save & Reset Buttons on top right
    new TextButton(this, 915, 25, {
      text: '存檔',
      width: 55,
      height: 26,
      fontSize: '11px',
      onClick: () => {
        SaveManager.getInstance().save(this.gameState);
        EventBus.getInstance().emit(Events.LOG_MESSAGE, '遊戲進度已手動保存至瀏覽器。', 'info');
      }
    });

    new TextButton(this, 980, 25, {
      text: '重置',
      width: 55,
      height: 26,
      fontSize: '11px',
      onClick: () => {
        if (window.confirm('確定要清除所有進度並重新開始嗎？')) {
          SaveManager.getInstance().clear();
          window.location.reload();
        }
      }
    });
  }

  public switchTab(tab: ActiveTab): void {
    this.gameState.activeTab = tab;

    this.roomView.setVisible(tab === 'room');
    this.villageView.setVisible(tab === 'village');
    this.craftView.setVisible(tab === 'craft');
    this.mapView.setVisible(tab === 'map');

    this.refreshUI();
  }

  public refreshUI(): void {
    // Update active tab buttons visual
    this.tabButtons.forEach((btn, key) => {
      btn.setVisible(this.gameState.unlockedTabs[key]);
    });

    // Update views
    if (this.roomView.visible) this.roomView.updateDisplay(this.gameState);
    if (this.villageView.visible) this.villageView.updateDisplay(this.gameState);
    if (this.craftView.visible) this.craftView.updateDisplay(this.gameState);
    if (this.mapView.visible) this.mapView.updateDisplay(this.gameState);

    // Update resource sidebar
    this.resourcePanel.updateDisplay(this.gameState);
  }

  update(_time: number, delta: number): void {
    // Forward update to active views for animations/cooldowns
    if (this.roomView.visible) this.roomView.update(delta);
    if (this.mapView.visible) this.mapView.update(delta);
  }
}
