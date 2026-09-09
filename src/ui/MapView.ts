import Phaser from 'phaser';
import { GameData } from '../core/GameState';
import { MapSystem, SPAWN_POINT } from '../systems/MapSystem';
import { TextButton } from './TextButton';
import { createTextStyle } from '../config/typography';

export class MapView extends Phaser.GameObjects.Container {
  // Prep container
  private prepContainer: Phaser.GameObjects.Container;
  private meatTakeCount: number = 10;
  private torchTakeCount: number = 2;
  private prepMeatText: Phaser.GameObjects.Text;
  private prepTorchText: Phaser.GameObjects.Text;
  private prepWaterText: Phaser.GameObjects.Text;
  private prepWeaponText: Phaser.GameObjects.Text;
  private embarkBtn: TextButton;

  // Active Map container
  private mapContainer: Phaser.GameObjects.Container;
  private hpText: Phaser.GameObjects.Text;
  private waterText: Phaser.GameObjects.Text;
  private suppliesText: Phaser.GameObjects.Text;
  private weaponText: Phaser.GameObjects.Text;
  private locationText: Phaser.GameObjects.Text;
  private gridText: Phaser.GameObjects.Text;

  // D-Pad
  private btnNorth: TextButton;
  private btnSouth: TextButton;
  private btnWest: TextButton;
  private btnEast: TextButton;
  private scavengeBtn: TextButton;
  private returnBtn: TextButton;

  // Combat container
  private combatContainer: Phaser.GameObjects.Container;
  private combatEnemyName: Phaser.GameObjects.Text;
  private combatEnemyHp: Phaser.GameObjects.Text;
  private combatLogText: Phaser.GameObjects.Text;
  private attackBtn: TextButton;
  private fleeBtn: TextButton;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private moveCooldown: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // 1. Preparation Screen
    this.prepContainer = scene.add.container(0, 0);

    const prepTitle = scene.add.text(
      20,
      15,
      '── 荒野遠征：行囊整裝 ──',
      createTextStyle('14px', '#38bdf8')
    );

    const prepDesc = scene.add.text(
      20,
      45,
      '踏入無邊荒野需要攜帶足夠的肉乾與水壺。\n每移動一步消耗 1 水量；缺水時消耗肉乾，斷糧將迅速衰竭而亡。',
      createTextStyle('11px', '#94a3b8')
    );

    // Meat selection
    const meatLabel = scene.add.text(
      20,
      100,
      '攜帶肉乾：',
      createTextStyle('13px', '#e2e8f0')
    );

    const meatMinus = new TextButton(scene, 130, 108, {
      text: '-5',
      width: 32,
      height: 24,
      fontSize: '11px',
      onClick: () => {
        this.meatTakeCount = Math.max(0, this.meatTakeCount - 5);
        this.updatePrepDisplay(scene);
      }
    });

    this.prepMeatText = scene.add.text(
      165,
      102,
      '10',
      createTextStyle('13px', '#facc15', true)
    );

