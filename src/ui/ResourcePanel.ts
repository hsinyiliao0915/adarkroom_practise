import Phaser from 'phaser';
import { GameData, Resources, Workers } from '../core/GameState';
import { VillageSystem } from '../systems/VillageSystem';
import { WORKER_JOBS } from '../data/recipes';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';
import { EventBus, Events } from '../core/EventBus';

interface ResourceItemDisplay {
  key: keyof Resources;
  name: string;
  nameText: Phaser.GameObjects.Text;
  valText: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Rectangle;
}

interface BuildingItemDisplay {
  id: string;
  name: string;
  nameText: Phaser.GameObjects.Text;
  valText: Phaser.GameObjects.Text;
}

export class ResourcePanel extends Phaser.GameObjects.Container {
  private panelWidth: number;
  private discoveredKeys: Set<keyof Resources> = new Set();
  private lastState?: GameData;

  // Top Box: Village / Forest
  private villageContainer: Phaser.GameObjects.Container;
  private villageOutline: Phaser.GameObjects.Rectangle;
  private villageTitleLeft: Phaser.GameObjects.Text;
  private villageTitleRight: Phaser.GameObjects.Text;
  private buildingItems: BuildingItemDisplay[] = [];

  // Bottom Box: Stores (庫存)
  private storesContainer: Phaser.GameObjects.Container;
  private storesOutline: Phaser.GameObjects.Rectangle;
  private storesTitleText: Phaser.GameObjects.Text;
  private resourceItems: ResourceItemDisplay[] = [];

  // Rate Breakdown Tooltip
  private rateTooltipContainer: Phaser.GameObjects.Container;
  private rateTooltipBg: Phaser.GameObjects.Rectangle;
  private rateTooltipRows: Phaser.GameObjects.Text[] = [];

