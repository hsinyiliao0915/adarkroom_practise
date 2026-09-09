import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { GameData } from '../core/GameState';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';

export class LogPanel extends Phaser.GameObjects.Container {
  private textEntries: Phaser.GameObjects.Text[] = [];
  private maxPoolSize: number = 35;
  private panelHeight: number;
  private logItems: Array<{ text: string; type: string }> = [];
  private unsubTheme?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 300, height: number = 660) {
    super(scene, x, y);
    this.panelHeight = height;

    // Clean minimal floating log panel (no inner box borders)
    // Create pool of text entries (position will be dynamically set in renderLogs)

    for (let i = 0; i < this.maxPoolSize; i++) {
      const entryText = scene.add.text(
        14,
        0,
        '',
        createTextStyle('12px', '#e2e8f0', false, {
          wordWrap: { width: width - 28, useAdvancedWrap: true },
          lineSpacing: 4
        })
      );
      entryText.setVisible(false);
      this.textEntries.push(entryText);
      this.add(entryText);
    }

    // Subscribe to log events
    EventBus.getInstance().on(Events.LOG_MESSAGE, (text: string, type?: string) => {
      this.addLogMessage(text, type);
    });

    this.unsubTheme = EventBus.getInstance().on(Events.THEME_CHANGED, () => {
      this.renderLogs();
    });

    this.on('destroy', () => {
      if (this.unsubTheme) this.unsubTheme();
    });

    scene.add.existing(this);
  }

  public initFromState(state: GameData): void {
    if (state && Array.isArray(state.logs)) {
      this.logItems = [...state.logs].reverse().map((l) => ({
        text: l.text,
        type: l.type || 'info'
      }));
    }
    this.renderLogs();
  }

  public addLogMessage(text: string, type: string = 'info'): void {
    this.logItems.unshift({ text, type });
    if (this.logItems.length > 50) {
      this.logItems.pop();
    }

    const state = (this.scene as any).gameState as GameData;
    if (state && Array.isArray(state.logs)) {
      state.logs.push({
        text,
        time: Date.now(),
        type: type as any
      });
      if (state.logs.length > 50) {
        state.logs.shift();
      }
    }

    this.renderLogs();
  }

  private renderLogs(): void {
    const startY = 14;
    const maxBottomY = this.panelHeight - 16;
    let currentY = startY;

    const theme = ThemeManager.getInstance().getTheme();
    const colorMap: Record<string, string> = {
      story: theme.logStory,
      event: theme.logEvent,
      warn: theme.logWarn,
      info: theme.logInfo
    };

    for (let i = 0; i < this.textEntries.length; i++) {
      const entryText = this.textEntries[i];

      if (i < this.logItems.length && currentY < maxBottomY) {
        const item = this.logItems[i];
        entryText.setText(item.text);
        entryText.setColor(colorMap[item.type] || theme.logInfo);
        entryText.setY(currentY);
        entryText.setVisible(true);

        if (i === 0) entryText.setAlpha(1.0);
        else if (i < 3) entryText.setAlpha(0.85);
        else if (i < 7) entryText.setAlpha(0.65);
        else if (i < 12) entryText.setAlpha(0.45);
        else entryText.setAlpha(0.25);

        // Dynamically advance Y by the actual measured height of this entry plus margin
        currentY += entryText.height + 8;
      } else {
        entryText.setVisible(false);
        entryText.setText('');
      }
    }
  }
}
