import Phaser from 'phaser';
import { createTextStyle } from '../config/typography';
import { TextButton } from './TextButton';
import { TickEngine } from '../core/TickEngine';

export class SpeedModal extends Phaser.GameObjects.Container {
  private bgBackdrop: Phaser.GameObjects.Rectangle;
  private shadowRect: Phaser.GameObjects.Rectangle;
  private modalBg: Phaser.GameObjects.Rectangle;
  private modalBorder: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private confirmBtn: TextButton;
  private cancelBtn: TextButton;

  private modalWidth: number = 380;
  private modalHeight: number = 180;
  private onConfirmCallback?: () => void;

  constructor(scene: Phaser.Scene) {
    const cameraWidth = scene.cameras.main.width;
    const cameraHeight = scene.cameras.main.height;
    super(scene, cameraWidth / 2, cameraHeight / 2);

    // 1. Semi-transparent backdrop
    this.bgBackdrop = scene.add.rectangle(0, 0, cameraWidth, cameraHeight, 0x000000, 0.65);
    this.bgBackdrop.setInteractive();
    this.bgBackdrop.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event?.stopPropagation();
    });

    // 2. Drop shadow
    this.shadowRect = scene.add.rectangle(4, 4, this.modalWidth, this.modalHeight, 0x000000, 0.45);

    // 3. Modal background (solid dark gray matching media_1789049957116.png)
    this.modalBg = scene.add.rectangle(0, 0, this.modalWidth, this.modalHeight, 0x383838, 1.0);

    // 4. Modal border (1px crisp border)
    this.modalBorder = scene.add.rectangle(0, 0, this.modalWidth, this.modalHeight);
    this.modalBorder.setStrokeStyle(1, 0x888888, 1.0);
    this.modalBorder.setFillStyle(0x000000, 0);

    // 5. Title Text (Top Left)
    this.titleText = scene.add.text(
      -this.modalWidth / 2 + 20,
      -this.modalHeight / 2 + 16,
      '要加速麼？',
      createTextStyle('15px', '#ffffff', true)
    );

    // 6. Message Body Text
    this.messageText = scene.add.text(
      -this.modalWidth / 2 + 20,
      -this.modalHeight / 2 + 48,
      '開啟加速模式將會使遊戲速度變為原有的2倍。\n你確定要加速嗎？',
      createTextStyle('13px', '#e2e8f0', false, { lineSpacing: 8 })
    );

    // 7. Buttons: [ 是 ] and [ 否 ]
    this.confirmBtn = new TextButton(scene, -this.modalWidth / 4, this.modalHeight / 2 - 32, {
      width: 120,
      height: 32,
      text: '是',
      fontSize: '13px',
      onClick: () => {
        if (this.onConfirmCallback) {
          this.onConfirmCallback();
        }
        this.hide();
      }
    });

    this.cancelBtn = new TextButton(scene, this.modalWidth / 4, this.modalHeight / 2 - 32, {
      width: 120,
      height: 32,
      text: '否',
      fontSize: '13px',
      onClick: () => {
        this.hide();
      }
    });

    this.add([
      this.bgBackdrop,
      this.shadowRect,
      this.modalBg,
      this.modalBorder,
      this.titleText,
      this.messageText,
      this.confirmBtn,
      this.cancelBtn
    ]);

    this.setDepth(300);
    this.setVisible(false);

    scene.add.existing(this);
  }

  public show(onConfirm: () => void): void {
    this.onConfirmCallback = onConfirm;
    const currentMultiplier = TickEngine.getInstance().getSpeedMultiplier();

    if (currentMultiplier > 1) {
      this.titleText.setText('要減速麼？');
      this.messageText.setText('關閉加速模式將會使遊戲速度恢復為原有的1倍。\n你確定要減速嗎？');
    } else {
      this.titleText.setText('要加速麼？');
      this.messageText.setText('開啟加速模式將會使遊戲速度變為原有的2倍。\n你確定要加速嗎？');
    }

    this.setVisible(true);
  }

  public hide(): void {
    this.setVisible(false);
  }
}
