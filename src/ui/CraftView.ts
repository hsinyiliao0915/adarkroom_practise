import Phaser from 'phaser';
import { GameData, Resources } from '../core/GameState';
import { CRAFT_RECIPES } from '../data/recipes';
import { CraftSystem } from '../systems/CraftSystem';
import { TextButton } from './TextButton';
import { createTextStyle } from '../config/typography';

interface CraftRow {
  id: keyof Resources;
  nameText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  descText: Phaser.GameObjects.Text;
  craftBtn: TextButton;
}

export class CraftView extends Phaser.GameObjects.Container {
  private rows: CraftRow[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const titleText = scene.add.text(
      20,
      15,
      '── 工作坊：裝備與物資製造 ──',
      createTextStyle('14px', '#f59e0b')
    );
    this.add(titleText);

    const startY = 48;
    CRAFT_RECIPES.forEach((recipe, idx) => {
      const rowY = startY + idx * 46;

      const nameText = scene.add.text(
        20,
        rowY,
        `${recipe.name}`,
        createTextStyle('13px', '#f8fafc')
      );

      const costText = scene.add.text(
        400,
        rowY + 2,
        '',
        createTextStyle('11px', '#94a3b8', false, { align: 'right' })
      );
      costText.setOrigin(1, 0);

      const descText = scene.add.text(
        20,
        rowY + 18,
        `${recipe.description}`,
        createTextStyle('10px', '#64748b')
      );

      const craftBtn = new TextButton(scene, 440, rowY + 10, {
        text: '製作',
        width: 60,
        height: 24,
        fontSize: '11px',
        onClick: () => {
          const state = (scene as any).gameState as GameData;
          if (state) {
            CraftSystem.getInstance().craft(state, recipe.id);
          }
        }
      });

      this.rows.push({
        id: recipe.id,
        nameText,
        costText,
        descText,
        craftBtn
      });

      this.add([nameText, costText, descText, craftBtn]);
    });

    scene.add.existing(this);
  }

  public updateDisplay(state: GameData): void {
    this.rows.forEach((row) => {
      const recipe = CRAFT_RECIPES.find((r) => r.id === row.id);
      if (!recipe) return;

      const current = state.resources[row.id] || 0;
      const isMaxed = recipe.maxCount !== undefined && current >= recipe.maxCount;

      const costParts: string[] = [];
      let canAfford = true;

      for (const [resKey, amount] of Object.entries(recipe.cost)) {
        costParts.push(`${this.getResourceName(resKey as keyof Resources)} ${amount}`);
        if ((state.resources[resKey as keyof Resources] || 0) < amount) {
          canAfford = false;
        }
      }

      const countStr = recipe.maxCount ? `(${current}/${recipe.maxCount})` : `(${current})`;
      row.nameText.setText(`${recipe.name} ${countStr}`);

      if (isMaxed) {
        row.costText.setText('已擁有');
        row.costText.setColor('#64748b');
        row.craftBtn.setEnabled(false);
      } else {
        row.costText.setText(costParts.join(', '));
        row.costText.setColor(canAfford ? '#94a3b8' : '#e11d48');
        row.craftBtn.setEnabled(canAfford);
      }
    });
  }

  private getResourceName(key: keyof Resources): string {
    const map: Record<string, string> = {
      wood: '木',
      fur: '皮',
      meat: '肉',
      curedMeat: '肉乾',
      leather: '皮革',
      teeth: '牙',
      scales: '鱗',
      iron: '鐵',
      coal: '煤',
      steel: '鋼'
    };
    return map[key] || key;
  }
}
