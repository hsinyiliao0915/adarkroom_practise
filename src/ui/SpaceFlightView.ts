import Phaser from 'phaser';
import { GameData } from '../core/GameState';
import { StarshipSystem } from '../systems/StarshipSystem';
import { TextButton } from './TextButton';
import { createTextStyle } from '../config/typography';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  charText?: Phaser.GameObjects.Text;
}

export class SpaceFlightView extends Phaser.GameObjects.Container {
  private viewWidth: number = 490;
  private viewHeight: number = 645;

  private isFlying: boolean = false;
  private altitude: number = 0;
  private maxAltitude: number = 1000;
  private hullHp: number = 40;
  private maxHullHp: number = 40;
  private climbRate: number = 25;

  // HUD
  private altitudeText: Phaser.GameObjects.Text;
  private hullText: Phaser.GameObjects.Text;
  private speedText: Phaser.GameObjects.Text;
  private flightLogText: Phaser.GameObjects.Text;

  // Player Ship
  private shipText: Phaser.GameObjects.Text;
  private shipX: number = 245;
  private shipY: number = 550;
  private shipWidth: number = 24;
  private shipHeight: number = 24;

  // Obstacles
  private obstacles: Obstacle[] = [];
  private spawnCooldown: number = 0;

  // Overlays
  private crashContainer: Phaser.GameObjects.Container;
  private victoryContainer: Phaser.GameObjects.Container;

  // Callbacks
  private onReturnCallback?: () => void;
  private onRestartCallback?: () => void;

