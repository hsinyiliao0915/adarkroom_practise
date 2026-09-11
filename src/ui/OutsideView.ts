import Phaser from 'phaser';
import { GameData, Workers } from '../core/GameState';
import { TextButton } from './TextButton';
import { ResourceSystem } from '../systems/ResourceSystem';
import { VillageSystem } from '../systems/VillageSystem';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';
import { EventBus, Events } from '../core/EventBus';

interface WorkerRowUI {
  job: keyof Workers;
  label: string;
  nameText: Phaser.GameObjects.Text;
  countText: Phaser.GameObjects.Text;
  upBtn?: Phaser.GameObjects.Text;
  downBtn?: Phaser.GameObjects.Text;
  visible: boolean;
}

export class OutsideView extends Phaser.GameObjects.Container {
  private gatherWoodBtn: TextButton;
  private checkTrapsBtn: TextButton;
  private workerRows: WorkerRowUI[] = [];
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

    this.add([this.gatherWoodBtn, this.checkTrapsBtn]);

    // Setup Worker Rows
    const jobs: Array<{ id: keyof Workers; label: string; hasControls: boolean }> = [
      { id: 'gatherers', label: '伐木者', hasControls: false },
      { id: 'hunters', label: '獵人', hasControls: true },
      { id: 'trappers', label: '陷阱師', hasControls: true },
      { id: 'tanners', label: '製革工', hasControls: true },
      { id: 'curedMeatMakers', label: '燻肉師', hasControls: true },
      { id: 'ironMiners', label: '鐵礦工', hasControls: true },
      { id: 'coalMiners', label: '煤礦工', hasControls: true },
      { id: 'steelworkers', label: '煉鋼工', hasControls: true }
    ];

    const theme = ThemeManager.getInstance().getTheme();

    jobs.forEach((jobDef) => {
      const nameText = scene.add.text(240, 0, jobDef.label, createTextStyle('14px', theme.textPrimary));
      const countText = scene.add.text(350, 0, '0', createTextStyle('14px', theme.textPrimary));
      nameText.setVisible(false);
      countText.setVisible(false);
      this.add([nameText, countText]);

      let upBtn: Phaser.GameObjects.Text | undefined;
      let downBtn: Phaser.GameObjects.Text | undefined;

      if (jobDef.hasControls) {
        const makeBtn = (text: string, xOffset: number, delta: number) => {
          const btn = scene.add.text(xOffset, 0, text, createTextStyle('14px', '#94a3b8'));
          btn.setPadding(8, 6);
          btn.setInteractive({ useHandCursor: true });

          let timer: Phaser.Time.TimerEvent | null = null;
          let delayTimer: Phaser.Time.TimerEvent | null = null;

          const executeAssign = (pointer?: Phaser.Input.Pointer) => {
            const state = (scene as any).gameState as GameData;
            if (!state) return;

            let step = delta;
            if (pointer && pointer.event && (pointer.event as MouseEvent).shiftKey) {
              step = delta * 10;
            }

            const numGatherers = VillageSystem.getInstance().getNumGatherers(state);
            const currentVal = state.workers[jobDef.id] || 0;
            if (delta > 0 && numGatherers <= 0) return;
            if (delta < 0 && currentVal <= 0) return;

            VillageSystem.getInstance().assignWorker(state, jobDef.id, step);
          };

          const stopTimer = () => {
            if (delayTimer) {
              delayTimer.remove();
              delayTimer = null;
            }
            if (timer) {
              timer.remove();
              timer = null;
            }
          };

          btn.on('pointerover', () => {
            const state = (scene as any).gameState as GameData;
            if (state) {
              const numGatherers = VillageSystem.getInstance().getNumGatherers(state);
              const currentVal = state.workers[jobDef.id] || 0;
              if ((delta > 0 && numGatherers > 0) || (delta < 0 && currentVal > 0)) {
                btn.setColor('#ffffff');
              }
            }
          });

          btn.on('pointerout', () => {
            stopTimer();
            const state = (scene as any).gameState as GameData;
            if (state) {
              const numGatherers = VillageSystem.getInstance().getNumGatherers(state);
              const currentVal = state.workers[jobDef.id] || 0;
              const isEnabled = (delta > 0 && numGatherers > 0) || (delta < 0 && currentVal > 0);
              btn.setColor(isEnabled ? '#94a3b8' : '#475569');
            }
          });

          btn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            executeAssign(pointer);

            stopTimer();
            delayTimer = scene.time.delayedCall(300, () => {
              timer = scene.time.addEvent({
                delay: 100,
                loop: true,
                callback: () => executeAssign()
              });
            });
          });

          btn.on('pointerup', stopTimer);
          btn.setVisible(false);
          this.add(btn);
          return btn;
        };

        upBtn = makeBtn('▲', 385, 1);
        downBtn = makeBtn('▼', 415, -1);
      }

