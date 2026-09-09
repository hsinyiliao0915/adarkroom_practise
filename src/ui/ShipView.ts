import Phaser from 'phaser';
import { GameData } from '../core/GameState';
import { StarshipSystem } from '../systems/StarshipSystem';
import { TextButton } from './TextButton';
import { createTextStyle } from '../config/typography';

export class ShipView extends Phaser.GameObjects.Container {
  private titleText: Phaser.GameObjects.Text;
  private descText: Phaser.GameObjects.Text;
  private hullStatusText: Phaser.GameObjects.Text;
  private engineStatusText: Phaser.GameObjects.Text;
  private launchNoticeText: Phaser.GameObjects.Text;

  private upgradeHullBtn: TextButton;
  private upgradeEngineBtn: TextButton;
  private launchBtn: TextButton;

  private onLaunchCallback?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onLaunch?: () => void) {
    super(scene, x, y);
    this.onLaunchCallback = onLaunch;

    this.titleText = scene.add.text(
      24,
      20,
      '── 外星巡航艦（星艦整備座） ──',
      createTextStyle('15px', '#38bdf8', true)
    );

    this.descText = scene.add.text(
      24,
      50,
      '半埋於黃沙之中的巡航艦核心反應爐已恢復運轉。\n利用外星合金強化船體裝甲與推進引擎，才能衝破近地軌道的太空殘骸帶逃離地球。',
      createTextStyle('11px', '#94a3b8', false, { lineSpacing: 4 })
    );

    // 狀態面板背景
    const statusBg = scene.add.rectangle(24, 105, 442, 130, 0x181a24, 0.95);
    statusBg.setOrigin(0);
    const statusBorder = scene.add.rectangle(24, 105, 442, 130);
    statusBorder.setStrokeStyle(1, 0x334155);
    statusBorder.setFillStyle(0x000000, 0);
    statusBorder.setOrigin(0);

    const statusTitle = scene.add.text(
      38,
      118,
      '【 星艦核心系統狀態 】',
      createTextStyle('13px', '#facc15')
    );

    this.hullStatusText = scene.add.text(
      38,
      148,
      '船體裝甲外殼：等級 0（嚴重損壞，無法起飛）',
      createTextStyle('12px', '#e2e8f0')
    );

    this.engineStatusText = scene.add.text(
      38,
      178,
      '推進器加速引擎：等級 1（標準推力 25 m/s）',
      createTextStyle('12px', '#e2e8f0')
    );

    const flightGoalText = scene.add.text(
      38,
      208,
      '逃逸目標高度：1000 米軌道（脫離大氣層與重力井）',
      createTextStyle('11px', '#60a5fa')
    );

    // 升級按鈕列
    this.upgradeHullBtn = new TextButton(scene, 175, 275, {
      text: '強化船體裝甲',
      width: 300,
      height: 36,
      fontSize: '12px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          StarshipSystem.getInstance().upgradeHull(state);
        }
      }
    });

    this.upgradeEngineBtn = new TextButton(scene, 175, 325, {
      text: '升級推進引擎',
      width: 300,
      height: 36,
      fontSize: '12px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          StarshipSystem.getInstance().upgradeEngine(state);
        }
      }
    });

    this.launchNoticeText = scene.add.text(
      24,
      395,
      '注意：至少需要完成等級 1 船體修復才能耐受升空大氣摩擦。',
      createTextStyle('11px', '#f87171')
    );

    this.launchBtn = new TextButton(scene, 175, 445, {
      text: '✦ 啟動星艦升空 (啟航逃逸) ✦',
      width: 300,
      height: 42,
      fontSize: '13px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state && StarshipSystem.getInstance().canLaunch(state)) {
          if (this.onLaunchCallback) {
            this.onLaunchCallback();
          }
        }
      }
    });

    this.add([
      this.titleText,
      this.descText,
      statusBg,
      statusBorder,
      statusTitle,
      this.hullStatusText,
      this.engineStatusText,
      flightGoalText,
      this.upgradeHullBtn,
      this.upgradeEngineBtn,
      this.launchNoticeText,
      this.launchBtn
    ]);

    scene.add.existing(this);
  }

  public updateDisplay(state: GameData): void {
    if (!state.starship) return;

    const starship = state.starship;
    const starSys = StarshipSystem.getInstance();

    // 船體狀態文字
    if (starship.hullLevel <= 0) {
      this.hullStatusText.setText('船體裝甲外殼：等級 0 (嚴重破損，無法承受升空衝擊)');
      this.hullStatusText.setColor('#f87171');
    } else {
      const maxHp = starSys.getHullHealth(starship.hullLevel);
      this.hullStatusText.setText(`船體裝甲外殼：等級 ${starship.hullLevel} (最大護甲 ${maxHp} HP)`);
      this.hullStatusText.setColor('#4ade80');
    }

    // 引擎狀態文字
    const speed = starSys.getClimbSpeed(starship.engineLevel);
    this.engineStatusText.setText(`推進器加速引擎：等級 ${starship.engineLevel} (攀升速率 ${speed} m/s)`);

    // 升級費用與按鈕
    const hullCost = starSys.getHullUpgradeCost(starship.hullLevel);
    const canAffordHull = (state.resources.alienAlloy || 0) >= hullCost.alienAlloy && (state.resources.steel || 0) >= hullCost.steel;
    const hullActionName = starship.hullLevel === 0 ? '修復船體外殼' : '強化船體護甲';
    this.upgradeHullBtn.setText(`${hullActionName} (合金: ${hullCost.alienAlloy}, 鋼: ${hullCost.steel})`);
    this.upgradeHullBtn.setEnabled(canAffordHull);

    const engineCost = starSys.getEngineUpgradeCost(starship.engineLevel);
    const canAffordEngine = (state.resources.alienAlloy || 0) >= engineCost.alienAlloy && (state.resources.steel || 0) >= engineCost.steel;
    this.upgradeEngineBtn.setText(`升級推進引擎 (合金: ${engineCost.alienAlloy}, 鋼: ${engineCost.steel})`);
    this.upgradeEngineBtn.setEnabled(canAffordEngine);

    // 升空判定
    const canLaunch = starSys.canLaunch(state);
    this.launchBtn.setEnabled(canLaunch);
    if (!canLaunch) {
      this.launchNoticeText.setText('注意：需要先修復船體（至少等級 1）方可啟動引擎升空。');
      this.launchNoticeText.setColor('#f87171');
    } else {
      this.launchNoticeText.setText('反應爐運轉正常。確認啟動推進器進入近地軌道逃逸程序。');
      this.launchNoticeText.setColor('#38bdf8');
    }
  }
}
