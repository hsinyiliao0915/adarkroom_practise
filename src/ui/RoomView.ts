import Phaser from 'phaser';
import { GameData } from '../core/GameState';
import { TextButton } from './TextButton';
import { RoomSystem } from '../systems/RoomSystem';
import { VillageSystem } from '../systems/VillageSystem';
import { CraftSystem } from '../systems/CraftSystem';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';
import { EventBus, Events } from '../core/EventBus';

export class RoomView extends Phaser.GameObjects.Container {
  private statusText: Phaser.GameObjects.Text;
  private warmthText: Phaser.GameObjects.Text;
  private strangerText: Phaser.GameObjects.Text;

  private lightFireBtn: TextButton;
  private stokeFireBtn: TextButton;

  // Builder Construction Section
  private buildingsTitle: Phaser.GameObjects.Text;
  private trapBtn: TextButton;
  private cartBtn: TextButton;
  private hutBtn: TextButton;
  private unsubStoke?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 490) {
    super(scene, x, y);

    // Status Texts
    this.statusText = scene.add.text(
      20,
      20,
      '火堆已熄滅。',
      createTextStyle('15px', '#cbd5e1')
    );

    this.warmthText = scene.add.text(
      20,
      48,
      '房間：刺骨寒冷',
      createTextStyle('14px', '#94a3b8')
    );

    this.strangerText = scene.add.text(
      20,
      76,
      '',
      createTextStyle('13px', '#e2e8f0', false, {
        wordWrap: { width: width - 40, useAdvancedWrap: true }
      })
    );

    // Action Buttons
    // 1. Light Fire (生火)
    this.lightFireBtn = new TextButton(scene, 90, 130, {
      text: '生火',
      width: 140,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          RoomSystem.getInstance().lightFire(state);
        }
      }
    });

    // 2. Stoke Fire (添柴)
    this.stokeFireBtn = new TextButton(scene, 90, 130, {
      text: '添柴',
      width: 140,
      height: 38,
      cooldownMs: 2500,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          RoomSystem.getInstance().stokeFire(state);
          EventBus.getInstance().emit(Events.ACTION_STOKE_FIRE);
        }
      }
    });

    // 3. Buildings Section
    this.buildingsTitle = scene.add.text(
      20,
      190,
      '建築物:',
      createTextStyle('13px', '#94a3b8')
    );

    this.trapBtn = new TextButton(scene, 100, 225, {
      text: '陷阱 (10 木材)',
      width: 180,
      height: 36,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          VillageSystem.getInstance().build(state, 'traps');
        }
      }
    });

    this.cartBtn = new TextButton(scene, 100, 270, {
      text: '貨車 (30 木材)',
      width: 180,
      height: 36,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          CraftSystem.getInstance().craft(state, 'cart');
        }
      }
    });

    this.hutBtn = new TextButton(scene, 100, 315, {
      text: '小屋 (100 木材)',
      width: 180,
      height: 36,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          VillageSystem.getInstance().build(state, 'huts');
        }
      }
    });

    this.add([
      this.statusText,
      this.warmthText,
      this.strangerText,
      this.lightFireBtn,
      this.stokeFireBtn,
      this.buildingsTitle,
      this.trapBtn,
      this.cartBtn,
      this.hutBtn
    ]);

    this.unsubStoke = EventBus.getInstance().on(Events.ACTION_STOKE_FIRE, () => {
      this.stokeFireBtn.triggerCooldown(2500);
    });

    this.on('destroy', () => {
      if (this.unsubStoke) this.unsubStoke();
    });

    scene.add.existing(this);
  }

  public updateDisplay(state: GameData): void {
    const fireMap = {
      dead: '火堆已熄滅。',
      smoldering: '火堆開始冒煙。',
      flickering: '火堆冒出火苗。',
      burning: '火堆燃燒著。',
      roaring: '火堆熊熊燃燒。'
    };

    const warmthMap = {
      freezing: '房間：寒冷刺骨',
      cold: '房間：很冷',
      mild: '房間：微溫',
      warm: '房間：暖和'
    };

    const theme = ThemeManager.getInstance().getTheme();
    this.statusText.setText(fireMap[state.fireState] || '');
    this.warmthText.setText(warmthMap[state.warmthLevel] || '');
    this.warmthText.setColor(theme.textSecondary);
    this.buildingsTitle.setColor(theme.textSecondary);

    if (state.fireState === 'dead') {
      this.statusText.setColor(theme.textMuted);
    } else {
      this.statusText.setColor(theme.textPrimary);
    }

    if (state.strangerState === 'none') {
      this.strangerText.setText('');
    } else if (state.strangerState === 'sleeping') {
      this.strangerText.setText('一名陌生人癱倒在角落裡，昏迷不醒。');
      this.strangerText.setColor(theme.textPrimary);
    } else if (state.strangerState === 'awake' || state.strangerState === 'helping') {
      this.strangerText.setText('陌生人站在火堆旁。她說她會建造東西。');
      this.strangerText.setColor(theme.textPrimary);
    }

    // Dynamic vertical layout: avoid any overlapping
    let currentY = 20;

    this.statusText.setY(currentY);
    currentY += this.statusText.height + 8;

    this.warmthText.setY(currentY);
    currentY += this.warmthText.height + 10;

    if (state.strangerState !== 'none' && this.strangerText.text.length > 0) {
      this.strangerText.setY(currentY);
      this.strangerText.setVisible(true);
      currentY += this.strangerText.height + 20;
    } else {
      this.strangerText.setVisible(false);
      currentY += 10;
    }

    // Fire button (button center Y is currentY + 19)
    const fireBtnY = currentY + 19;
    this.lightFireBtn.setY(fireBtnY);
    this.stokeFireBtn.setY(fireBtnY);
    currentY += 38 + 24;

    // Fire button logic
    if (state.fireState === 'dead') {
      this.lightFireBtn.setVisible(true);
      this.lightFireBtn.setEnabled(true);
      this.stokeFireBtn.setVisible(false);
    } else {
      this.lightFireBtn.setVisible(false);
      this.stokeFireBtn.setVisible(true);
      this.stokeFireBtn.setText(state.unlockedForest ? '添柴 (1 木材)' : '添柴');
      this.stokeFireBtn.setEnabled(!state.unlockedForest || state.resources.wood >= 1);
    }

    // Builder buildings logic
    const hasBuilder = state.strangerState === 'awake' || state.strangerState === 'helping';
    this.buildingsTitle.setVisible(hasBuilder);
    this.trapBtn.setVisible(hasBuilder);
    this.cartBtn.setVisible(hasBuilder);
    this.hutBtn.setVisible(hasBuilder);

    if (hasBuilder) {
      this.buildingsTitle.setY(currentY);
      currentY += this.buildingsTitle.height + 16;

      this.trapBtn.setY(currentY + 18);
      currentY += 36 + 10;

      this.cartBtn.setY(currentY + 18);
      currentY += 36 + 10;

      this.hutBtn.setY(currentY + 18);
      currentY += 36 + 10;

      // Traps
      const trapCount = state.buildings.traps || 0;
      if (trapCount >= 10) {
        this.trapBtn.setText('陷阱 (已達上限 10)');
        this.trapBtn.setEnabled(false);
      } else {
        const trapCost = 10 + trapCount * 10;
        this.trapBtn.setText(`陷阱 (${trapCost} 木材) [${trapCount}/10]`);
        this.trapBtn.setEnabled(state.resources.wood >= trapCost);
      }

      // Cart
      const cartCount = state.resources.cart || 0;
      if (cartCount >= 1) {
        this.cartBtn.setText('貨車 (已建造)');
        this.cartBtn.setEnabled(false);
      } else {
        const cartCost = 30;
        this.cartBtn.setText(`貨車 (${cartCost} 木材)`);
        this.cartBtn.setEnabled(state.resources.wood >= cartCost);
      }

      // Huts (小屋)
      const hutCount = state.buildings.huts || 0;
      if (hutCount >= 20) {
        this.hutBtn.setText('小屋 (已達上限 20)');
        this.hutBtn.setEnabled(false);
      } else {
        const hutCost = 100 + hutCount * 50;
        this.hutBtn.setText(`小屋 (${hutCost} 木材) [${hutCount}]`);
        this.hutBtn.setEnabled(state.resources.wood >= hutCost);
      }
    }
  }

  public update(delta: number): void {
    this.stokeFireBtn.update(delta);
  }
}
