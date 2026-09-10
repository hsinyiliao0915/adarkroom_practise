import Phaser from 'phaser';
import { GameData } from '../core/GameState';
import { TextButton } from './TextButton';
import { ResourceSystem } from '../systems/ResourceSystem';
import { EventBus, Events } from '../core/EventBus';

export class OutsideView extends Phaser.GameObjects.Container {
  private gatherWoodBtn: TextButton;
  private checkTrapsBtn: TextButton;
  private baitTrapsBtn: TextButton;
  private unsubList: Array<() => void> = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // 1. Gather Wood (伐木)
    this.gatherWoodBtn = new TextButton(scene, 90, 44, {
      text: '伐木',
      width: 140,
      height: 38,
      cooldownMs: 60000,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          ResourceSystem.getInstance().gatherWood(state);
          EventBus.getInstance().emit(Events.ACTION_GATHER_WOOD);
        }
      }
    });

    // 2. Check Traps (查看陷阱)
    this.checkTrapsBtn = new TextButton(scene, 90, 92, {
      text: '查看陷阱',
      width: 140,
      height: 38,
      cooldownMs: 90000,
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          ResourceSystem.getInstance().checkTraps(state);
          EventBus.getInstance().emit(Events.ACTION_CHECK_TRAPS);
        }
      }
    });

    // 3. Bait Traps (投放誘餌)
    this.baitTrapsBtn = new TextButton(scene, 90, 140, {
      text: '投放誘餌 (1 生肉)',
      width: 140,
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

    this.add([this.gatherWoodBtn, this.checkTrapsBtn, this.baitTrapsBtn]);

    this.unsubList.push(
      EventBus.getInstance().on(Events.ACTION_GATHER_WOOD, () => {
        this.gatherWoodBtn.triggerCooldown(60000);
      })
    );
    this.unsubList.push(
      EventBus.getInstance().on(Events.ACTION_CHECK_TRAPS, () => {
        this.checkTrapsBtn.triggerCooldown(90000);
      })
    );

    this.on('destroy', () => {
      this.unsubList.forEach((unsub) => unsub());
    });

    scene.add.existing(this);
  }

  public updateDisplay(state: GameData): void {
    const hasTraps = state.buildings.traps > 0;
    this.checkTrapsBtn.setVisible(hasTraps);
    this.baitTrapsBtn.setVisible(hasTraps);

    if (hasTraps) {
      const baitCount = state.trapBaitMeat || 0;
      this.baitTrapsBtn.setText(`投放誘餌 (現有: ${baitCount})`);
      this.baitTrapsBtn.setEnabled(state.resources.meat >= 1);
    }

    // Dynamic stacking of visible buttons
    let currentY = 44;
    const btnList = [this.gatherWoodBtn, this.checkTrapsBtn, this.baitTrapsBtn];
    for (const btn of btnList) {
      if (btn.visible) {
        btn.setX(90);
        btn.setY(currentY);
        currentY += 48;
      }
    }
  }

  public update(delta: number): void {
    this.gatherWoodBtn.update(delta);
    this.checkTrapsBtn.update(delta);
    this.baitTrapsBtn.update(delta);
  }
}
