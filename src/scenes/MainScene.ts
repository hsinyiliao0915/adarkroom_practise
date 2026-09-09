import Phaser from 'phaser';
import { GameData, ActiveTab } from '../core/GameState';
import { SaveManager } from '../core/SaveManager';
import { TickEngine } from '../core/TickEngine';
import { EventBus, Events } from '../core/EventBus';
import { LogPanel } from '../ui/LogPanel';
import { ResourcePanel } from '../ui/ResourcePanel';
import { RoomView } from '../ui/RoomView';
import { OutsideView } from '../ui/OutsideView';
import { VillageView } from '../ui/VillageView';
import { CraftView } from '../ui/CraftView';
import { MapView } from '../ui/MapView';
import { ShipView } from '../ui/ShipView';
import { SpaceFlightView } from '../ui/SpaceFlightView';
import { SaveLoadModal } from '../ui/SaveLoadModal';
import { createTextStyle } from '../config/typography';

interface TabItem {
  key: ActiveTab;
  label: string;
  textObj: Phaser.GameObjects.Text;
  sepObj?: Phaser.GameObjects.Text;
}

export class MainScene extends Phaser.Scene {
  public gameState!: GameData;

  private logPanel!: LogPanel;
  private resourcePanel!: ResourcePanel;
  
  private roomView!: RoomView;
  private outsideView!: OutsideView;
  private villageView!: VillageView;
  private craftView!: CraftView;
  private mapView!: MapView;
  private shipView!: ShipView;
  private spaceFlightView!: SpaceFlightView;
  private saveLoadModal!: SaveLoadModal;

  private inlineTabs: TabItem[] = [];
  private activeUnderline!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    // 1. Load saved state or default
    this.gameState = SaveManager.getInstance().load();

    // 2. Setup Top Title & Inline Tabs & Utilities
    this.createHeaderAndTabs();
    this.createUtilityLinks();

    // 3. Create Panels
    // Left: Event Log Panel
    this.logPanel = new LogPanel(this, 18, 55, 270, 645);
    this.logPanel.initFromState(this.gameState);

    // Center Views Container
    const centerViewX = 320;
    const centerViewY = 55;
    const centerViewW = 470;

