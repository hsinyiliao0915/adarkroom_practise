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
  getTooltip?: () => Array<{ name: string; amount: number | string }> | string | null;
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
  private getTooltipCallback?: () => Array<{ name: string; amount: number | string }> | string | null;
  private btnWidth: number;
  private btnHeight: number;
  private unsubTheme?: () => void;

  // Tooltip popup
  private tooltipContainer?: Phaser.GameObjects.Container;
  private tooltipBg?: Phaser.GameObjects.Rectangle;
  private tooltipRows: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, config: TextButtonConfig) {
    super(scene, x, y);

    this.btnWidth = config.width || 180;
    this.btnHeight = config.height || 36;
    this.cooldownDuration = config.cooldownMs || 0;
    this.onClickCallback = config.onClick;
    this.getTooltipCallback = config.getTooltip;

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

    this.bgRect.setInteractive({ useHandCursor: true });
    this.bgRect.on('pointerover', this.onPointerOver, this);
    this.bgRect.on('pointerout', this.onPointerOut, this);
    this.bgRect.on('pointerdown', this.onPointerDown, this);

    this.unsubTheme = EventBus.getInstance().on(Events.THEME_CHANGED, () => {
      this.updateVisualState();
    });

    this.on('destroy', () => {
      if (this.unsubTheme) this.unsubTheme();
      this.hideTooltip();
    });

    scene.add.existing(this);
  }

  public setTooltipProvider(provider: () => Array<{ name: string; amount: number | string }> | string | null): void {
    this.getTooltipCallback = provider;
  }

  private onPointerOver(): void {
    const theme = ThemeManager.getInstance().getTheme();
    if (this.isButtonEnabled && !this.isCooldown) {
      this.bgRect.setFillStyle(theme.btnBgHoverHex, theme.btnBgHoverAlpha);
      this.borderRect.setStrokeStyle(1, theme.btnBorderHex);
      this.label.setColor(theme.btnTextHover);
    }
    this.showTooltip();
  }

  private onPointerOut(): void {
    const theme = ThemeManager.getInstance().getTheme();
    if (this.isButtonEnabled && !this.isCooldown) {
      this.bgRect.setFillStyle(theme.btnBgNormalHex, theme.btnBgNormalAlpha);
      this.borderRect.setStrokeStyle(1, theme.btnBorderHex, theme.btnBorderAlpha);
      this.label.setColor(theme.btnText);
    }
    this.hideTooltip();
  }

  private showTooltip(): void {
    if (!this.getTooltipCallback) return;
    const content = this.getTooltipCallback();
    if (!content) return;

    if (!this.tooltipContainer) {
      this.tooltipContainer = this.scene.add.container(0, 0);
      this.tooltipBg = this.scene.add.rectangle(0, 0, 100, 40, 0x000000, 0.95);
      this.tooltipBg.setStrokeStyle(1, 0x555555, 0.9);
      this.tooltipContainer.add(this.tooltipBg);
      this.add(this.tooltipContainer);
    }

    const isNearRight = this.x > 200;
    const ttX = isNearRight ? -(this.btnWidth / 2 + 10) : (this.btnWidth / 2 + 10);
    this.tooltipContainer.setX(ttX);
    this.tooltipBg!.setOrigin(isNearRight ? 1 : 0, 0.5);

    // Clear old texts
    this.tooltipRows.forEach((t) => t.destroy());
    this.tooltipRows = [];

    const theme = ThemeManager.getInstance().getTheme();

    if (typeof content === 'string') {
      const txt = this.scene.add.text(isNearRight ? -10 : 10, 0, content, createTextStyle('12px', theme.textMuted));
      txt.setOrigin(isNearRight ? 1 : 0, 0.5);
      this.tooltipContainer.add(txt);
      this.tooltipRows.push(txt);

      const w = txt.width + 20;
      const h = txt.height + 12;
      this.tooltipBg!.setSize(w, h);
    } else if (Array.isArray(content) && content.length > 0) {
      let maxW = 80;
      const rowHeight = 20;
      const startY = -((content.length - 1) * rowHeight) / 2;

      content.forEach((item, idx) => {
        const y = startY + idx * rowHeight;
        let keyTxt: Phaser.GameObjects.Text;
        let valTxt: Phaser.GameObjects.Text;

        if (isNearRight) {
          valTxt = this.scene.add.text(-10, y, String(item.amount), createTextStyle('12px', '#ffffff'));
          valTxt.setOrigin(1, 0.5);
          keyTxt = this.scene.add.text(-75, y, item.name, createTextStyle('12px', '#94a3b8'));
          keyTxt.setOrigin(1, 0.5);
        } else {
          keyTxt = this.scene.add.text(10, y, item.name, createTextStyle('12px', '#94a3b8'));
          keyTxt.setOrigin(0, 0.5);
          valTxt = this.scene.add.text(75, y, String(item.amount), createTextStyle('12px', '#ffffff'));
          valTxt.setOrigin(0, 0.5);
        }

        this.tooltipContainer!.add([keyTxt, valTxt]);
        this.tooltipRows.push(keyTxt, valTxt);

        const totalRowW = keyTxt.width + valTxt.width + 30;
        if (totalRowW > maxW) maxW = totalRowW;
      });

      const totalH = content.length * rowHeight + 12;
      this.tooltipBg!.setSize(maxW, totalH);
    }

    this.tooltipContainer.setVisible(true);
    this.tooltipContainer.setDepth(100);
  }

  private hideTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.setVisible(false);
    }
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
      this.bgRect.input.cursor = isClickable ? 'pointer' : 'default';
    }

    if (!this.isButtonEnabled) {
      this.bgRect.setFillStyle(theme.btnBgNormalHex, theme.btnBgNormalAlpha);
      this.borderRect.setStrokeStyle(1, theme.btnDisabledBorderHex, 0.4);
      this.label.setBlendMode(Phaser.BlendModes.NORMAL);
      this.label.setColor(theme.btnDisabledText);
      this.label.setAlpha(0.4);
    } else if (this.isCooldown) {
      this.bgRect.setFillStyle(theme.btnBgNormalHex, theme.btnBgNormalAlpha);
      this.borderRect.setStrokeStyle(1, 0x555555, 0.8);
      this.label.setBlendMode(Phaser.BlendModes.NORMAL);
      this.label.setColor('#555555');
      this.label.setAlpha(0.45);
    } else {
      this.bgRect.setFillStyle(theme.btnBgNormalHex, theme.btnBgNormalAlpha);
      this.borderRect.setStrokeStyle(1, theme.btnBorderHex, theme.btnBorderAlpha);
      this.label.setBlendMode(Phaser.BlendModes.NORMAL);
      this.label.setColor(theme.btnText);
      this.label.setAlpha(1.0);
    }
  }
}
