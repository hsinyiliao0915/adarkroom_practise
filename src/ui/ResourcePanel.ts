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
  private bgRect: Phaser.GameObjects.Rectangle;
  private borderRect: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private items: ResourceItemDisplay[] = [];
  private discoveredKeys: Set<keyof Resources> = new Set();

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 210, height: number = 660) {
    super(scene, x, y);

    // Background
    this.bgRect = scene.add.rectangle(0, 0, width, height, 0x12141a, 0.95);
    this.bgRect.setOrigin(0);

    // Border
    this.borderRect = scene.add.rectangle(0, 0, width, height);
    this.borderRect.setStrokeStyle(1, 0x272c38);
    this.borderRect.setFillStyle(0x000000, 0);
    this.borderRect.setOrigin(0);

    // Title
    this.titleText = scene.add.text(
      14,
      14,
      '【 庫存物資 】',
      createTextStyle('13px', '#94a3b8')
    );

    const divider = scene.add.rectangle(14, 38, width - 28, 1, 0x272c38);
    divider.setOrigin(0);

    this.add([this.bgRect, this.borderRect, this.titleText, divider]);

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

    resourceDefs.forEach((def, index) => {
      const textObj = scene.add.text(
        14,
        48 + index * 24,
        '',
        createTextStyle('12px', '#cbd5e1')
      );
      this.items.push({
        key: def.key,
        name: def.name,
        unitText: textObj
      });
      this.add(textObj);
    });

    scene.add.existing(this);
  }

  public updateDisplay(state: GameData): void {
    const netRates = ResourceSystem.getInstance().getNetRates(state);

    let visibleIndex = 0;
    this.items.forEach((item) => {
      const amount = state.resources[item.key] || 0;

      // Unlocked if > 0 or previously discovered
      if (amount > 0 || this.discoveredKeys.has(item.key) || item.key === 'wood') {
        this.discoveredKeys.add(item.key);
        item.unitText.setVisible(true);
        item.unitText.setY(48 + visibleIndex * 24);

        const rate = netRates[item.key] || 0;
        let rateStr = '';
        if (Math.abs(rate) >= 0.05) {
          const sign = rate > 0 ? '+' : '';
          rateStr = ` (${sign}${rate.toFixed(1)}/s)`;
        }

        item.unitText.setText(`${item.name}：${Math.floor(amount)}${rateStr}`);
        visibleIndex++;
      } else {
        item.unitText.setVisible(false);
      }
    });
  }
}