    this.roomView = new RoomView(this, centerViewX, centerViewY, centerViewW);
    this.outsideView = new OutsideView(this, centerViewX, centerViewY);
    this.villageView = new VillageView(this, centerViewX, centerViewY);
    this.craftView = new CraftView(this, centerViewX, centerViewY);
    this.mapView = new MapView(this, centerViewX, centerViewY);
    this.shipView = new ShipView(this, centerViewX, centerViewY, () => {
      this.startSpaceFlight();
    });
    this.spaceFlightView = new SpaceFlightView(
      this,
      centerViewX,
      centerViewY,
      () => {
        this.switchTab('ship');
      },
      () => {
        const newGame = SaveManager.getInstance().startNewGame();
        this.gameState = newGame.state;
        this.switchTab('room');
        this.logPanel.initFromState(this.gameState);
        this.refreshUI();
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `已開啟全新冒險【${newGame.metadata.name}】！火堆已熄滅，房間很冷。`, 'story');
      }
    );

    // Right: Resource Inventory Panel
    this.resourcePanel = new ResourcePanel(this, 810, 55, 220, 645);

    // 4. Create Save/Load Modal
    this.saveLoadModal = new SaveLoadModal(this);

    // 5. Switch to current tab
    this.switchTab(this.gameState.activeTab);

    // 6. Subscribe to EventBus
    EventBus.getInstance().on(Events.STATE_CHANGED, () => {
      this.refreshUI();
    });

    EventBus.getInstance().on(Events.TAB_UNLOCKED, () => {
      this.updateTabsLayout();
    });

    // 7. Start Tick Engine & AutoSave
    TickEngine.getInstance().start(() => this.gameState, 500);
    SaveManager.getInstance().startAutoSave(() => this.gameState, 10000);

    // Initial render
    this.refreshUI();
  }

  private createHeaderAndTabs(): void {
    // Title
    this.add.text(
      20,
      18,
      '小 黑 屋 (A Dark Room)',
      createTextStyle('14px', '#cbd5e1')
    );

    // Active Tab Underline (1px line under current tab)
    this.activeUnderline = this.add.rectangle(320, 36, 40, 1, 0xffffff, 0.9);
    this.activeUnderline.setOrigin(0, 0);

    const tabDefs: Array<{ key: ActiveTab; label: string }> = [
      { key: 'room', label: '生火間' },
      { key: 'forest', label: '靜謐森林' },
      { key: 'village', label: '聚落' },
      { key: 'craft', label: '工作坊' },
      { key: 'map', label: '荒野探索' },
      { key: 'ship', label: '星艦' }
    ];

    tabDefs.forEach((def) => {
      const textObj = this.add.text(0, 18, def.label, createTextStyle('14px', '#94a3b8'));
      textObj.setInteractive({ useHandCursor: true });
      textObj.on('pointerover', () => {
        if (this.gameState.activeTab !== def.key) {
          textObj.setColor('#e2e8f0');
        }
      });
      textObj.on('pointerout', () => {
        if (this.gameState.activeTab !== def.key) {
          textObj.setColor('#94a3b8');
        }
      });
      textObj.on('pointerdown', () => {
        this.switchTab(def.key);
      });

      const sepObj = this.add.text(0, 18, '|', createTextStyle('14px', '#475569'));
      sepObj.setVisible(false);

      this.inlineTabs.push({
        key: def.key,
        label: def.label,
        textObj,
        sepObj
      });
    });

    this.updateTabsLayout();
  }

  private createUtilityLinks(): void {
    const saveLink = this.add.text(880, 20, '存檔管理', createTextStyle('11px', '#64748b'));
    saveLink.setInteractive({ useHandCursor: true });
    saveLink.on('pointerover', () => saveLink.setColor('#cbd5e1'));
    saveLink.on('pointerout', () => saveLink.setColor('#64748b'));
    saveLink.on('pointerdown', () => this.saveLoadModal.show(this));

    const newGameLink = this.add.text(950, 20, '新遊戲', createTextStyle('11px', '#64748b'));
    newGameLink.setInteractive({ useHandCursor: true });
    newGameLink.on('pointerover', () => newGameLink.setColor('#cbd5e1'));
    newGameLink.on('pointerout', () => newGameLink.setColor('#64748b'));
    newGameLink.on('pointerdown', () => {
      if (window.confirm('確定要開啟新遊戲嗎？現有歷史存檔將完整保留，系統將為你建立全新開局。')) {
        const newGame = SaveManager.getInstance().startNewGame();
        this.gameState = newGame.state;
        this.switchTab('room');
        this.logPanel.initFromState(this.gameState);
        this.refreshUI();
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `已開啟全新冒險【${newGame.metadata.name}】！火堆已熄滅，房間很冷。`, 'story');
      }
    });
  }

  private updateTabsLayout(): void {
    let currentX = 320;
    let visibleTabs: TabItem[] = [];

    this.inlineTabs.forEach((tab) => {
      const isUnlocked = Boolean(this.gameState.unlockedTabs[tab.key]);
      if (isUnlocked) {
        tab.textObj.setVisible(true);
        visibleTabs.push(tab);
      } else {
        tab.textObj.setVisible(false);
        if (tab.sepObj) tab.sepObj.setVisible(false);
      }
    });

    visibleTabs.forEach((tab, index) => {
      tab.textObj.setX(currentX);
      currentX += tab.textObj.width + 10;

      if (index < visibleTabs.length - 1 && tab.sepObj) {
        tab.sepObj.setVisible(true);
        tab.sepObj.setX(currentX);
        currentX += tab.sepObj.width + 10;
      } else if (tab.sepObj) {
        tab.sepObj.setVisible(false);
      }
    });

    this.updateActiveTabHighlight();
  }

  private updateActiveTabHighlight(): void {
    const activeKey = this.gameState.activeTab;
    const activeItem = this.inlineTabs.find((t) => t.key === activeKey && t.textObj.visible);

    this.inlineTabs.forEach((t) => {
      if (t.key === activeKey) {
        t.textObj.setColor('#ffffff');
      } else {
        t.textObj.setColor('#94a3b8');
      }
    });

    if (activeItem) {
      this.activeUnderline.setVisible(true);
      this.activeUnderline.setPosition(activeItem.textObj.x, activeItem.textObj.y + activeItem.textObj.height + 2);
      this.activeUnderline.setSize(activeItem.textObj.width, 1);
    } else {
      this.activeUnderline.setVisible(false);
    }
  }

  public switchTab(tab: ActiveTab): void {
    this.gameState.activeTab = tab;

    this.roomView.setVisible(tab === 'room');
    this.outsideView.setVisible(tab === 'forest');
    this.villageView.setVisible(tab === 'village');
    this.craftView.setVisible(tab === 'craft');
    this.mapView.setVisible(tab === 'map');
    this.shipView.setVisible(tab === 'ship');
    this.spaceFlightView.setVisible(false);

    this.updateActiveTabHighlight();
    this.refreshUI();
  }

  public startSpaceFlight(): void {
    this.roomView.setVisible(false);
    this.outsideView.setVisible(false);
    this.villageView.setVisible(false);
    this.craftView.setVisible(false);
    this.mapView.setVisible(false);
    this.shipView.setVisible(false);
    this.spaceFlightView.setVisible(true);

    this.spaceFlightView.startFlight(this.gameState);
  }

  public refreshUI(): void {
    this.updateTabsLayout();

    // Update views
    if (this.roomView.visible) this.roomView.updateDisplay(this.gameState);
    if (this.outsideView.visible) this.outsideView.updateDisplay(this.gameState);
    if (this.villageView.visible) this.villageView.updateDisplay(this.gameState);
    if (this.craftView.visible) this.craftView.updateDisplay(this.gameState);
    if (this.mapView.visible) this.mapView.updateDisplay(this.gameState);
    if (this.shipView.visible) this.shipView.updateDisplay(this.gameState);

    // Update resource sidebar
    this.resourcePanel.updateDisplay(this.gameState);
  }

  update(_time: number, delta: number): void {
    // Forward update to active views for animations/cooldowns
    if (this.roomView.visible) this.roomView.update(delta);
    if (this.outsideView.visible) this.outsideView.update(delta);
    if (this.mapView.visible) this.mapView.update(delta);
    if (this.spaceFlightView.visible) this.spaceFlightView.update(delta);
  }
}
