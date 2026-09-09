import Phaser from 'phaser';
import { GameData } from '../core/GameState';
import { LeaderboardManager } from '../core/LeaderboardManager';
import { TextButton } from './TextButton';
import { createTextStyle } from '../config/typography';

export class LeaderboardModal extends Phaser.GameObjects.Container {
  private bgBackdrop: Phaser.GameObjects.Rectangle;
  private modalBg: Phaser.GameObjects.Rectangle;
  private modalBorder: Phaser.GameObjects.Rectangle;

  private titleText: Phaser.GameObjects.Text;
  private subText: Phaser.GameObjects.Text;
  private currentScoreText: Phaser.GameObjects.Text;

  private rowTexts: Phaser.GameObjects.Text[] = [];
  private submitBtn: TextButton;
  private clearBtn: TextButton;
  private closeBtn: TextButton;

  constructor(scene: Phaser.Scene, width: number = 600, height: number = 520) {
    const cameraWidth = scene.cameras.main.width;
    const cameraHeight = scene.cameras.main.height;
    super(scene, cameraWidth / 2, cameraHeight / 2);

    // 半透明全螢幕遮罩
    this.bgBackdrop = scene.add.rectangle(0, 0, cameraWidth, cameraHeight, 0x000000, 0.7);
    this.bgBackdrop.setInteractive(); // 阻擋點擊穿透

    // 彈窗背景與邊框
    this.modalBg = scene.add.rectangle(0, 0, width, height, 0x13151f, 0.98);
    this.modalBorder = scene.add.rectangle(0, 0, width, height);
    this.modalBorder.setStrokeStyle(2, 0x38bdf8);
    this.modalBorder.setFillStyle(0x000000, 0);

    // 標題與說明
    this.titleText = scene.add.text(
      0,
      -height / 2 + 35,
      '🏆 荒野探險家分數排行榜',
      createTextStyle('18px', '#facc15', false, { align: 'center' })
    );
    this.titleText.setOrigin(0.5);

    this.subText = scene.add.text(
      0,
      -height / 2 + 65,
      '（資料儲存於 localStorage，重新整理或重新開啟網頁後仍會永久保留）',
      createTextStyle('11px', '#94a3b8', false, { align: 'center' })
    );
    this.subText.setOrigin(0.5);

    // 表格標頭
    const headerY = -height / 2 + 95;
    const headerText = scene.add.text(
      -width / 2 + 35,
      headerY,
      '排名   冒險家名稱           生存天數   地標攻克   榮譽總積分    達成日期',
      createTextStyle('11px', '#64748b', true)
    );

    const divider = scene.add.rectangle(0, headerY + 18, width - 60, 1, 0x334155);

    this.add([
      this.bgBackdrop,
      this.modalBg,
      this.modalBorder,
      this.titleText,
      this.subText,
      headerText,
      divider
    ]);

    // 預留 7 行排行榜文字
    const startRowY = headerY + 28;
    for (let i = 0; i < 7; i++) {
      const row = scene.add.text(
        -width / 2 + 35,
        startRowY + i * 28,
        '',
        createTextStyle('12px', '#e2e8f0', true)
      );
      this.rowTexts.push(row);
      this.add(row);
    }

    // 當前玩家分數顯示
    this.currentScoreText = scene.add.text(
      0,
      height / 2 - 85,
      '',
      createTextStyle('13px', '#38bdf8', false, { align: 'center' })
    );
    this.currentScoreText.setOrigin(0.5);
    this.add(this.currentScoreText);

    // 按鈕區
    const btnY = height / 2 - 40;

    // 登錄成績按鈕
    this.submitBtn = new TextButton(scene, -150, btnY, {
      text: '登錄我的成績',
      width: 140,
      height: 32,
      fontSize: '12px',
      onClick: () => this.promptAndSubmit(scene)
    });

    // 清空排行榜按鈕
    this.clearBtn = new TextButton(scene, 10, btnY, {
      text: '清空排行榜',
      width: 120,
      height: 32,
      fontSize: '12px',
      onClick: () => {
        if (window.confirm('確定要清除 localStorage 中的所有排行榜資料嗎？')) {
          LeaderboardManager.getInstance().clearLeaderboard();
          this.refreshTable(scene);
        }
      }
    });

    // 關閉按鈕
    this.closeBtn = new TextButton(scene, 155, btnY, {
      text: '關閉',
      width: 110,
      height: 32,
      fontSize: '12px',
      onClick: () => this.hide()
    });

    this.add([this.submitBtn, this.clearBtn, this.closeBtn]);

    // 預設隱藏
    this.setVisible(false);
    this.setDepth(100);
    scene.add.existing(this);
  }

  public show(scene: Phaser.Scene): void {
    this.setVisible(true);
    this.refreshTable(scene);
  }

  public hide(): void {
    this.setVisible(false);
  }

  private refreshTable(scene: Phaser.Scene): void {
    const list = LeaderboardManager.getInstance().getLeaderboard();

    for (let i = 0; i < this.rowTexts.length; i++) {
      if (i < list.length) {
        const entry = list[i];
        const rankStr = `NO.${i + 1}`.padEnd(6, ' ');
        const nameStr = this.truncatePad(entry.name, 12);
        const daysStr = `${entry.days} 天`.padStart(8, ' ');
        const clearStr = `${entry.clearedCount} 座`.padStart(8, ' ');
        const scoreStr = `${entry.score} 分`.padStart(11, ' ');
        const dateStr = entry.date.padStart(13, ' ');

        this.rowTexts[i].setText(`${rankStr} ${nameStr} ${daysStr} ${clearStr} ${scoreStr} ${dateStr}`);

        // 第一名高亮金色
        if (i === 0) {
          this.rowTexts[i].setColor('#facc15');
        } else if (i === 1) {
          this.rowTexts[i].setColor('#cbd5e1');
        } else if (i === 2) {
          this.rowTexts[i].setColor('#f97316');
        } else {
          this.rowTexts[i].setColor('#e2e8f0');
        }
      } else {
        this.rowTexts[i].setText(`NO.${i + 1}   ────────── 暫無紀錄 ──────────`);
        this.rowTexts[i].setColor('#475569');
      }
    }

    // 計算當前分數
    const state = (scene as any).gameState as GameData;
    if (state) {
      const current = LeaderboardManager.getInstance().calculateScore(state);
      this.currentScoreText.setText(
        `您當前的探險評分：${current.score} 分 (生存 ${current.days} 天 / 攻克地標 ${current.clearedCount} 座 / 人口 ${state.population} 人)`
      );
    }
  }

  private promptAndSubmit(scene: Phaser.Scene): void {
    const state = (scene as any).gameState as GameData;
    if (!state) return;

    const playerName = window.prompt('請輸入您的冒險家大名：', state.strangerName || '神秘旅人');
    if (playerName && playerName.trim()) {
      LeaderboardManager.getInstance().addScore(playerName.trim(), state);
      this.refreshTable(scene);
    }
  }

  private truncatePad(str: string, targetLen: number): string {
    let len = 0;
    let res = '';
    for (const ch of str) {
      const charLen = ch.charCodeAt(0) > 255 ? 2 : 1;
      if (len + charLen <= targetLen) {
        res += ch;
        len += charLen;
      } else {
        break;
      }
    }
    while (len < targetLen) {
      res += ' ';
      len += 1;
    }
    return res;
  }
}
