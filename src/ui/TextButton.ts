import Phaser from 'phaser';
import { createTextStyle } from '../config/typography';

export interface TextButtonConfig {
  text: string;
  width?: number;
  height?: number;
  fontSize?: string;
  cooldownMs?: number;
  onClick?: () => void;
}

export class TextButton extends Phaser.GameObjects.Container {
  private bgRect: Phaser.GameObjects.Rectangle;
  private borderRect: Phaser.GameObjects.Rectangle;
  private cooldownRect: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  
  private isButtonEnabled: boolean = true;
  private isCooldown: boolean = false;
  private cooldownDuration: number = 0;
  private cooldownRemaining: number = 0;
  private onClickCallback?: () => void;
  private btnWidth: number;
  private btnHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: TextButtonConfig) {
    super(scene, x, y);

    this.btnWidth = config.width || 180;
    this.btnHeight = config.height || 36;
    this.cooldownDuration = config.cooldownMs || 0;
    this.onClickCallback = config.onClick;

    // Background (transparent by default)
    this.bgRect = scene.add.rectangle(0, 0, this.btnWidth, this.btnHeight, 0x000000, 0.01);
    this.bgRect.setOrigin(0.5);

    // Cooldown overlay (slides horizontally from left with soft white overlay)
    this.cooldownRect = scene.add.rectangle(-this.btnWidth / 2, 0, 0, this.btnHeight, 0xffffff, 0.25);
    this.cooldownRect.setOrigin(0, 0.5);

    // Border (1px crisp line)
    this.borderRect = scene.add.rectangle(0, 0, this.btnWidth, this.btnHeight);
    this.borderRect.setStrokeStyle(1, 0xffffff, 0.85);
    this.borderRect.setFillStyle(0x000000, 0);
    this.borderRect.setOrigin(0.5);

    // Text label with clean typography
    this.label = scene.add.text(
      0,
      0,
      config.text,
      createTextStyle(config.fontSize || '13px', '#ffffff', false, { align: 'center' })
    );
    this.label.setOrigin(0.5);

    this.add([this.bgRect, this.cooldownRect, this.borderRect, this.label]);

    // Interactivity
    this.bgRect.setInteractive({ useHandCursor: true });
    this.bgRect.on('pointerover', this.onPointerOver, this);
    this.bgRect.on('pointerout', this.onPointerOut, this);
    this.bgRect.on('pointerdown', this.onPointerDown, this);

    scene.add.existing(this);
  }

  private onPointerOver(): void {
    if (!this.isButtonEnabled || this.isCooldown) return;
    // Invert colors on hover (original A Dark Room style)
    this.bgRect.setFillStyle(0xffffff, 0.95);
    this.borderRect.setStrokeStyle(1, 0xffffff);
    this.label.setColor('#0a0a0a');
  }

  private onPointerOut(): void {
    if (!this.isButtonEnabled || this.isCooldown) return;
    this.bgRect.setFillStyle(0x000000, 0.01);
    this.borderRect.setStrokeStyle(1, 0xffffff, 0.85);
    this.label.setColor('#ffffff');
  }

  private onPointerDown(): void {
    if (!this.isButtonEnabled || this.isCooldown) return;

    if (this.onClickCallback) {
      this.onClickCallback();
    }

    if (this.cooldownDuration > 0) {
      this.triggerCooldown(this.cooldownDuration);
    }
  }

  public triggerCooldown(durationMs: number): void {
    this.isCooldown = true;
    this.cooldownDuration = durationMs;
    this.cooldownRemaining = durationMs;
    this.updateVisualState();
  }

  public setEnabled(enabled: boolean): void {
    this.isButtonEnabled = enabled;
    this.updateVisualState();
  }

  public setText(text: string): void {
    this.label.setText(text);
  }

  public setCooldown(durationMs: number): void {
    this.cooldownDuration = durationMs;
  }

  public update(delta: number): void {
    if (this.isCooldown) {
      this.cooldownRemaining -= delta;
      if (this.cooldownRemaining <= 0) {
        this.isCooldown = false;
        this.cooldownRemaining = 0;
        this.cooldownRect.width = 0;
        this.updateVisualState();
      } else {
        const progress = 1 - this.cooldownRemaining / this.cooldownDuration;
        this.cooldownRect.width = this.btnWidth * progress;
      }
    }
  }

  private updateVisualState(): void {
    if (!this.isButtonEnabled) {
      this.bgRect.setFillStyle(0x000000, 0.01);
      this.borderRect.setStrokeStyle(1, 0x475569, 0.4);
      this.label.setColor('#556070');
      this.bgRect.disableInteractive();
    } else if (this.isCooldown) {
      this.bgRect.setFillStyle(0x000000, 0.01);
      this.borderRect.setStrokeStyle(1, 0x64748b, 0.6);
      this.label.setColor('#94a3b8');
      this.bgRect.disableInteractive();
    } else {
      this.bgRect.setFillStyle(0x000000, 0.01);
      this.borderRect.setStrokeStyle(1, 0xffffff, 0.85);
      this.label.setColor('#ffffff');
      this.bgRect.setInteractive({ useHandCursor: true });
    }
  }
}
