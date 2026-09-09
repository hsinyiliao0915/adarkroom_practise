import Phaser from 'phaser';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';
import { EventBus, Events } from '../core/EventBus';

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
  private unsubTheme?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, config: TextButtonConfig) {
    super(scene, x, y);

    this.btnWidth = config.width || 180;
    this.btnHeight = config.height || 36;
    this.cooldownDuration = config.cooldownMs || 0;
    this.onClickCallback = config.onClick;

    const theme = ThemeManager.getInstance().getTheme();

    // Background (transparent by default)
    this.bgRect = scene.add.rectangle(0, 0, this.btnWidth, this.btnHeight, theme.btnBgNormalHex, theme.btnBgNormalAlpha);
    this.bgRect.setOrigin(0.5);

    // Cooldown overlay
    this.cooldownRect = scene.add.rectangle(-this.btnWidth / 2, 0, 0, this.btnHeight, theme.btnCooldownOverlayHex, theme.btnCooldownOverlayAlpha);
    this.cooldownRect.setOrigin(0, 0.5);

    // Border (1px crisp line)
    this.borderRect = scene.add.rectangle(0, 0, this.btnWidth, this.btnHeight);
    this.borderRect.setStrokeStyle(1, theme.btnBorderHex, theme.btnBorderAlpha);
    this.borderRect.setFillStyle(theme.btnBgNormalHex, 0);
    this.borderRect.setOrigin(0.5);

    // Text label with clean typography
    this.label = scene.add.text(
      0,
      0,
      config.text,
      createTextStyle(config.fontSize || '13px', theme.btnText, false, { align: 'center' })
    );
    this.label.setOrigin(0.5);

    this.add([this.bgRect, this.cooldownRect, this.borderRect, this.label]);

    this.setSize(this.btnWidth, this.btnHeight);

    // Interactivity: bgRect origin is 0.5, Phaser automatically shifts local coords by displayOrigin
    // Using default hitArea covers [0..btnWidth, 0..btnHeight], perfectly covering the entire button area
    this.bgRect.setInteractive({ useHandCursor: true });
    this.bgRect.on('pointerover', this.onPointerOver, this);
    this.bgRect.on('pointerout', this.onPointerOut, this);
    this.bgRect.on('pointerdown', this.onPointerDown, this);

    this.unsubTheme = EventBus.getInstance().on(Events.THEME_CHANGED, () => {
      this.updateVisualState();
    });

    this.on('destroy', () => {
      if (this.unsubTheme) this.unsubTheme();
    });

    scene.add.existing(this);
  }

  private onPointerOver(): void {
    if (!this.isButtonEnabled || this.isCooldown) return;
    const theme = ThemeManager.getInstance().getTheme();
    // Invert colors on hover (original A Dark Room style)
    this.bgRect.setFillStyle(theme.btnBgHoverHex, theme.btnBgHoverAlpha);
    this.borderRect.setStrokeStyle(1, theme.btnBorderHex);
    this.label.setColor(theme.btnTextHover);
  }

  private onPointerOut(): void {
    if (!this.isButtonEnabled || this.isCooldown) return;
    const theme = ThemeManager.getInstance().getTheme();
    this.bgRect.setFillStyle(theme.btnBgNormalHex, theme.btnBgNormalAlpha);
    this.borderRect.setStrokeStyle(1, theme.btnBorderHex, theme.btnBorderAlpha);
    this.label.setColor(theme.btnText);
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

  public updateVisualState(): void {
    const theme = ThemeManager.getInstance().getTheme();
    this.cooldownRect.setFillStyle(theme.btnCooldownOverlayHex, theme.btnCooldownOverlayAlpha);

    const isClickable = this.isButtonEnabled && !this.isCooldown;
    if (this.bgRect.input) {
      this.bgRect.input.enabled = isClickable;
      this.bgRect.input.cursor = isClickable ? 'pointer' : 'default';
    }

    if (!this.isButtonEnabled) {
      this.bgRect.setFillStyle(theme.btnBgNormalHex, theme.btnBgNormalAlpha);
      this.borderRect.setStrokeStyle(1, theme.btnDisabledBorderHex, 0.4);
      this.label.setBlendMode(Phaser.BlendModes.NORMAL);
      this.label.setColor(theme.btnDisabledText);
    } else if (this.isCooldown) {
      this.bgRect.setFillStyle(theme.btnBgNormalHex, theme.btnBgNormalAlpha);
      this.borderRect.setStrokeStyle(1, theme.btnBorderHex, 0.8);
      if (theme.mode === 'dark') {
        this.label.setColor('#ffffff');
        this.label.setBlendMode(Phaser.BlendModes.DIFFERENCE);
      } else {
        this.label.setBlendMode(Phaser.BlendModes.NORMAL);
        this.label.setColor(theme.textMuted);
      }
    } else {
      this.bgRect.setFillStyle(theme.btnBgNormalHex, theme.btnBgNormalAlpha);
      this.borderRect.setStrokeStyle(1, theme.btnBorderHex, theme.btnBorderAlpha);
      this.label.setBlendMode(Phaser.BlendModes.NORMAL);
      this.label.setColor(theme.btnText);
    }
  }
}
