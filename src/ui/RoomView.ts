import Phaser from 'phaser';
import { GameData } from '../core/GameState';
import { TextButton } from './TextButton';
import { RoomSystem } from '../systems/RoomSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { createTextStyle } from '../config/typography';

export class RoomView extends Phaser.GameObjects.Container {
  private statusText: Phaser.GameObjects.Text;
  private warmthText: Phaser.GameObjects.Text;
  private strangerText: Phaser.GameObjects.Text;

  private lightFireBtn: TextButton;
  private stokeFireBtn: TextButton;
  private gatherWoodBtn: TextButton;
  private checkTrapsBtn: TextButton;
  private baitTrapsBtn: TextButton;

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
      50,
      '房間：刺骨寒冷',
      createTextStyle('14px', '#94a3b8')
    );

    this.strangerText = scene.add.text(
      20,
      80,
      '',
      createTextStyle('13px', '#e2e8f0', false, {
        wordWrap: { width: width - 40, useAdvancedWrap: true }
      })
    );

    // Action Buttons
    const btnY = 150;

    // 1. Light Fire
    this.lightFireBtn = new TextButton(scene, 130, btnY, {
      text: '點燃壁爐',
      width: 220,
      height: 38,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          RoomSystem.getInstance().lightFire(state);
        }
      }
    });

    // 2. Stoke Fire
    this.stokeFireBtn = new TextButton(scene, 130, btnY + 50, {
      text: '添柴 (1 木材)',
      width: 220,
      height: 38,
      cooldownMs: 2500,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          RoomSystem.getInstance().stokeFire(state);
        }
      }
    });

    // 3. Gather Wood
    this.gatherWoodBtn = new TextButton(scene, 130, btnY + 110, {
      text: '進入森林採集木材',
      width: 220,
      height: 38,
      cooldownMs: 3500,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          ResourceSystem.getInstance().gatherWood(state);
        }
      }
    });

    // 4. Check Traps
    this.checkTrapsBtn = new TextButton(scene, 130, btnY + 170, {
      text: '巡視森林陷阱',
      width: 220,
      height: 38,
      cooldownMs: 8000,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          ResourceSystem.getInstance().checkTraps(state);
        }
      }
    });

    // 5. Bait Traps
    this.baitTrapsBtn = new TextButton(scene, 130, btnY + 225, {
      text: '為陷阱投放誘餌 (1 生肉)',
      width: 220,
      height: 34,
      fontSize: '12px',
      cooldownMs: 1000,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          ResourceSystem.getInstance().baitTraps(state, 1);
        }
      }
    });

    this.add([
      this.statusText,
      this.warmthText,
      this.strangerText,
      this.lightFireBtn,
      this.stokeFireBtn,
      this.gatherWoodBtn,
      this.checkTrapsBtn,
      this.baitTrapsBtn
    ]);

    scene.add.existing(this);
  }

  public updateDisplay(state: GameData): void {
    const fireMap = {
      dead: '壁爐裡的火已熄滅。',
      smoldering: '火苗在灰燼中微弱悶燒著。',
      flickering: '火焰正搖曳跳動。',
      burning: '壁爐裡的火燒得正旺。',
      roaring: '熊熊烈火驅散了所有寒意。'
    };

    const warmthMap = {
      freezing: '房間：刺骨寒冷',
      cold: '房間：微冷',
      mild: '房間：溫暖適中',
      warm: '房間：溫暖如春'
    };

    this.statusText.setText(fireMap[state.fireState] || '');
    this.warmthText.setText(warmthMap[state.warmthLevel] || '');

    if (state.fireState === 'dead') {
      this.statusText.setColor('#94a3b8');
    } else if (state.fireState === 'roaring' || state.fireState === 'burning') {
      this.statusText.setColor('#f6ad55');
    } else {
      this.statusText.setColor('#cbd5e1');
    }

    if (state.strangerState === 'none') {
      this.strangerText.setText('');
    } else if (state.strangerState === 'sleeping') {
      this.strangerText.setText('神秘女子躺在壁爐邊沉睡，呼吸逐漸平穩。');
    } else if (state.strangerState === 'awake' || state.strangerState === 'helping') {
      this.strangerText.setText('建造者在房間一角專注地繪製著聚落藍圖。');
    }

    if (state.fireState === 'dead') {
      this.lightFireBtn.setVisible(true);
      this.lightFireBtn.setEnabled(true);
      this.stokeFireBtn.setVisible(false);
      this.gatherWoodBtn.setVisible(false);
    } else {
      this.lightFireBtn.setVisible(false);
      this.stokeFireBtn.setVisible(true);
      this.stokeFireBtn.setEnabled(state.resources.wood >= 1);
      this.gatherWoodBtn.setVisible(state.unlockedForest);
    }

    const hasTraps = state.buildings.traps > 0;
    this.checkTrapsBtn.setVisible(hasTraps);
    this.baitTrapsBtn.setVisible(hasTraps);
    if (hasTraps) {
      const baitCount = state.trapBaitMeat || 0;
      this.baitTrapsBtn.setText(`投放誘餌 (現有: ${baitCount})`);
      this.baitTrapsBtn.setEnabled(state.resources.meat >= 1);
    }

    // Dynamically stack visible action buttons without gaps
    let currentY = 140;
    const btnList = [
      this.lightFireBtn,
      this.stokeFireBtn,
      this.gatherWoodBtn,
      this.checkTrapsBtn,
      this.baitTrapsBtn
    ];
    for (const btn of btnList) {
      if (btn.visible) {
        btn.setY(currentY);
        currentY += 48;
      }
    }
  }

  public update(delta: number): void {
    this.stokeFireBtn.update(delta);
    this.gatherWoodBtn.update(delta);
    this.checkTrapsBtn.update(delta);
    this.baitTrapsBtn.update(delta);
  }
}
