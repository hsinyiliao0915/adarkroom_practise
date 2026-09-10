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
import { EventModal } from '../ui/EventModal';
import { RoomSystem } from '../systems/RoomSystem';
import { DevAutoSystem } from '../systems/DevAutoSystem';
import { StoryEventSystem } from '../systems/StoryEventSystem';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';

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
  private eventModal!: EventModal;

  private inlineTabs: TabItem[] = [];
  private activeUnderline!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private themeToggleLink!: Phaser.GameObjects.Text;
  private autoModeLink!: Phaser.GameObjects.Text;
  private saveLink!: Phaser.GameObjects.Text;
  private newGameLink!: Phaser.GameObjects.Text;
  private utilitySep1!: Phaser.GameObjects.Text;
  private utilitySep2!: Phaser.GameObjects.Text;
  private utilitySep3!: Phaser.GameObjects.Text;
  private unsubTheme?: () => void;
  private unsubAutoMode?: () => void;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    // 1. Load saved state or default
    this.gameState = SaveManager.getInstance().load();

    const theme = ThemeManager.getInstance().getTheme();
    this.cameras.main.setBackgroundColor(theme.gameBgCss);
    ThemeManager.getInstance().applyDomTheme();

    // 2. Setup Top Title & Inline Tabs & Utilities
    this.createHeaderAndTabs();
    this.createUtilityLinks();

    // 3. Create Panels
    // Left: Event Log Panel
    this.logPanel = new LogPanel(this, 18, 55, 300, 645);
    this.logPanel.initFromState(this.gameState);

    // Center Views Container
    const centerViewX = 338;
    const centerViewY = 55;
    const centerViewW = 450;

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
        RoomSystem.getInstance().resetTimers();
        StoryEventSystem.getInstance().reset();
        this.resourcePanel.resetDiscovered(this.gameState);
        this.switchTab('room');
        this.logPanel.initFromState(this.gameState);
        this.refreshUI();
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `已開啟全新冒險【${newGame.metadata.name}】！房間寒冷刺骨，火堆熄滅了。`, 'story');
      }
    );

    // Right: Resource Inventory Panel
    this.resourcePanel = new ResourcePanel(this, 810, 55, 220, 645);
    this.resourcePanel.resetDiscovered(this.gameState);
    RoomSystem.getInstance().resetTimers();

    // 4. Create Modals
    this.saveLoadModal = new SaveLoadModal(this);
    this.eventModal = new EventModal(this);

    // 5. Switch to current tab
    this.switchTab(this.gameState.activeTab);

    // 6. Subscribe to EventBus
    EventBus.getInstance().on(Events.STATE_CHANGED, () => {
      this.refreshUI();
    });

    EventBus.getInstance().on(Events.TAB_UNLOCKED, () => {
      this.updateTabsLayout();
    });

    this.unsubTheme = EventBus.getInstance().on(Events.THEME_CHANGED, () => {
      this.applyTheme();
    });

    this.unsubAutoMode = EventBus.getInstance().on(Events.AUTO_MODE_CHANGED, (enabled: boolean) => {
      if (this.autoModeLink) {
        this.autoModeLink.setText(enabled ? '[ 自動: 開 ]' : '[ 自動: 關 ]');
        this.layoutUtilityLinks();
      }
    });

    this.events.on('destroy', () => {
      if (this.unsubTheme) this.unsubTheme();
      if (this.unsubAutoMode) this.unsubAutoMode();
      if (this.eventModal) this.eventModal.destroy();
    });

    // 7. Start Tick Engine & AutoSave
    TickEngine.getInstance().start(() => this.gameState, 500);
    SaveManager.getInstance().startAutoSave(() => this.gameState, 10000);

    // Initial render
    this.refreshUI();
  }

  private createHeaderAndTabs(): void {
    const theme = ThemeManager.getInstance().getTheme();

    // Title
    this.titleText = this.add.text(
      20,
      18,
      '小 屋 (A Dark Room)',
      createTextStyle('14px', theme.textPrimary)
    );

    // Active Tab Underline (1px line under current tab)
    this.activeUnderline = this.add.rectangle(320, 36, 40, 1, theme.underlineHex, 0.9);
    this.activeUnderline.setOrigin(0, 0);

    const tabDefs: Array<{ key: ActiveTab; label: string }> = [
      { key: 'room', label: '生火間' },
      { key: 'forest', label: '靜謐森林' },
      { key: 'craft', label: '工作坊' },
      { key: 'map', label: '荒野探索' },
      { key: 'ship', label: '星艦' }
    ];

    tabDefs.forEach((def) => {
      const textObj = this.add.text(0, 18, def.label, createTextStyle('14px', theme.textSecondary));
      textObj.setInteractive({ useHandCursor: true });
      textObj.on('pointerover', () => {
        if (this.gameState.activeTab !== def.key) {
          textObj.setColor(ThemeManager.getInstance().getTheme().textPrimary);
        }
      });
      textObj.on('pointerout', () => {
        if (this.gameState.activeTab !== def.key) {
          textObj.setColor(ThemeManager.getInstance().getTheme().textSecondary);
        }
      });
      textObj.on('pointerdown', () => {
        this.switchTab(def.key);
      });

      const sepObj = this.add.text(0, 18, '|', createTextStyle('14px', theme.tabSepColor));
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
    const theme = ThemeManager.getInstance().getTheme();

    // 1. Theme Toggle Link ([ 開燈 ] in dark mode, [ 熄燈 ] in light mode)
    const toggleText = theme.mode === 'dark' ? '[ 開燈 ]' : '[ 熄燈 ]';
    this.themeToggleLink = this.add.text(0, 19, toggleText, createTextStyle('12px', theme.navText));
    this.themeToggleLink.setInteractive({ useHandCursor: true });
    this.themeToggleLink.on('pointerover', () => this.themeToggleLink.setColor(ThemeManager.getInstance().getTheme().navTextHover));
    this.themeToggleLink.on('pointerout', () => this.themeToggleLink.setColor(ThemeManager.getInstance().getTheme().navText));
    this.themeToggleLink.on('pointerdown', () => {
      ThemeManager.getInstance().toggleTheme();
    });

    this.utilitySep1 = this.add.text(0, 19, '|', createTextStyle('12px', theme.navSepColor));

    // 2. Auto / Dev Mode Link ([ 自動: 關 ] / [ 自動: 開 ])
    const autoText = DevAutoSystem.getInstance().isEnabled() ? '[ 自動: 開 ]' : '[ 自動: 關 ]';
    this.autoModeLink = this.add.text(0, 19, autoText, createTextStyle('12px', theme.navText));
    this.autoModeLink.setInteractive({ useHandCursor: true });
    this.autoModeLink.on('pointerover', () => this.autoModeLink.setColor(ThemeManager.getInstance().getTheme().navTextHover));
    this.autoModeLink.on('pointerout', () => this.autoModeLink.setColor(ThemeManager.getInstance().getTheme().navText));
    this.autoModeLink.on('pointerdown', () => {
      const isNowOn = DevAutoSystem.getInstance().toggle();
      this.autoModeLink.setText(isNowOn ? '[ 自動: 開 ]' : '[ 自動: 關 ]');
      this.layoutUtilityLinks();
    });

    this.utilitySep2 = this.add.text(0, 19, '|', createTextStyle('12px', theme.navSepColor));

    // 3. Save Management Link ([ 存檔管理 ])
    this.saveLink = this.add.text(0, 19, '[ 存檔管理 ]', createTextStyle('12px', theme.navText));
    this.saveLink.setInteractive({ useHandCursor: true });
    this.saveLink.on('pointerover', () => this.saveLink.setColor(ThemeManager.getInstance().getTheme().navTextHover));
    this.saveLink.on('pointerout', () => this.saveLink.setColor(ThemeManager.getInstance().getTheme().navText));
    this.saveLink.on('pointerdown', () => this.saveLoadModal.show(this));

    this.utilitySep3 = this.add.text(0, 19, '|', createTextStyle('12px', theme.navSepColor));

    // 4. New Game Link ([ 新遊戲 ])
    this.newGameLink = this.add.text(0, 19, '[ 新遊戲 ]', createTextStyle('12px', theme.navText));
    this.newGameLink.setInteractive({ useHandCursor: true });
    this.newGameLink.on('pointerover', () => this.newGameLink.setColor(ThemeManager.getInstance().getTheme().navTextHover));
    this.newGameLink.on('pointerout', () => this.newGameLink.setColor(ThemeManager.getInstance().getTheme().navText));
    this.newGameLink.on('pointerdown', () => {
      if (window.confirm('確定要開啟新遊戲嗎？現有歷史存檔將完整保留，系統將為你建立全新開局。')) {
        const newGame = SaveManager.getInstance().startNewGame();
        this.gameState = newGame.state;
        RoomSystem.getInstance().resetTimers();
        StoryEventSystem.getInstance().reset();
        this.resourcePanel.resetDiscovered(this.gameState);
        this.switchTab('room');
        this.logPanel.initFromState(this.gameState);
        this.refreshUI();
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `已開啟全新冒險【${newGame.metadata.name}】！房間寒冷刺骨，火堆熄滅了。`, 'story');
      }
    });

    this.layoutUtilityLinks();
  }

  private layoutUtilityLinks(): void {
    const rightEdge = 1032;
    const gap = 8;

    this.newGameLink.setPosition(rightEdge - this.newGameLink.width, 19);
    this.utilitySep3.setPosition(this.newGameLink.x - gap - this.utilitySep3.width, 19);

    this.saveLink.setPosition(this.utilitySep3.x - gap - this.saveLink.width, 19);
    this.utilitySep2.setPosition(this.saveLink.x - gap - this.utilitySep2.width, 19);

    this.autoModeLink.setPosition(this.utilitySep2.x - gap - this.autoModeLink.width, 19);
    this.utilitySep1.setPosition(this.autoModeLink.x - gap - this.utilitySep1.width, 19);

    this.themeToggleLink.setPosition(this.utilitySep1.x - gap - this.themeToggleLink.width, 19);
  }

  private applyTheme(): void {
    const theme = ThemeManager.getInstance().getTheme();
    this.cameras.main.setBackgroundColor(theme.gameBgCss);
    this.titleText.setColor(theme.textPrimary);

    this.themeToggleLink.setText(theme.mode === 'dark' ? '[ 開燈 ]' : '[ 熄燈 ]');
    this.themeToggleLink.setColor(theme.navText);
    this.utilitySep1.setColor(theme.navSepColor);

    this.autoModeLink.setColor(theme.navText);
    this.utilitySep2.setColor(theme.navSepColor);

    this.saveLink.setColor(theme.navText);
    this.utilitySep3.setColor(theme.navSepColor);

    this.newGameLink.setColor(theme.navText);

    this.layoutUtilityLinks();

    this.inlineTabs.forEach((t) => {
      if (t.sepObj) t.sepObj.setColor(theme.tabSepColor);
    });
    this.activeUnderline.setFillStyle(theme.underlineHex);

    this.refreshUI();
  }

  private getOutsideTabTitle(): string {
    const huts = this.gameState.buildings.huts || 0;
    if (huts === 0) return '靜謐森林';
    if (huts === 1) return '孤獨小屋';
    if (huts <= 4) return '小型村落';
    if (huts <= 8) return '中型村落';
    if (huts <= 14) return '大型村落';
    return '繁榮村莊';
  }

  private updateTabsLayout(): void {
    let currentX = 320;
    let visibleTabs: TabItem[] = [];

    this.inlineTabs.forEach((tab) => {
      if (tab.key === 'forest') {
        const title = this.getOutsideTabTitle();
        tab.label = title;
        tab.textObj.setText(title);
      }

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
    const theme = ThemeManager.getInstance().getTheme();
    const activeKey = this.gameState.activeTab;
    const activeItem = this.inlineTabs.find((t) => t.key === activeKey && t.textObj.visible);

    this.inlineTabs.forEach((t) => {
      if (t.key === activeKey) {
        t.textObj.setColor(theme.textPrimary);
      } else {
        t.textObj.setColor(theme.textSecondary);
      }
    });

    if (activeItem) {
      this.activeUnderline.setVisible(true);
      this.activeUnderline.setPosition(activeItem.textObj.x, activeItem.textObj.y + activeItem.textObj.height + 2);
      this.activeUnderline.setSize(activeItem.textObj.width, 1);
      this.activeUnderline.setFillStyle(theme.underlineHex);
    } else {
      this.activeUnderline.setVisible(false);
    }
  }

  public switchTab(tab: ActiveTab): void {
    if (tab === 'village') tab = 'forest';
    this.gameState.activeTab = tab;

    if (tab === 'forest' && !this.gameState.hasVisitedForest) {
      this.gameState.hasVisitedForest = true;
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '天色陰沉，風無情地刮著。', 'story');
    }

    this.roomView.setVisible(tab === 'room');
    this.outsideView.setVisible(tab === 'forest');
    this.villageView.setVisible(false);
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
    if (this.craftView.visible) this.craftView.updateDisplay(this.gameState);
    if (this.mapView.visible) this.mapView.updateDisplay(this.gameState);
    if (this.shipView.visible) this.shipView.updateDisplay(this.gameState);

    // Update resource sidebar
    this.resourcePanel.updateDisplay(this.gameState, this.gameState.activeTab);
  }

  update(_time: number, delta: number): void {
    // 1. Dev auto mode update
    DevAutoSystem.getInstance().update(delta, this.gameState);

    // 2. Forward update to active views for animations/cooldowns
    if (this.roomView) this.roomView.update(delta);
    if (this.outsideView) this.outsideView.update(delta);
    if (this.mapView && this.mapView.visible) this.mapView.update(delta);
    if (this.spaceFlightView && this.spaceFlightView.visible) this.spaceFlightView.update(delta);
  }
}
