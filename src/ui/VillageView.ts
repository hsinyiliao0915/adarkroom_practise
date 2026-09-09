import Phaser from 'phaser';
import { GameData, Buildings, Workers, Resources } from '../core/GameState';
import { BUILDING_RECIPES, WORKER_JOBS } from '../data/recipes';
import { VillageSystem } from '../systems/VillageSystem';
import { TextButton } from './TextButton';
import { createTextStyle } from '../config/typography';

interface BuildingRow {
  id: keyof Buildings;
  nameText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  buildBtn: TextButton;
}

interface WorkerRow {
  id: keyof Workers;
  nameText: Phaser.GameObjects.Text;
  countText: Phaser.GameObjects.Text;
  minusBtn: TextButton;
  plusBtn: TextButton;
  descText: Phaser.GameObjects.Text;
}

export class VillageView extends Phaser.GameObjects.Container {
  private popSummaryText: Phaser.GameObjects.Text;
  private bTitle: Phaser.GameObjects.Text;
  private wTitle: Phaser.GameObjects.Text;
  private buildingRows: BuildingRow[] = [];
  private workerRows: WorkerRow[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Population Title
    this.popSummaryText = scene.add.text(
      20,
      15,
      '聚落人口：0 / 0 人 (閒置：0 人)',
      createTextStyle('14px', '#38bdf8')
    );
    this.add(this.popSummaryText);

    // Section 1: Buildings
    this.bTitle = scene.add.text(
      20,
      42,
      '── 聚落建築 ──',
      createTextStyle('12px', '#94a3b8')
    );
    this.add(this.bTitle);

    const startY = 65;
    BUILDING_RECIPES.forEach((recipe, idx) => {
      const rowY = startY + idx * 36;

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

      const buildBtn = new TextButton(scene, 440, rowY + 8, {
        text: '建造',
        width: 60,
        height: 24,
        fontSize: '11px',
        onClick: () => {
          const state = (scene as any).gameState as GameData;
          if (state) {
            VillageSystem.getInstance().build(state, recipe.id);
          }
        }
      });

      this.buildingRows.push({
        id: recipe.id,
        nameText,
        costText,
        buildBtn
      });

      this.add([nameText, costText, buildBtn]);
    });

    // Section 2: Worker Allocation
    const wTitleY = startY + BUILDING_RECIPES.length * 36 + 10;
    this.wTitle = scene.add.text(
      20,
      wTitleY,
      '── 人口工作指派 ──',
      createTextStyle('12px', '#94a3b8')
    );
    this.add(this.wTitle);

    const workerStartY = wTitleY + 22;
    WORKER_JOBS.forEach((job, idx) => {
      const rowY = workerStartY + idx * 30;

      const nameText = scene.add.text(
        20,
        rowY,
        `${job.name}`,
        createTextStyle('12px', '#e2e8f0')
      );

      const minusBtn = new TextButton(scene, 175, rowY + 6, {
        text: '-',
        width: 24,
        height: 20,
        fontSize: '12px',
        onClick: () => {
          const state = (scene as any).gameState as GameData;
          if (state) {
            VillageSystem.getInstance().assignWorker(state, job.id, -1);
          }
        }
      });

      const countText = scene.add.text(
        198,
        rowY + 1,
        '0',
        createTextStyle('12px', '#facc15', true, { align: 'center' })
      );

      const plusBtn = new TextButton(scene, 230, rowY + 6, {
        text: '+',
        width: 24,
        height: 20,
        fontSize: '12px',
        onClick: () => {
          const state = (scene as any).gameState as GameData;
          if (state) {
            VillageSystem.getInstance().assignWorker(state, job.id, 1);
          }
        }
      });

      const descText = scene.add.text(
        255,
        rowY + 2,
        '',
        createTextStyle('10px', '#64748b')
      );

      this.workerRows.push({
        id: job.id,
        nameText,
        countText,
        minusBtn,
        plusBtn,
        descText
      });

      this.add([nameText, minusBtn, countText, plusBtn, descText]);
    });

    scene.add.existing(this);
  }

