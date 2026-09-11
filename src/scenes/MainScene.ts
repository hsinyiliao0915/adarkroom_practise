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
import { SpeedModal } from '../ui/SpeedModal';
import { RoomSystem } from '../systems/RoomSystem';
import { DevAutoSystem } from '../systems/DevAutoSystem';
import { StoryEventSystem } from '../systems/StoryEventSystem';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';
import {
  GAME_LANDSCAPE_WIDTH,
  GAME_LANDSCAPE_HEIGHT,
  GAME_PORTRAIT_WIDTH,
  GAME_PORTRAIT_HEIGHT
} from '../config/gameConfig';

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
  private speedModal!: SpeedModal;

  private inlineTabs: TabItem[] = [];
  private activeUnderline!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private unsubTheme?: () => void;
  private unsubExternalEvents?: Array<() => void>;

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    // 1. Load saved state or default
    this.gameState = SaveManager.getInstance().load();

    const theme = ThemeManager.getInstance().getTheme();
    this.cameras.main.setBackgroundColor(theme.gameBgCss);
    ThemeManager.getInstance().applyDomTheme();

    // 2. Setup Top Title & Inline Tabs
    this.createHeaderAndTabs();

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
    this.speedModal = new SpeedModal(this);

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

    const eb = EventBus.getInstance();
    const unsubSave = eb.on(Events.OPEN_SAVE_MODAL, () => {
      this.saveLoadModal.show(this);
    });

    const unsubSpeed = eb.on(Events.OPEN_SPEED_MODAL, () => {
      this.speedModal.show(() => {
        const current = TickEngine.getInstance().getSpeedMultiplier();
        const next = current > 1 ? 1 : 2;
        TickEngine.getInstance().setSpeedMultiplier(next);
        EventBus.getInstance().emit(
          Events.LOG_MESSAGE,
          next > 1 ? '加速模式已開啟（2倍速）。' : '加速模式已關閉（正常速度）。',
          'info'
        );
      });
    });

    const unsubNewGame = eb.on(Events.TRIGGER_NEW_GAME, () => {
      if (window.confirm('確定要開啟新遊戲嗎？現有歷史存檔將完整保留，系統將為你建立全新開局。')) {
        const newGame = SaveManager.getInstance().startNewGame();
        this.gameState = newGame.state;
        RoomSystem.getInstance().resetTimers();
        StoryEventSystem.getInstance().reset();
        this.resourcePanel.resetDiscovered(this.gameState);
        this.switchTab('room');
        this.logPanel.initFromState(this.gameState);
        this.refreshUI();
        EventBus.getInstance().emit(
          Events.LOG_MESSAGE,
          `已開啟全新冒險【${newGame.metadata.name}】！房間寒冷刺骨，火堆熄滅了。`,
          'story'
        );
      }
    });

    this.unsubExternalEvents = [unsubSave, unsubSpeed, unsubNewGame];

    this.events.on('destroy', () => {
      if (this.unsubTheme) this.unsubTheme();
      if (this.unsubExternalEvents) {
        this.unsubExternalEvents.forEach((u) => u());
      }
      if (this.eventModal) this.eventModal.destroy();
      if (this.speedModal) this.speedModal.destroy();
    });

    // 7. Start Tick Engine & AutoSave
    TickEngine.getInstance().start(() => this.gameState, 500);
    SaveManager.getInstance().startAutoSave(() => this.gameState, 10000);

    // 8. Dynamic Orientation & Window Resize Listener
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });

    if (typeof window !== 'undefined') {
      let lastWasPortrait = window.innerWidth < window.innerHeight || window.innerWidth <= 768;
      const onWinResize = () => {
        const portrait = window.innerWidth < window.innerHeight || window.innerWidth <= 768;
        const targetW = portrait ? GAME_PORTRAIT_WIDTH : GAME_LANDSCAPE_WIDTH;
        const targetH = portrait ? GAME_PORTRAIT_HEIGHT : GAME_LANDSCAPE_HEIGHT;
        if (portrait !== lastWasPortrait || this.scale.width !== targetW || this.scale.height !== targetH) {
          lastWasPortrait = portrait;
          this.scale.resize(targetW, targetH);
        } else {
          this.handleResize(this.scale.width, this.scale.height);
        }
      };
      window.addEventListener('resize', onWinResize);
      this.events.on('destroy', () => {
        window.removeEventListener('resize', onWinResize);
      });
    }

    // Initial layout and render
    this.handleResize(this.scale.width, this.scale.height);
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

  public isPortrait(): boolean {
    return (
      this.scale.width === GAME_PORTRAIT_WIDTH ||
      (typeof window !== 'undefined' && (window.innerWidth < window.innerHeight || window.innerWidth <= 768))
    );
  }

  public handleResize(width: number, height: number): void {
    const portrait = width === GAME_PORTRAIT_WIDTH || width < height;

    // 1. Header Title
    if (portrait) {
      this.titleText.setPosition(15, 14);
    } else {
      this.titleText.setPosition(20, 18);
    }

    // 2. Tabs
    this.updateTabsLayout();

    // 3. Center Views
    const viewX = portrait ? 15 : 338;
    const viewY = portrait ? 72 : 55;
    const views = [
      this.roomView,
      this.outsideView,
      this.villageView,
      this.craftView,
      this.mapView,
      this.shipView,
      this.spaceFlightView
    ];
    views.forEach((v) => {
      if (v) v.setPosition(viewX, viewY);
    });

    // 4. Resource Panel
    if (this.resourcePanel) {
      if (portrait) {
        this.resourcePanel.setPosition(15, 365);
        this.resourcePanel.resize(450);
      } else {
        this.resourcePanel.setPosition(810, 55);
        this.resourcePanel.resize(220);
      }
    }

    // 5. Log Panel
    if (this.logPanel) {
      if (portrait) {
        this.logPanel.setPosition(15, 575);
        this.logPanel.resize(450, 265);
      } else {
        this.logPanel.setPosition(18, 55);
        this.logPanel.resize(300, 645);
      }
    }

    // 6. Modals
    const cx = width / 2;
    const cy = height / 2;
    if (this.saveLoadModal) this.saveLoadModal.setPosition(cx, cy);
    if (this.eventModal) this.eventModal.setPosition(cx, cy);
    if (this.speedModal) this.speedModal.setPosition(cx, cy);

    this.refreshUI();
  }

  private applyTheme(): void {
    const theme = ThemeManager.getInstance().getTheme();
    this.cameras.main.setBackgroundColor(theme.gameBgCss);
    this.titleText.setColor(theme.textPrimary);

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
    const isPortrait = this.isPortrait();
    let currentX = isPortrait ? 15 : 320;
    const tabY = isPortrait ? 42 : 18;
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
      tab.textObj.setPosition(currentX, tabY);
      currentX += tab.textObj.width + 10;

      if (index < visibleTabs.length - 1 && tab.sepObj) {
        tab.sepObj.setVisible(true);
        tab.sepObj.setPosition(currentX, tabY);
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
    const speed = TickEngine.getInstance().getSpeedMultiplier();
    const scaledDelta = delta * speed;

    // 1. Dev auto mode update
    DevAutoSystem.getInstance().update(scaledDelta, this.gameState);

    // 2. Forward update to active views for animations/cooldowns
    if (this.roomView) this.roomView.update(scaledDelta);
    if (this.outsideView) this.outsideView.update(scaledDelta);
    if (this.mapView && this.mapView.visible) this.mapView.update(scaledDelta);
    if (this.spaceFlightView && this.spaceFlightView.visible) this.spaceFlightView.update(scaledDelta);
  }
}
