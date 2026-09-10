import Phaser from 'phaser';
import { GameData, Resources } from '../core/GameState';
import { VillageSystem } from '../systems/VillageSystem';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';
import { EventBus, Events } from '../core/EventBus';

interface ResourceItemDisplay {
  key: keyof Resources;
  name: string;
  nameText: Phaser.GameObjects.Text;
  valText: Phaser.GameObjects.Text;
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

      nameText.setVisible(false);
      valText.setVisible(false);

      this.resourceItems.push({
        key: def.key,
        name: def.name,
        nameText,
        valText
      });
      this.storesContainer.add([nameText, valText]);
    });

    this.add(this.storesContainer);

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

  public updateDisplay(state: GameData, activeTab?: string): void {
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

        visibleResIdx++;
      } else {
        item.nameText.setVisible(false);
        item.valText.setVisible(false);
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
}

