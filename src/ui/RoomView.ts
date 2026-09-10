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
  private lodgeBtn: TextButton;
  private tradingPostBtn: TextButton;
  private tanneryBtn: TextButton;
  private smokehouseBtn: TextButton;
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
      cooldownMs: 10000,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          RoomSystem.getInstance().stokeFire(state);
          EventBus.getInstance().emit(Events.ACTION_STOKE_FIRE);
        }
      }
    });

    // 3. Buildings Section (140 x 38 buttons)
    this.buildingsTitle = scene.add.text(
      20,
      95,
      '建築物:',
      createTextStyle('13px', '#94a3b8')
    );

    this.trapBtn = new TextButton(scene, 90, 140, {
      text: '陷阱',
      width: 140,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          VillageSystem.getInstance().build(state, 'traps');
        }
      }
    });

    this.cartBtn = new TextButton(scene, 90, 185, {
      text: '貨車',
      width: 140,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          CraftSystem.getInstance().craft(state, 'cart');
        }
      }
    });

    this.hutBtn = new TextButton(scene, 90, 230, {
      text: '小屋',
      width: 140,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          VillageSystem.getInstance().build(state, 'huts');
        }
      }
    });

    this.lodgeBtn = new TextButton(scene, 90, 275, {
      text: '狩獵小屋',
      width: 140,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          VillageSystem.getInstance().build(state, 'lodge');
        }
      }
    });

    this.tradingPostBtn = new TextButton(scene, 90, 320, {
      text: '貿易站',
      width: 140,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          VillageSystem.getInstance().build(state, 'tradingPost');
        }
      }
    });

    this.tanneryBtn = new TextButton(scene, 90, 365, {
      text: '製革屋',
      width: 140,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          VillageSystem.getInstance().build(state, 'tannery');
        }
      }
    });

    this.smokehouseBtn = new TextButton(scene, 90, 410, {
      text: '燻肉房',
      width: 140,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          VillageSystem.getInstance().build(state, 'smokehouse');
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
      this.hutBtn,
      this.lodgeBtn,
      this.tradingPostBtn,
      this.tanneryBtn,
      this.smokehouseBtn
    ]);

    this.unsubStoke = EventBus.getInstance().on(Events.ACTION_STOKE_FIRE, () => {
      this.stokeFireBtn.triggerCooldown(10000);
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

    this.statusText.setVisible(false);
    this.warmthText.setVisible(false);
    this.strangerText.setVisible(false);

    // Dynamic vertical layout: match authentic A Dark Room
    let currentY = 25;

    // Fire button
    const fireBtnY = currentY + 19;
    this.lightFireBtn.setY(fireBtnY);
    this.stokeFireBtn.setY(fireBtnY);
    currentY += 38 + 20;

    // Fire button logic
    if (state.fireState === 'dead') {
      this.lightFireBtn.setVisible(true);
      this.lightFireBtn.setEnabled(true);
      this.stokeFireBtn.setVisible(false);
    } else {
      this.lightFireBtn.setVisible(false);
      this.stokeFireBtn.setVisible(true);
      this.stokeFireBtn.setText('添柴');
      this.stokeFireBtn.setEnabled(!state.unlockedForest || state.resources.wood >= 1);
    }

    // Builder buildings logic
    const hasBuilder = state.strangerState === 'awake' || state.strangerState === 'helping';
    this.buildingsTitle.setVisible(hasBuilder);

    if (hasBuilder) {
      this.buildingsTitle.setY(currentY);
      currentY += this.buildingsTitle.height + 14;

      const placeBuildingBtn = (btn: TextButton, visible: boolean, enabled: boolean) => {
        btn.setVisible(visible);
        if (visible) {
          btn.setX(90);
          btn.setY(currentY + 19);
          btn.setEnabled(enabled);
          currentY += 38 + 8;
        }
      };

      // 1. Traps (10 + n*10 wood, max 10)
      const trapCount = state.buildings.traps || 0;
      const trapCost = 10 + trapCount * 10;
      const canBuildTrap = trapCount < 10 && state.resources.wood >= trapCost;
      placeBuildingBtn(this.trapBtn, true, canBuildTrap);

      // 2. Cart (30 wood, max 1, stays visible disabled once built)
      const cartCount = state.resources.cart || 0;
      const canBuildCart = cartCount === 0 && state.resources.wood >= 30;
      placeBuildingBtn(this.cartBtn, true, canBuildCart);

      // 3. Huts (100 + n*50 wood, max 20)
      const hutCount = state.buildings.huts || 0;
      const hutCost = 100 + hutCount * 50;
      const canBuildHut = hutCount < 20 && state.resources.wood >= hutCost;
      placeBuildingBtn(this.hutBtn, true, canBuildHut);

      // 4. Lodge (狩獵小屋, unlocks when huts >= 1)
      const showLodge = hutCount >= 1;
      const lodgeCount = state.buildings.lodge || 0;
      const canBuildLodge = lodgeCount === 0 && state.resources.wood >= 200 && state.resources.fur >= 10 && state.resources.meat >= 5;
      placeBuildingBtn(this.lodgeBtn, showLodge, canBuildLodge);

      // 5. Trading Post (貿易站, unlocks when lodge built)
      const showTradingPost = lodgeCount > 0 || (state.buildings.tradingPost || 0) > 0;
      const tpCount = state.buildings.tradingPost || 0;
      const canBuildTp = tpCount === 0 && state.resources.wood >= 400 && state.resources.fur >= 100;
      placeBuildingBtn(this.tradingPostBtn, showTradingPost, canBuildTp);

      // 6. Tannery (製革屋, unlocks when fur >= 15 or tannery built)
      const showTannery = (state.resources.fur >= 15) || (state.buildings.tannery || 0) > 0;
      const tanneryCount = state.buildings.tannery || 0;
      const canBuildTannery = tanneryCount === 0 && state.resources.wood >= 300 && state.resources.fur >= 150;
      placeBuildingBtn(this.tanneryBtn, showTannery, canBuildTannery);

      // 7. Smokehouse (燻肉房, unlocks when meat >= 15 or smokehouse built)
      const showSmokehouse = (state.resources.meat >= 15) || (state.buildings.smokehouse || 0) > 0;
      const smokehouseCount = state.buildings.smokehouse || 0;
      const canBuildSmokehouse = smokehouseCount === 0 && state.resources.wood >= 600 && state.resources.meat >= 200;
      placeBuildingBtn(this.smokehouseBtn, showSmokehouse, canBuildSmokehouse);
    } else {
      this.trapBtn.setVisible(false);
      this.cartBtn.setVisible(false);
      this.hutBtn.setVisible(false);
      this.lodgeBtn.setVisible(false);
      this.tradingPostBtn.setVisible(false);
      this.tanneryBtn.setVisible(false);
      this.smokehouseBtn.setVisible(false);
    }
  }

  public update(delta: number): void {
    this.stokeFireBtn.update(delta);
  }
}