  private unsubTheme?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 220, _height: number = 660) {
    super(scene, x, y);
    this.panelWidth = width;

    const theme = ThemeManager.getInstance().getTheme();

    // ==========================================
    // 1. Village Container (Top Box)
    // ==========================================
    this.villageContainer = scene.add.container(0, 0);
    this.villageOutline = scene.add.rectangle(0, 10, width - 10, 40);
    this.villageOutline.setStrokeStyle(1, theme.storesOutlineHex, theme.storesOutlineAlpha);
    this.villageOutline.setFillStyle(theme.gameBgHex, 0);
    this.villageOutline.setOrigin(0);

    this.villageTitleLeft = scene.add.text(12, 2, ' 樹林 ', createTextStyle('12px', theme.textPrimary));
    this.villageTitleLeft.setBackgroundColor(theme.storesTitleBg);

    this.villageTitleRight = scene.add.text(width - 24, 2, '人口 0/0 ', createTextStyle('12px', theme.textPrimary));
    this.villageTitleRight.setOrigin(1, 0);
    this.villageTitleRight.setBackgroundColor(theme.storesTitleBg);

    this.villageContainer.add([this.villageOutline, this.villageTitleLeft, this.villageTitleRight]);

    const buildingDefs = [
      { id: 'baitedTraps', name: '上餌陷阱' },
      { id: 'traps', name: '陷阱' },
      { id: 'huts', name: '小屋' },
      { id: 'lodge', name: '狩獵小屋' },
      { id: 'cart', name: '貨車' },
      { id: 'tradingPost', name: '貿易站' },
      { id: 'tannery', name: '製革屋' },
      { id: 'smokehouse', name: '燻肉房' },
      { id: 'workshop', name: '工作坊' }
    ];

    buildingDefs.forEach((def) => {
      const nameText = scene.add.text(14, 0, def.name, createTextStyle('13px', theme.textPrimary));
      const valText = scene.add.text(width - 24, 0, '', createTextStyle('13px', theme.textPrimary));
      valText.setOrigin(1, 0);

      nameText.setVisible(false);
      valText.setVisible(false);

      this.buildingItems.push({
        id: def.id,
        name: def.name,
        nameText,
        valText
      });
      this.villageContainer.add([nameText, valText]);
    });

    this.villageContainer.setVisible(false);
    this.add(this.villageContainer);

    // ==========================================
    // 2. Stores Container (Bottom Box)
    // ==========================================
    this.storesContainer = scene.add.container(0, 0);
    this.storesOutline = scene.add.rectangle(0, 10, width - 10, 40);
    this.storesOutline.setStrokeStyle(1, theme.storesOutlineHex, theme.storesOutlineAlpha);
    this.storesOutline.setFillStyle(theme.gameBgHex, 0);
    this.storesOutline.setOrigin(0);

    this.storesTitleText = scene.add.text(12, 2, ' 庫存 ', createTextStyle('12px', theme.textPrimary));
    this.storesTitleText.setBackgroundColor(theme.storesTitleBg);

    this.storesContainer.add([this.storesOutline, this.storesTitleText]);

    const resourceDefs: Array<{ key: keyof Resources; name: string }> = [
      { key: 'cloth', name: '布料' },
      { key: 'wood', name: '木頭' },
      { key: 'fur', name: '毛皮' },
      { key: 'teeth', name: '牙齒' },
      { key: 'meat', name: '肉' },
      { key: 'bait', name: '誘餌' },
      { key: 'scales', name: '鱗片' },
      { key: 'leather', name: '皮革' },
      { key: 'curedMeat', name: '肉乾' },
      { key: 'iron', name: '精鐵' },
      { key: 'coal', name: '煤炭' },
      { key: 'steel', name: '鋼材' },
      { key: 'torches', name: '火把' },
      { key: 'bullets', name: '子彈' },
      { key: 'alienAlloy', name: '外星合金' }
    ];

    resourceDefs.forEach((def) => {
      const nameText = scene.add.text(14, 0, def.name, createTextStyle('13px', theme.textPrimary));
      const valText = scene.add.text(width - 24, 0, '', createTextStyle('13px', theme.textPrimary));
      valText.setOrigin(1, 0);

      const hitArea = scene.add.rectangle(0, 0, width - 10, 22, 0xffffff, 0);
      hitArea.setOrigin(0, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => {
        this.showRateTooltip(def.key, hitArea.y + this.storesContainer.y);
      });
      hitArea.on('pointerout', () => {
        this.hideRateTooltip();
      });

      nameText.setVisible(false);
      valText.setVisible(false);
      hitArea.setVisible(false);

      this.resourceItems.push({
        key: def.key,
        name: def.name,
        nameText,
        valText,
        hitArea
      });
      this.storesContainer.add([hitArea, nameText, valText]);
    });

    this.add(this.storesContainer);

    // Rate breakdown tooltip box
    this.rateTooltipContainer = scene.add.container(0, 0);
    this.rateTooltipBg = scene.add.rectangle(0, 0, 160, 50, 0x000000, 0.95);
    this.rateTooltipBg.setStrokeStyle(1, 0x555555, 0.9);
    this.rateTooltipBg.setOrigin(0, 0);
    this.rateTooltipContainer.add(this.rateTooltipBg);
    this.rateTooltipContainer.setVisible(false);
    this.rateTooltipContainer.setDepth(200);
    this.add(this.rateTooltipContainer);

    this.unsubTheme = EventBus.getInstance().on(Events.THEME_CHANGED, () => {
      this.applyTheme();
    });

    this.on('destroy', () => {
      if (this.unsubTheme) this.unsubTheme();
    });

    scene.add.existing(this);
  }

  public applyTheme(): void {
    const theme = ThemeManager.getInstance().getTheme();
    this.villageOutline.setStrokeStyle(1, theme.storesOutlineHex, theme.storesOutlineAlpha);
    this.villageTitleLeft.setColor(theme.textPrimary);
    this.villageTitleLeft.setBackgroundColor(theme.storesTitleBg);
    this.villageTitleRight.setColor(theme.textPrimary);
    this.villageTitleRight.setBackgroundColor(theme.storesTitleBg);

    this.buildingItems.forEach((b) => {
      b.nameText.setColor(theme.textPrimary);
      b.valText.setColor(theme.textPrimary);
    });

    this.storesOutline.setStrokeStyle(1, theme.storesOutlineHex, theme.storesOutlineAlpha);
    this.storesTitleText.setColor(theme.textPrimary);
    this.storesTitleText.setBackgroundColor(theme.storesTitleBg);

    this.resourceItems.forEach((item) => {
      item.nameText.setColor(theme.textPrimary);
      item.valText.setColor(theme.textPrimary);
    });
  }

  public resetDiscovered(state?: GameData): void {
    this.discoveredKeys.clear();
    if (state && state.resources) {
      for (const [k, v] of Object.entries(state.resources)) {
        if (typeof v === 'number' && v > 0) {
          this.discoveredKeys.add(k as keyof Resources);
        }
      }
    }
  }

  public resize(width: number): void {
    this.panelWidth = width;
    this.villageOutline.setSize(width - 10, this.villageOutline.height);
    this.villageTitleRight.setX(width - 24);
    this.storesOutline.setSize(width - 10, this.storesOutline.height);

    this.buildingItems.forEach((b) => {
      b.valText.setX(width - 24);
    });

    this.resourceItems.forEach((item) => {
      item.valText.setX(width - 24);
      item.hitArea.setSize(width - 10, 22);
    });

    if (this.lastState) {
      this.updateDisplay(this.lastState);
    }
  }

  public updateDisplay(state: GameData, activeTab?: string): void {
    this.lastState = state;
    const currentTab = activeTab || state.activeTab;

    // ==========================================
    // 1. Village / Forest Box
    // ==========================================
    const isRoomTab = currentTab === 'room';
    const hasHuts = (state.buildings.huts || 0) > 0;
    const maxPop = VillageSystem.getInstance().getMaxPopulation(state);
    const hasAnyBuilding =
      (state.buildings.traps || 0) > 0 ||
      (state.resources.cart || 0) > 0 ||
      hasHuts;

    const showVillageBox = !isRoomTab && state.unlockedForest && hasAnyBuilding;
    this.villageContainer.setVisible(showVillageBox);

    let villageBoxHeight = 0;

    if (showVillageBox) {
      if (hasHuts) {
        this.villageTitleLeft.setText(' 村落 ');
        this.villageTitleRight.setText(`人口 ${state.population}/${maxPop} `);
      } else {
        this.villageTitleLeft.setText(' 樹林 ');
        this.villageTitleRight.setText('人口 0/0 ');
      }

      // Calculate traps and baited traps
      const totalTraps = state.buildings.traps || 0;
      const numBait = (state.resources.bait || 0) + (state.trapBaitMeat || 0);
      const baitedTraps = Math.min(totalTraps, numBait);
      const unbaitedTraps = Math.max(0, totalTraps - baitedTraps);

      const buildingCounts: Record<string, number> = {
        baitedTraps,
        traps: unbaitedTraps,
        huts: state.buildings.huts || 0,
        lodge: state.buildings.lodge || 0,
        cart: state.resources.cart || 0,
        tradingPost: state.buildings.tradingPost || 0,
        tannery: state.buildings.tannery || 0,
        smokehouse: state.buildings.smokehouse || 0,
        workshop: state.buildings.workshop || 0
      };

      let visibleBuildingIdx = 0;
      this.buildingItems.forEach((b) => {
        const count = buildingCounts[b.id] || 0;
        if (count > 0) {
          b.nameText.setVisible(true);
          b.valText.setVisible(true);

          const yPos = 20 + visibleBuildingIdx * 22;
          b.nameText.setY(yPos);
          b.valText.setY(yPos);
          b.valText.setText(String(count));

          visibleBuildingIdx++;
        } else {
          b.nameText.setVisible(false);
          b.valText.setVisible(false);
        }
      });

      villageBoxHeight = 20 + visibleBuildingIdx * 22 + 10;
      this.villageOutline.setSize(this.panelWidth - 10, villageBoxHeight);
    }

    // ==========================================
    // 2. Stores Box (庫存)
    // ==========================================
    // Position stores box directly below village box or at top if village hidden
    const storesY = showVillageBox ? villageBoxHeight + 16 : 0;
    this.storesContainer.setY(storesY);

    // If forest not unlocked and no discovered resources, hide entire panel
    if (!state.unlockedForest && this.discoveredKeys.size === 0) {
      let anyRes = false;
      for (const v of Object.values(state.resources)) {
        if (typeof v === 'number' && v > 0) {
          anyRes = true;
          break;
        }
      }
      if (!anyRes) {
        this.setVisible(false);
        return;
      }
    }

    this.setVisible(true);

    let visibleResIdx = 0;
    this.resourceItems.forEach((item) => {
      const amount = state.resources[item.key] || 0;
      if (amount > 0 || this.discoveredKeys.has(item.key)) {
        this.discoveredKeys.add(item.key);
        item.nameText.setVisible(true);
        item.valText.setVisible(true);

        const yPos = 20 + visibleResIdx * 22;
        item.nameText.setY(yPos);
        item.valText.setY(yPos);
        item.valText.setText(String(Math.floor(amount)));

        item.hitArea.setY(yPos);
        item.hitArea.setVisible(true);

        visibleResIdx++;
      } else {
        item.nameText.setVisible(false);
        item.valText.setVisible(false);
        item.hitArea.setVisible(false);
      }
    });

    if (visibleResIdx > 0) {
      this.storesContainer.setVisible(true);
      const storesBoxHeight = 20 + visibleResIdx * 22 + 10;
      this.storesOutline.setSize(this.panelWidth - 10, storesBoxHeight);
    } else {
      this.storesContainer.setVisible(false);
    }
  }

  private showRateTooltip(key: keyof Resources, yPos: number): void {
    this.hideRateTooltip();
    if (!this.lastState) return;

    const state = this.lastState;
    const entries: Array<{ name: string; rate: number }> = [];

    // 1. Check Builder (when helping/awake, produces 2 wood / 10s)
    if (key === 'wood' && (state.strangerState === 'awake' || state.strangerState === 'helping')) {
      entries.push({ name: '建造者', rate: 2 });
    }

    // 2. Check Workers
    WORKER_JOBS.forEach((job) => {
      let count = 0;
      if (job.id === 'gatherers') {
        count = VillageSystem.getInstance().getNumGatherers(state);
      } else {
        count = state.workers[job.id as keyof Workers] || 0;
      }
      if (count <= 0) return;

      let netRatePerWorker = 0;
      if (job.production[key] !== undefined) {
        netRatePerWorker += job.production[key]!;
      }
      if (job.consumption[key] !== undefined) {
        netRatePerWorker -= job.consumption[key]!;
      }

      if (netRatePerWorker !== 0) {
        let cleanName = job.name.split(' ')[0];
        if (cleanName === '燻肉工') cleanName = '燻肉師';
        const totalJobRate = netRatePerWorker * count;
        entries.push({ name: cleanName, rate: totalJobRate });
      }
    });

    if (entries.length === 0) return;

    const totalRate = entries.reduce((acc, curr) => acc + curr.rate, 0);

    const rowHeight = 20;
    const padding = 8;
    const boxW = 165;
    const boxH = (entries.length + 1) * rowHeight + padding * 2;

    this.rateTooltipBg.setSize(boxW, boxH);

    entries.forEach((item, idx) => {
      const rowY = padding + idx * rowHeight;
      const rateStr = (item.rate > 0 ? `+${item.rate}` : `${item.rate}`) + ' / 10秒';

      const nameTxt = this.scene.add.text(10, rowY, item.name, createTextStyle('12px', '#ffffff'));
      const valTxt = this.scene.add.text(boxW - 10, rowY, rateStr, createTextStyle('12px', '#ffffff'));
      valTxt.setOrigin(1, 0);

      this.rateTooltipContainer.add([nameTxt, valTxt]);
      this.rateTooltipRows.push(nameTxt, valTxt);
    });

    // Total row at bottom
    const totalY = padding + entries.length * rowHeight;
    const totalStr = (totalRate > 0 ? `+${totalRate}` : `${totalRate}`) + ' / 10秒';
    const totalNameTxt = this.scene.add.text(10, totalY, '總計', createTextStyle('12px', '#ffffff', true));
    const totalValTxt = this.scene.add.text(boxW - 10, totalY, totalStr, createTextStyle('12px', '#ffffff', true));
    totalValTxt.setOrigin(1, 0);

    this.rateTooltipContainer.add([totalNameTxt, totalValTxt]);
    this.rateTooltipRows.push(totalNameTxt, totalValTxt);

    // Position tooltip directly below/overlapping bottom-left of row (matching user screenshot media_1789049872206.png)
    const targetY = yPos + 22;
    this.rateTooltipContainer.setPosition(-15, targetY);
    this.rateTooltipContainer.setVisible(true);
  }

  private hideRateTooltip(): void {
    this.rateTooltipRows.forEach((r) => r.destroy());
    this.rateTooltipRows = [];
    this.rateTooltipContainer.setVisible(false);
  }
}