      this.workerRows.push({
        job: jobDef.id,
        label: jobDef.label,
        nameText,
        countText,
        upBtn,
        downBtn,
        visible: false
      });
    });

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
    const hasTraps = (state.buildings.traps || 0) > 0;
    this.checkTrapsBtn.setVisible(hasTraps);

    // Dynamic stacking of visible buttons
    let currentBtnY = 44;
    this.gatherWoodBtn.setX(90);
    this.gatherWoodBtn.setY(currentBtnY);
    currentBtnY += 48;

    if (hasTraps) {
      this.checkTrapsBtn.setX(90);
      this.checkTrapsBtn.setY(currentBtnY);
    }

    // Workers display on the right
    const numGatherers = VillageSystem.getInstance().getNumGatherers(state);
    const theme = ThemeManager.getInstance().getTheme();

    let workerRowY = 36;

    this.workerRows.forEach((row) => {
      let shouldShow = false;

      if (row.job === 'gatherers') {
        shouldShow = state.population > 0;
      } else if (row.job === 'hunters' || row.job === 'trappers') {
        shouldShow = (state.buildings.lodge || 0) > 0;
      } else if (row.job === 'tanners') {
        shouldShow = (state.buildings.tannery || 0) > 0;
      } else if (row.job === 'curedMeatMakers') {
        shouldShow = (state.buildings.smokehouse || 0) > 0;
      } else if (row.job === 'ironMiners') {
        shouldShow = state.clearedLandmarks.includes('iron_mine_1');
      } else if (row.job === 'coalMiners') {
        shouldShow = state.clearedLandmarks.includes('coal_mine_1');
      } else if (row.job === 'steelworkers') {
        shouldShow = (state.buildings.furnace || 0) > 0;
      }

      row.visible = shouldShow;
      row.nameText.setVisible(shouldShow);
      row.countText.setVisible(shouldShow);

      if (shouldShow) {
        row.nameText.setY(workerRowY);
        row.countText.setY(workerRowY);

        const count = row.job === 'gatherers' ? numGatherers : (state.workers[row.job] || 0);
        row.countText.setText(String(count));

        row.nameText.setColor(theme.textPrimary);
        row.countText.setColor(theme.textPrimary);

        if (row.upBtn && row.downBtn) {
          row.upBtn.setVisible(true);
          row.downBtn.setVisible(true);

          row.upBtn.setY(workerRowY);
          row.downBtn.setY(workerRowY);

          // Enable/disable up and down buttons
          const canUp = numGatherers > 0;
          const canDown = count > 0;

          row.upBtn.setColor(canUp ? '#94a3b8' : '#475569');
          row.downBtn.setColor(canDown ? '#94a3b8' : '#475569');
        }

        workerRowY += 48;
      } else {
        if (row.upBtn) row.upBtn.setVisible(false);
        if (row.downBtn) row.downBtn.setVisible(false);
      }
    });
  }

  public update(delta: number): void {
    this.gatherWoodBtn.update(delta);
    this.checkTrapsBtn.update(delta);
  }
}