  public updateDisplay(state: GameData): void {
    const free = VillageSystem.getInstance().getFreeVillagers(state);
    const maxPop = VillageSystem.getInstance().getMaxPopulation(state);
    this.popSummaryText.setText(`聚落人口：${state.population} / ${maxPop} 人 (閒置村民：${free} 人)`);

    const startY = 65;
    let bIdx = 0;

    this.buildingRows.forEach((row) => {
      const recipe = BUILDING_RECIPES.find((r) => r.id === row.id);
      if (!recipe) return;

      const current = state.buildings[row.id] || 0;
      const isMaxed = recipe.maxCount !== undefined && current >= recipe.maxCount;
      const costs = recipe.cost(current);

      let isUnlocked = true;
      if (recipe.unlockRequirement) {
        isUnlocked = current > 0 || recipe.unlockRequirement(state.buildings, state.resources);
      }

      row.nameText.setVisible(isUnlocked);
      row.costText.setVisible(isUnlocked);
      row.buildBtn.setVisible(isUnlocked);

      if (!isUnlocked) return;

      const rowY = startY + bIdx * 34;
      row.nameText.setY(rowY);
      row.costText.setY(rowY + 2);
      row.buildBtn.setY(rowY + 8);
      bIdx++;

      const costParts: string[] = [];
      let canAfford = true;

      for (const [resKey, amount] of Object.entries(costs)) {
        costParts.push(`${this.getResourceName(resKey as keyof Resources)} ${amount}`);
        if ((state.resources[resKey as keyof Resources] || 0) < amount) {
          canAfford = false;
        }
      }

      const countStr = recipe.maxCount ? `(${current}/${recipe.maxCount})` : `(${current})`;
      row.nameText.setText(`${recipe.name} ${countStr}`);

      if (isMaxed) {
        row.costText.setText('已達建造上限');
        row.costText.setColor('#64748b');
        row.buildBtn.setEnabled(false);
      } else {
        row.costText.setText(costParts.join(', '));
        row.costText.setColor(canAfford ? '#94a3b8' : '#e11d48');
        row.buildBtn.setEnabled(canAfford);
      }
    });

    const wTitleY = startY + bIdx * 34 + 14;
    this.wTitle.setY(wTitleY);
    const showWorkerSection = state.population > 0 || state.buildings.huts > 0;
    this.wTitle.setVisible(showWorkerSection);

    let wIdx = 0;
    const workerStartY = wTitleY + 22;

    this.workerRows.forEach((row) => {
      const job = WORKER_JOBS.find((j) => j.id === row.id);
      if (!job) return;

      const current = state.workers[row.id] || 0;
      row.countText.setText(current.toString().padStart(2, ' '));

      let isUnlocked = showWorkerSection;
      if (job.requiredBuilding) {
        isUnlocked = isUnlocked && (state.buildings[job.requiredBuilding] || 0) > 0;
      }
      if (job.requiredLandmark) {
        isUnlocked = isUnlocked && state.clearedLandmarks.includes(job.requiredLandmark);
      }

      row.nameText.setVisible(isUnlocked);
      row.minusBtn.setVisible(isUnlocked);
      row.countText.setVisible(isUnlocked);
      row.plusBtn.setVisible(isUnlocked);
      row.descText.setVisible(isUnlocked);

      if (!isUnlocked) return;

      const rowY = workerStartY + wIdx * 30;
      row.nameText.setY(rowY);
      row.minusBtn.setY(rowY + 6);
      row.countText.setY(rowY + 1);
      row.plusBtn.setY(rowY + 6);
      row.descText.setY(rowY + 2);
      wIdx++;

      row.minusBtn.setEnabled(current > 0);
      row.plusBtn.setEnabled(free > 0);
      row.descText.setText(job.description);
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
