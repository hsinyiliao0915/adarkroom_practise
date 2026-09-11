import { EventBus, Events } from '../core/EventBus';
import { ThemeManager } from '../config/ThemeManager';
import { DevAutoSystem } from '../systems/DevAutoSystem';
import { TickEngine } from '../core/TickEngine';

export class ExternalToolbar {
  private static instance: ExternalToolbar;

  public static init(): ExternalToolbar {
    if (!ExternalToolbar.instance) {
      ExternalToolbar.instance = new ExternalToolbar();
    }
    return ExternalToolbar.instance;
  }

  private constructor() {
    this.setupListeners();
    this.updateDisplay();
  }

  private setupListeners(): void {
    const btnTheme = document.getElementById('btn-theme');
    const btnAuto = document.getElementById('btn-auto');
    const btnSpeed = document.getElementById('btn-speed');
    const btnSave = document.getElementById('btn-save');
    const btnNewgame = document.getElementById('btn-newgame');

    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        ThemeManager.getInstance().toggleTheme();
      });
    }

    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        DevAutoSystem.getInstance().toggle();
      });
    }

    if (btnSpeed) {
      btnSpeed.addEventListener('click', () => {
        EventBus.getInstance().emit(Events.OPEN_SPEED_MODAL);
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        EventBus.getInstance().emit(Events.OPEN_SAVE_MODAL);
      });
    }

    if (btnNewgame) {
      btnNewgame.addEventListener('click', () => {
        EventBus.getInstance().emit(Events.TRIGGER_NEW_GAME);
      });
    }

    EventBus.getInstance().on(Events.THEME_CHANGED, () => this.updateDisplay());
    EventBus.getInstance().on(Events.AUTO_MODE_CHANGED, () => this.updateDisplay());
    EventBus.getInstance().on(Events.SPEED_CHANGED, () => this.updateDisplay());
  }

  public updateDisplay(): void {
    const theme = ThemeManager.getInstance().getTheme();
    const isAuto = DevAutoSystem.getInstance().isEnabled();
    const speed = TickEngine.getInstance().getSpeedMultiplier();

    const btnTheme = document.getElementById('btn-theme');
    const btnAuto = document.getElementById('btn-auto');
    const btnSpeed = document.getElementById('btn-speed');

    if (btnTheme) {
      btnTheme.textContent = theme.mode === 'dark' ? '[ 開燈 ]' : '[ 熄燈 ]';
      btnTheme.style.color = theme.navText;
    }
    if (btnAuto) {
      btnAuto.textContent = isAuto ? '[ 自動: 開 ]' : '[ 自動: 關 ]';
      btnAuto.style.color = theme.navText;
    }
    if (btnSpeed) {
      btnSpeed.textContent = speed > 1 ? '[ 2倍速 ]' : '[ 加速 ]';
      btnSpeed.style.color = theme.navText;
    }

    const btnSave = document.getElementById('btn-save');
    const btnNewgame = document.getElementById('btn-newgame');
    if (btnSave) btnSave.style.color = theme.navText;
    if (btnNewgame) btnNewgame.style.color = theme.navText;

    const seps = document.querySelectorAll('.tool-sep');
    seps.forEach((s) => {
      (s as HTMLElement).style.color = theme.navSepColor;
    });
  }
}
