import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { GameData } from '../core/GameState';
import { createTextStyle } from '../config/typography';

export class LogPanel extends Phaser.GameObjects.Container {
  private bgRect: Phaser.GameObjects.Rectangle;
  private borderRect: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private textEntries: Phaser.GameObjects.Text[] = [];
  private maxVisibleLines: number = 22;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 300, height: number = 660) {
    super(scene, x, y);

    // Background
    this.bgRect = scene.add.rectangle(0, 0, width, height, 0x12141a, 0.95);
    this.bgRect.setOrigin(0);

    // Border
    this.borderRect = scene.add.rectangle(0, 0, width, height);
    this.borderRect.setStrokeStyle(1, 0x272c38);
    this.borderRect.setFillStyle(0x000000, 0);
    this.borderRect.setOrigin(0);

    // Title
    this.titleText = scene.add.text(
      14,
      14,
      '【 荒野日誌 】',
      createTextStyle('13px', '#94a3b8')
    );

    // Divider
    const divider = scene.add.rectangle(14, 38, width - 28, 1, 0x272c38);
    divider.setOrigin(0);

    this.add([this.bgRect, this.borderRect, this.titleText, divider]);

    // Create pool of text entries
    const startY = 48;
    const lineHeight = 26;

    for (let i = 0; i < this.maxVisibleLines; i++) {
      const entryText = scene.add.text(
        14,
        startY + i * lineHeight,
        '',
        createTextStyle('12px', '#e2e8f0', false, {
          wordWrap: { width: width - 28, useAdvancedWrap: true }
        })
      );
      this.textEntries.push(entryText);
      this.add(entryText);
    }

    // Subscribe to log events
    EventBus.getInstance().on(Events.LOG_MESSAGE, (text: string, type?: string) => {
      this.addLogMessage(text, type);
    });

    scene.add.existing(this);
  }

  public initFromState(state: GameData): void {
    const logs = state.logs.slice(-this.maxVisibleLines);
    this.renderLogs(logs);
  }

  public addLogMessage(text: string, type: string = 'info'): void {
    const colorMap: Record<string, string> = {
      story: '#f6ad55', // warm gold
      event: '#63b3ed', // bright blue
      warn: '#fc8181',  // soft red
      info: '#e2e8f0'   // crisp white/gray
    };

    const newColor = colorMap[type] || '#e2e8f0';

    // Shift text down (newest at top)
    for (let i = this.maxVisibleLines - 1; i > 0; i--) {
      this.textEntries[i].setText(this.textEntries[i - 1].text);
      this.textEntries[i].setColor(this.textEntries[i - 1].style.color);
      this.updateAlphaForIndex(i);
    }

    this.textEntries[0].setText(`> ${text}`);
    this.textEntries[0].setColor(newColor);
    this.textEntries[0].setAlpha(1.0);
  }

  private renderLogs(logs: Array<{ text: string; type?: string }>): void {
    const reversed = [...logs].reverse();
    for (let i = 0; i < this.maxVisibleLines; i++) {
      if (i < reversed.length) {
        const item = reversed[i];
        this.textEntries[i].setText(`> ${item.text}`);
        const color = item.type === 'story' ? '#f6ad55' : item.type === 'event' ? '#63b3ed' : item.type === 'warn' ? '#fc8181' : '#e2e8f0';
        this.textEntries[i].setColor(color);
        this.updateAlphaForIndex(i);
      } else {
        this.textEntries[i].setText('');
      }
    }
  }

  private updateAlphaForIndex(index: number): void {
    if (index === 0) this.textEntries[index].setAlpha(1.0);
    else if (index < 4) this.textEntries[index].setAlpha(0.85);
    else if (index < 8) this.textEntries[index].setAlpha(0.65);
    else if (index < 14) this.textEntries[index].setAlpha(0.45);
    else this.textEntries[index].setAlpha(0.25);
  }
}
