import Phaser from 'phaser';
import { GameData, Resources } from '../core/GameState';
import { ResourceSystem } from '../systems/ResourceSystem';
import { createTextStyle } from '../config/typography';

interface ResourceItemDisplay {
  key: keyof Resources;
  name: string;
  unitText: Phaser.GameObjects.Text;
}

export class ResourcePanel extends Phaser.GameObjects.Container {
  private outlineRect: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private items: ResourceItemDisplay[] = [];
  private discoveredKeys: Set<keyof Resources> = new Set();
  private panelWidth: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 210, _height: number = 660) {
    super(scene, x, y);
    this.panelWidth = width;

    // Compact stores outline (1px line, auto-sizes to fit items)
    this.outlineRect = scene.add.rectangle(0, 10, width - 10, 40);
    this.outlineRect.setStrokeStyle(1, 0xffffff, 0.4);
    this.outlineRect.setFillStyle(0x000000, 0);
    this.outlineRect.setOrigin(0);

    // Title label overlapping the top border (like original fieldset)
    this.titleText = scene.add.text(
      12,
      2,
      ' 庫存 ',
      createTextStyle('12px', '#cbd5e1')
    );
    this.titleText.setBackgroundColor('#0d0e12');

    this.add([this.outlineRect, this.titleText]);

    const resourceDefs: Array<{ key: keyof Resources; name: string }> = [
      { key: 'wood', name: '木材' },
      { key: 'fur', name: '毛皮' },
      { key: 'meat', name: '生肉' },
      { key: 'curedMeat', name: '肉乾' },
      { key: 'leather', name: '皮革' },
      { key: 'teeth', name: '尖牙' },
      { key: 'scales', name: '鱗片' },
      { key: 'iron', name: '精鐵' },
      { key: 'coal', name: '煤炭' },
      { key: 'steel', name: '鋼材' },
      { key: 'torches', name: '火把' },
      { key: 'bullets', name: '子彈' },
      { key: 'alienAlloy', name: '外星合金' }
    ];

    resourceDefs.forEach((def) => {
      const textObj = scene.add.text(
        14,
        0,
        '',
        createTextStyle('12px', '#e2e8f0')
      );
      textObj.setVisible(false);
      this.items.push({
        key: def.key,
        name: def.name,
        unitText: textObj
      });
      this.add(textObj);
    });

    // Initially hidden until any resource is discovered
    this.setVisible(false);

    scene.add.existing(this);
  }

  public updateDisplay(state: GameData): void {
    const netRates = ResourceSystem.getInstance().getNetRates(state);

    let visibleIndex = 0;
    this.items.forEach((item) => {
      const amount = state.resources[item.key] || 0;

      // Unlocked strictly if amount > 0 or previously discovered
      if (amount > 0 || this.discoveredKeys.has(item.key)) {
        this.discoveredKeys.add(item.key);
        item.unitText.setVisible(true);
        item.unitText.setY(22 + visibleIndex * 24);

        const rate = netRates[item.key] || 0;
        let rateStr = '';
        if (Math.abs(rate) >= 0.05) {
          const sign = rate > 0 ? '+' : '';
          rateStr = ` (${sign}${rate.toFixed(1)}/s)`;
        }

        // Clean layout: name and count aligned
        const countStr = `${Math.floor(amount)}${rateStr}`;
        item.unitText.setText(`${item.name}    ${countStr}`);
        visibleIndex++;
      } else {
        item.unitText.setVisible(false);
      }
    });

    if (visibleIndex > 0) {
      this.setVisible(true);
      const boxHeight = 22 + visibleIndex * 24 + 10;
      this.outlineRect.setSize(this.panelWidth - 10, boxHeight);
    } else {
      this.setVisible(false);
    }
  }
}