  // Input
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    W: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, x: number, y: number, onReturn?: () => void, onRestart?: () => void) {
    super(scene, x, y);
    this.onReturnCallback = onReturn;
    this.onRestartCallback = onRestart;

    // 1. 深空背景與邊框
    const bg = scene.add.rectangle(0, 0, this.viewWidth, this.viewHeight, 0x07090e, 0.98);
    bg.setOrigin(0);
    const border = scene.add.rectangle(0, 0, this.viewWidth, this.viewHeight);
    border.setStrokeStyle(1, 0x1e293b);
    border.setFillStyle(0x000000, 0);
    border.setOrigin(0);

    // 2. HUD 頂部儀表板
    const hudBg = scene.add.rectangle(0, 0, this.viewWidth, 50, 0x0f172a, 0.9);
    hudBg.setOrigin(0);

    this.altitudeText = scene.add.text(
      20,
      16,
      '高度: 0m / 1000m',
      createTextStyle('13px', '#38bdf8', true)
    );

    this.hullText = scene.add.text(
      180,
      16,
      '船體護甲: 40 / 40 HP',
      createTextStyle('13px', '#4ade80', true)
    );

    this.speedText = scene.add.text(
      360,
      16,
      '爬升速率: 25 m/s',
      createTextStyle('12px', '#facc15')
    );

    this.flightLogText = scene.add.text(
      20,
      60,
      '導航系統正常運作中。使用 A/D 或 ←/→ 鍵避開下墜的隕石與太空碎屑！',
      createTextStyle('11px', '#94a3b8')
    );

    // 3. 玩家星艦文字符號
    this.shipText = scene.add.text(
      this.shipX,
      this.shipY,
      '▲',
      createTextStyle('22px', '#38bdf8', true)
    );
    this.shipText.setOrigin(0.5);

    this.add([
      bg,
      border,
      hudBg,
      this.altitudeText,
      this.hullText,
      this.speedText,
      this.flightLogText,
      this.shipText
    ]);

    // 4. 墜毀迫降介面 (Crash Container)
    this.crashContainer = scene.add.container(0, 0);
    const crashBg = scene.add.rectangle(30, 150, 430, 300, 0x1a0b12, 0.98);
    crashBg.setOrigin(0);
    const crashBorder = scene.add.rectangle(30, 150, 430, 300);
    crashBorder.setStrokeStyle(2, 0xef4444);
    crashBorder.setFillStyle(0x000000, 0);
    crashBorder.setOrigin(0);

    const crashTitle = scene.add.text(
      50,
      180,
      '── 升空失敗：星艦墜毀 ──',
      createTextStyle('16px', '#f87171', true)
    );

    const crashDesc = scene.add.text(
      50,
      220,
      '穿過大氣層時遭受高密度太空碎屑猛烈撞擊，推進器故障迫降。\n你幸運地生還並爬回了安靜小室。\n星艦結構完好並保留所有已安裝升級，收集更多合金提升護甲後再來挑戰！',
      createTextStyle('12px', '#cbd5e1', false, { lineSpacing: 6, wordWrap: { width: 390 } })
    );

    const crashReturnBtn = new TextButton(scene, 245, 390, {
      text: '返回安靜小室重新整備',
      width: 220,
      height: 38,
      fontSize: '13px',
      onClick: () => {
        this.crashContainer.setVisible(false);
        if (this.onReturnCallback) {
          this.onReturnCallback();
        }
      }
    });

    this.crashContainer.add([crashBg, crashBorder, crashTitle, crashDesc, crashReturnBtn]);
    this.crashContainer.setVisible(false);
    this.add(this.crashContainer);

    // 5. 通關結局介面 (Victory Container)
    this.victoryContainer = scene.add.container(0, 0);
    const victoryBg = scene.add.rectangle(20, 40, 450, 560, 0x0c1322, 0.99);
    victoryBg.setOrigin(0);
    const victoryBorder = scene.add.rectangle(20, 40, 450, 560);
    victoryBorder.setStrokeStyle(2, 0x38bdf8);
    victoryBorder.setFillStyle(0x000000, 0);
    victoryBorder.setOrigin(0);

    const victoryTitle = scene.add.text(
      40,
      65,
      '── 逃離地球 · 破曉的星海 ──',
      createTextStyle('16px', '#67e8f9', true)
    );

    const victoryNarrative = scene.add.text(
      40,
      110,
      '星艦突破了鉛灰色的厚重大氣層，母星的引力井在身後無聲遠去。\n\n' +
      '俯瞰下方，那顆曾被冰雪與黃沙覆蓋的荒蕪星球正在宇宙中靜靜旋轉。\n' +
      '你回想起了安靜小室裡微弱的壁爐餘燼、依偎著火堆甦醒的建造者，以及在廢墟中建立起聚落的村民們。\n\n' +
      '反應爐閃爍著藍白色的平穩光芒，星際躍遷引擎校準完畢。\n' +
      '在這無邊寂靜的星辰大海中，小黑屋的荒野旅程已經圓滿落幕。\n' +
      '而文明的全新篇章，正朝著未知的繁星展開……',
      createTextStyle('12px', '#e2e8f0', false, { lineSpacing: 7, wordWrap: { width: 410 } })
    );

    const victoryStats = scene.add.text(
      40,
      390,
      '【 本輪通關數據統計 】\n全破成就：達成引力逃逸 (Victory)',
      createTextStyle('12px', '#facc15', true, { lineSpacing: 5 })
    );

    const freeRoamBtn = new TextButton(scene, 140, 520, {
      text: '繼續自由漫遊模式',
      width: 180,
      height: 38,
      fontSize: '12px',
      onClick: () => {
        this.victoryContainer.setVisible(false);
        if (this.onReturnCallback) {
          this.onReturnCallback();
        }
      }
    });

    const newJourneyBtn = new TextButton(scene, 350, 520, {
      text: '開啟全新開局',
      width: 180,
      height: 38,
      fontSize: '12px',
      onClick: () => {
        this.victoryContainer.setVisible(false);
        if (this.onRestartCallback) {
          this.onRestartCallback();
        }
      }
    });

    this.victoryContainer.add([
      victoryBg,
      victoryBorder,
      victoryTitle,
      victoryNarrative,
      victoryStats,
      freeRoamBtn,
      newJourneyBtn
    ]);
    this.victoryContainer.setVisible(false);
    this.add(this.victoryContainer);

    // 鍵盤操控
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
      };
    }

    scene.add.existing(this);
  }

  public startFlight(state: GameData): void {
    const starSys = StarshipSystem.getInstance();
    this.altitude = 0;
    this.maxHullHp = starSys.getHullHealth(state.starship.hullLevel);
    this.hullHp = this.maxHullHp;
    this.climbRate = starSys.getClimbSpeed(state.starship.engineLevel);

    this.shipX = 245;
    this.shipY = 550;
    this.shipText.setPosition(this.shipX, this.shipY);

    // 清空既有障礙物
    this.clearObstacles();
    this.crashContainer.setVisible(false);
    this.victoryContainer.setVisible(false);
    this.isFlying = true;

    this.updateHUD();
  }

  private clearObstacles(): void {
    this.obstacles.forEach((obs) => {
      if (obs.charText) obs.charText.destroy();
    });
    this.obstacles = [];
  }

  private updateHUD(): void {
    this.altitudeText.setText(`高度: ${Math.floor(this.altitude)}m / ${this.maxAltitude}m`);
    this.hullText.setText(`船體護甲: ${Math.max(0, Math.floor(this.hullHp))} / ${this.maxHullHp} HP`);
    this.speedText.setText(`爬升速率: ${this.climbRate} m/s`);

    const hpPercent = this.hullHp / this.maxHullHp;
    if (hpPercent > 0.5) this.hullText.setColor('#4ade80');
    else if (hpPercent > 0.25) this.hullText.setColor('#facc15');
    else this.hullText.setColor('#f87171');
  }

  public update(delta: number): void {
    if (!this.isFlying) return;

    // 1. 玩家水平位移
    const moveSpeed = 240; // px/sec
    const deltaSec = delta / 1000;

    let dx = 0;
    if (this.cursors && this.wasdKeys) {
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) dx -= 1;
      if (this.cursors.right.isDown || this.wasdKeys.D.isDown) dx += 1;
    }

    if (dx !== 0) {
      this.shipX = Math.max(30, Math.min(this.viewWidth - 30, this.shipX + dx * moveSpeed * deltaSec));
      this.shipText.setX(this.shipX);
    }

    // 2. 高度攀升進度
    this.altitude += this.climbRate * deltaSec;
    this.updateHUD();

    // 3. 通關判定
    if (this.altitude >= this.maxAltitude) {
      this.triggerVictory();
      return;
    }

    // 4. 生成障礙物 (隨高度加速生成頻率)
    this.spawnCooldown -= delta;
    const spawnInterval = Math.max(300, 800 - Math.floor(this.altitude / 3));
    if (this.spawnCooldown <= 0) {
      this.spawnCooldown = spawnInterval;
      this.spawnObstacle();
    }

    // 5. 更新障礙物下落與碰撞
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += obs.speed * deltaSec;
      if (obs.charText) obs.charText.setY(obs.y);

      // 檢查是否與星艦碰撞 (AABB bounding box)
      const distX = Math.abs(obs.x - this.shipX);
      const distY = Math.abs(obs.y - this.shipY);
      if (distX < (obs.width + this.shipWidth) / 2 && distY < (obs.height + this.shipHeight) / 2) {
        // 受到碰撞傷害
        this.hullHp -= 15;
        this.shipText.setColor('#ef4444');
        this.scene.time.delayedCall(100, () => {
          this.shipText.setColor('#38bdf8');
        });

        // 銷毀此障礙
        if (obs.charText) obs.charText.destroy();
        this.obstacles.splice(i, 1);

        this.updateHUD();

        // 墜毀判定
        if (this.hullHp <= 0) {
          this.triggerCrash();
          return;
        }
        continue;
      }

      // 移出底端者銷毀
      if (obs.y > this.viewHeight + 20) {
        if (obs.charText) obs.charText.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  private spawnObstacle(): void {
    const spawnX = Phaser.Math.Between(40, this.viewWidth - 40);
    const spawnY = 40;
    const chars = ['♦', '●', '✦', '▲', '✖'];
    const char = chars[Math.floor(Math.random() * chars.length)];
    const speed = Phaser.Math.Between(150, 260) + Math.floor(this.altitude / 6);

    const txt = this.scene.add.text(
      spawnX,
      spawnY,
      char,
      createTextStyle('16px', '#f97316', true)
    );
    txt.setOrigin(0.5);
    this.add(txt);

    this.obstacles.push({
      x: spawnX,
      y: spawnY,
      width: 18,
      height: 18,
      speed,
      charText: txt
    });
  }

  private triggerCrash(): void {
    this.isFlying = false;
    this.clearObstacles();
    this.crashContainer.setVisible(true);
  }

  private triggerVictory(): void {
    this.isFlying = false;
    this.clearObstacles();
    this.victoryContainer.setVisible(true);

    const state = (this.scene as any).gameState as GameData;
    if (state && state.starship) {
      state.starship.clearedEscape = true;
    }
  }
}