    const meatPlus = new TextButton(scene, 210, 108, {
      text: '+5',
      width: 32,
      height: 24,
      fontSize: '11px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          const maxPossible = state.resources.curedMeat || 0;
          this.meatTakeCount = Math.min(maxPossible, this.meatTakeCount + 5);
          this.updatePrepDisplay(scene);
        }
      }
    });

    // Torch selection
    const torchLabel = scene.add.text(
      20,
      140,
      '攜帶火把：',
      createTextStyle('13px', '#e2e8f0')
    );

    const torchMinus = new TextButton(scene, 130, 148, {
      text: '-1',
      width: 32,
      height: 24,
      fontSize: '11px',
      onClick: () => {
        this.torchTakeCount = Math.max(0, this.torchTakeCount - 1);
        this.updatePrepDisplay(scene);
      }
    });

    this.prepTorchText = scene.add.text(
      165,
      142,
      '2',
      createTextStyle('13px', '#facc15', true)
    );

    const torchPlus = new TextButton(scene, 210, 148, {
      text: '+1',
      width: 32,
      height: 24,
      fontSize: '11px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          const maxPossible = state.resources.torches || 0;
          this.torchTakeCount = Math.min(maxPossible, this.torchTakeCount + 1);
          this.updatePrepDisplay(scene);
        }
      }
    });

    this.prepWaterText = scene.add.text(
      20,
      185,
      '水壺滿載容量：10 單位 (自動裝滿清泉)',
      createTextStyle('12px', '#60a5fa')
    );

    this.prepWeaponText = scene.add.text(
      20,
      215,
      '預計裝備武器：赤手空拳',
      createTextStyle('12px', '#a78bfa')
    );

    this.embarkBtn = new TextButton(scene, 140, 270, {
      text: '踏上荒野探索之路',
      width: 240,
      height: 40,
      fontSize: '14px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          MapSystem.getInstance().startExpedition(state, this.meatTakeCount, this.torchTakeCount);
        }
      }
    });

    this.prepContainer.add([
      prepTitle,
      prepDesc,
      meatLabel,
      meatMinus,
      this.prepMeatText,
      meatPlus,
      torchLabel,
      torchMinus,
      this.prepTorchText,
      torchPlus,
      this.prepWaterText,
      this.prepWeaponText,
      this.embarkBtn
    ]);

    // 2. Active Exploration Map Screen
    this.mapContainer = scene.add.container(0, 0);

    this.hpText = scene.add.text(
      20,
      10,
      '生命值: 20 / 20',
      createTextStyle('12px', '#ef4444')
    );

    this.waterText = scene.add.text(
      170,
      10,
      '水壺: 10 / 10',
      createTextStyle('12px', '#38bdf8')
    );

    this.suppliesText = scene.add.text(
      290,
      10,
      '肉乾: 10 | 火把: 2',
      createTextStyle('12px', '#facc15')
    );

    this.weaponText = scene.add.text(
      20,
      32,
      '武器: 鋼劍',
      createTextStyle('11px', '#c084fc')
    );

    this.locationText = scene.add.text(
      170,
      32,
      '位置: 荒野 (20, 20)',
      createTextStyle('11px', '#94a3b8')
    );

    // ASCII Map Grid Display
    const mapBoxBg = scene.add.rectangle(20, 55, 280, 280, 0x090a0f);
    mapBoxBg.setOrigin(0);
    const mapBoxBorder = scene.add.rectangle(20, 55, 280, 280);
    mapBoxBorder.setStrokeStyle(1, 0x334155);
    mapBoxBorder.setFillStyle(0x000000, 0);
    mapBoxBorder.setOrigin(0);

    this.gridText = scene.add.text(
      32,
      65,
      '',
      createTextStyle('16px', '#e2e8f0', true, { lineSpacing: 4 })
    );

    // Movement D-Pad Controls
    const dpadCenterX = 380;
    const dpadCenterY = 160;

    this.btnNorth = new TextButton(scene, dpadCenterX, dpadCenterY - 45, {
      text: '↑ 北',
      width: 60,
      height: 32,
      onClick: () => this.tryMove(0, -1, scene)
    });

    this.btnSouth = new TextButton(scene, dpadCenterX, dpadCenterY + 45, {
      text: '↓ 南',
      width: 60,
      height: 32,
      onClick: () => this.tryMove(0, 1, scene)
    });

    this.btnWest = new TextButton(scene, dpadCenterX - 55, dpadCenterY, {
      text: '← 西',
      width: 50,
      height: 32,
      onClick: () => this.tryMove(-1, 0, scene)
    });

    this.btnEast = new TextButton(scene, dpadCenterX + 55, dpadCenterY, {
      text: '→ 東',
      width: 50,
      height: 32,
      onClick: () => this.tryMove(1, 0, scene)
    });

    this.scavengeBtn = new TextButton(scene, 380, 240, {
      text: '搜索此地標',
      width: 140,
      height: 32,
      fontSize: '12px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          MapSystem.getInstance().scavengeLandmark(state);
        }
      }
    });

    this.returnBtn = new TextButton(scene, 380, 280, {
      text: '返回安全屋',
      width: 140,
      height: 32,
      fontSize: '12px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          MapSystem.getInstance().returnHome(state);
        }
      }
    });

    const legendText = scene.add.text(
      20,
      345,
      '圖例：@ 你  A 聚落  I 鐵礦  C 煤礦  V 小鎮  O 哨所  R 遺跡  ★ 星艦  . 步道',
      createTextStyle('10px', '#64748b')
    );

    this.mapContainer.add([
      this.hpText,
      this.waterText,
      this.suppliesText,
      this.weaponText,
      this.locationText,
      mapBoxBg,
      mapBoxBorder,
      this.gridText,
      this.btnNorth,
      this.btnSouth,
      this.btnWest,
      this.btnEast,
      this.scavengeBtn,
      this.returnBtn,
      legendText
    ]);

    // 3. Combat Modal
    this.combatContainer = scene.add.container(0, 0);

    const combatBg = scene.add.rectangle(20, 50, 440, 300, 0x181014, 0.98);
    combatBg.setOrigin(0);
    const combatBorder = scene.add.rectangle(20, 50, 440, 300);
    combatBorder.setStrokeStyle(2, 0xe11d48);
    combatBorder.setFillStyle(0x000000, 0);
    combatBorder.setOrigin(0);

    const combatTitle = scene.add.text(
      35,
      65,
      '── 遭遇戰鬥！ ──',
      createTextStyle('15px', '#f43f5e')
    );

    this.combatEnemyName = scene.add.text(
      35,
      95,
      '遭遇敵人：狂暴野狗',
      createTextStyle('13px', '#f8fafc')
    );

    this.combatEnemyHp = scene.add.text(
      35,
      120,
      '敵人生命值：12 / 12',
      createTextStyle('12px', '#fb7185')
    );

    this.attackBtn = new TextButton(scene, 110, 165, {
      text: '發動攻擊',
      width: 140,
      height: 36,
      fontSize: '13px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          MapSystem.getInstance().attackEnemy(state);
        }
      }
    });

    this.fleeBtn = new TextButton(scene, 270, 165, {
      text: '嘗試逃跑 (60%)',
      width: 140,
      height: 36,
      fontSize: '13px',
      onClick: () => {
        const state = (scene as any).gameState as GameData;
        if (state) {
          MapSystem.getInstance().fleeCombat(state);
        }
      }
    });

    this.combatLogText = scene.add.text(
      35,
      205,
      '',
      createTextStyle('11px', '#cbd5e1', false, {
        lineSpacing: 4,
        wordWrap: { width: 410, useAdvancedWrap: true }
      })
    );

    this.combatContainer.add([
      combatBg,
      combatBorder,
      combatTitle,
      this.combatEnemyName,
      this.combatEnemyHp,
      this.attackBtn,
      this.fleeBtn,
      this.combatLogText
    ]);

    this.add([this.prepContainer, this.mapContainer, this.combatContainer]);

    // Keyboard bindings
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
    }

    scene.add.existing(this);
  }

  private tryMove(dx: number, dy: number, scene: Phaser.Scene): void {
    const state = (scene as any).gameState as GameData;
    if (state && state.expedition.active && !state.expedition.inCombat) {
      MapSystem.getInstance().move(state, dx, dy);
    }
  }

  public updateDisplay(state: GameData): void {
    if (!state.expedition.active) {
      this.prepContainer.setVisible(true);
      this.mapContainer.setVisible(false);
      this.combatContainer.setVisible(false);
      this.updatePrepDisplay(this.scene);
    } else {
      this.prepContainer.setVisible(false);
      this.mapContainer.setVisible(true);

      if (state.expedition.inCombat) {
        this.combatContainer.setVisible(true);
        this.updateCombatDisplay(state);
      } else {
        this.combatContainer.setVisible(false);
      }

      this.updateActiveMapDisplay(state);
    }
  }

  private updatePrepDisplay(scene: Phaser.Scene): void {
    const state = (scene as any).gameState as GameData;
    if (!state) return;

    this.meatTakeCount = Math.min(state.resources.curedMeat || 0, this.meatTakeCount);
    this.torchTakeCount = Math.min(state.resources.torches || 0, this.torchTakeCount);

    this.prepMeatText.setText(`${this.meatTakeCount} (庫存: ${Math.floor(state.resources.curedMeat || 0)})`);
    this.prepTorchText.setText(`${this.torchTakeCount} (庫存: ${Math.floor(state.resources.torches || 0)})`);

    const maxWater = 10 + (state.resources.canteenLevel || 0) * 15;
    this.prepWaterText.setText(`水壺滿載容量：${maxWater} 單位 (遠征出發時自動裝滿清泉)`);

    let weaponName = '赤手空拳 (威力 2)';
    if (state.resources.rifle > 0 && state.resources.bullets > 0) weaponName = `獵槍 (威力 25, 剩餘子彈 ${state.resources.bullets})`;
    else if (state.resources.steelSword > 0) weaponName = '精鋼長劍 (威力 12)';
    else if (state.resources.ironSword > 0) weaponName = '鋒利鐵劍 (威力 6)';
    else if (state.resources.boneSpear > 0) weaponName = '獸骨長矛 (威力 3)';

    this.prepWeaponText.setText(`預計裝備武器：${weaponName}`);
    this.embarkBtn.setEnabled(true);
  }

  private updateActiveMapDisplay(state: GameData): void {
    const exp = state.expedition;
    this.hpText.setText(`生命值: ${exp.hp} / ${exp.maxHp}`);
    this.waterText.setText(`水壺: ${exp.water} / ${exp.maxWater}`);
    this.suppliesText.setText(`肉乾: ${exp.curedMeat} | 火把: ${exp.torches}`);

    const weaponNames: Record<string, string> = {
      fists: '拳頭 (2)',
      boneSpear: '骨矛 (3)',
      ironSword: '鐵劍 (6)',
      steelSword: '鋼劍 (12)',
      rifle: `步槍 (${exp.bullets})`
    };
    this.weaponText.setText(`武器: ${weaponNames[exp.weapon] || '無'}`);
    this.locationText.setText(`座標: (${exp.x}, ${exp.y})`);

    // Scavenge & Return button status
    const currentLandmark = MapSystem.getInstance().getLandmarkAt(exp.x, exp.y);
    const isCleared = currentLandmark ? state.clearedLandmarks.includes(currentLandmark.id) : false;

    if (currentLandmark && !isCleared) {
      this.scavengeBtn.setVisible(true);
      this.scavengeBtn.setText(`搜索【${currentLandmark.name}】`);
    } else {
      this.scavengeBtn.setVisible(false);
    }

    const isAtHome = exp.x === SPAWN_POINT.x && exp.y === SPAWN_POINT.y;
    this.returnBtn.setVisible(isAtHome);

    // Render 11x11 ASCII Grid
    this.renderAsciiMap(state);
  }

  private renderAsciiMap(state: GameData): void {
    const exp = state.expedition;
    const viewRadius = 5; // 11x11
    const lines: string[] = [];

    const landmarks = MapSystem.getInstance().getLandmarks();

    for (let dy = -viewRadius; dy <= viewRadius; dy++) {
      let line = '';
      for (let dx = -viewRadius; dx <= viewRadius; dx++) {
        const wx = exp.x + dx;
        const wy = exp.y + dy;

        if (wx < 0 || wx >= 41 || wy < 0 || wy >= 41) {
          line += ' # ';
          continue;
        }

        if (dx === 0 && dy === 0) {
          line += ' @ '; // Player
          continue;
        }

        const key = `${wx},${wy}`;
        const isVisited = state.visitedTiles.includes(key);

        if (wx === SPAWN_POINT.x && wy === SPAWN_POINT.y) {
          line += ' A '; // Village
        } else {
          const lm = landmarks.find((l) => l.x === wx && l.y === wy);
          if (lm) {
            const symMap: Record<string, string> = {
              iron_mine: ' I ',
              coal_mine: ' C ',
              abandoned_town: ' V ',
              outpost: ' O ',
              ruined_city: ' R ',
              cave: ' X ',
              crashed_starship: ' ★ '
            };
            line += isVisited ? symMap[lm.type] || ' ? ' : ' · ';
          } else if (isVisited) {
            line += ' . ';
          } else {
            line += '   '; // Fog
          }
        }
      }
      lines.push(line);
    }

    this.gridText.setText(lines.join('\n'));
  }

  private updateCombatDisplay(state: GameData): void {
    const enemy = state.expedition.enemy;
    if (!enemy) return;

    this.combatEnemyName.setText(`遭遇敵人：${enemy.name}`);
    this.combatEnemyHp.setText(`敵人生命值：${Math.max(0, enemy.hp)} / ${enemy.maxHp}`);

    const logs = state.expedition.combatLog.slice(-4);
    this.combatLogText.setText(logs.join('\n'));
  }

  public update(delta: number): void {
    this.moveCooldown -= delta;

    if (this.moveCooldown <= 0) {
      if (this.cursors && this.wasdKeys) {
        if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
          this.tryMove(0, -1, this.scene);
          this.moveCooldown = 220;
        } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
          this.tryMove(0, 1, this.scene);
          this.moveCooldown = 220;
        } else if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
          this.tryMove(-1, 0, this.scene);
          this.moveCooldown = 220;
        } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
          this.tryMove(1, 0, this.scene);
          this.moveCooldown = 220;
        }
      }
    }
  }
}
