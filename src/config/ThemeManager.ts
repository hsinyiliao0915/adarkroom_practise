import { EventBus, Events } from '../core/EventBus';

export type ThemeMode = 'dark' | 'light';

export interface ThemePalette {
  mode: ThemeMode;
  
  // 1. Outer screen background (body / page)
  outerBgCss: string;
  
  // 2. Game container (canvas & border)
  gameBgCss: string;
  gameBgHex: number;
  gameBorderCss: string;
  gameBorderHex: number;
  
  // Text Colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Tab Underline & Separator
  underlineHex: number;
  tabSepColor: string;
  
  // Log message colors
  logStory: string;
  logEvent: string;
  logWarn: string;
  logInfo: string;
  
  // Button Colors
  btnBorderHex: number;
  btnBorderAlpha: number;
  btnText: string;
  btnBgNormalHex: number;
  btnBgNormalAlpha: number;
  btnBgHoverHex: number;
  btnBgHoverAlpha: number;
  btnTextHover: string;
  btnDisabledBorderHex: number;
  btnDisabledText: string;
  btnCooldownOverlayHex: number;
  btnCooldownOverlayAlpha: number;
  
  // Resource Panel (Stores)
  storesOutlineHex: number;
  storesOutlineAlpha: number;
  storesTitleBg: string;
  
  // Modal dialogs
  modalBgHex: number;
  modalBorderHex: number;
  modalBackdropHex: number;
  modalBackdropAlpha: number;
  modalDividerHex: number;
  modalSlotBgHex: number;
}

export const DARK_THEME: ThemePalette = {
  mode: 'dark',
  // Outer frame: solid medium-dark slate gray
  outerBgCss: '#262930',
  
  // Game canvas frame: pure black
  gameBgCss: '#000000',
  gameBgHex: 0x000000,
  gameBorderCss: '#3f4450',
  gameBorderHex: 0x3f4450,
  
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  
  underlineHex: 0xffffff,
  tabSepColor: '#475569',
  
  logStory: '#f6ad55', // warm gold
  logEvent: '#60a5fa', // bright blue
  logWarn: '#f87171',  // soft red
  logInfo: '#e2e8f0',  // crisp white
  
  btnBorderHex: 0xffffff,
  btnBorderAlpha: 0.85,
  btnText: '#ffffff',
  btnBgNormalHex: 0x000000,
  btnBgNormalAlpha: 0.01,
  btnBgHoverHex: 0xffffff,
  btnBgHoverAlpha: 0.95,
  btnTextHover: '#000000',
  btnDisabledBorderHex: 0x475569,
  btnDisabledText: '#556070',
  btnCooldownOverlayHex: 0xffffff,
  btnCooldownOverlayAlpha: 0.25,
  
  storesOutlineHex: 0xffffff,
  storesOutlineAlpha: 0.4,
  storesTitleBg: '#000000',
  
  modalBgHex: 0x111317,
  modalBorderHex: 0x475569,
  modalBackdropHex: 0x000000,
  modalBackdropAlpha: 0.7,
  modalDividerHex: 0x334155,
  modalSlotBgHex: 0x1e2430
};

export const LIGHT_THEME: ThemePalette = {
  mode: 'light',
  // Outer frame: solid clean medium-light gray
  outerBgCss: '#cfd4dc',
  
  // Game canvas frame: pure white
  gameBgCss: '#ffffff',
  gameBgHex: 0xffffff,
  gameBorderCss: '#9ca3af',
  gameBorderHex: 0x9ca3af,
  
  textPrimary: '#000000',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  
  underlineHex: 0x000000,
  tabSepColor: '#9ca3af',
  
  logStory: '#c2410c', // rich warm amber/brown
  logEvent: '#1d4ed8', // deep blue
  logWarn: '#dc2626',  // deep red
  logInfo: '#111827',  // crisp black
  
  btnBorderHex: 0x000000,
  btnBorderAlpha: 0.85,
  btnText: '#000000',
  btnBgNormalHex: 0xffffff,
  btnBgNormalAlpha: 0.01,
  btnBgHoverHex: 0x000000,
  btnBgHoverAlpha: 0.95,
  btnTextHover: '#ffffff',
  btnDisabledBorderHex: 0xd1d5db,
  btnDisabledText: '#9ca3af',
  btnCooldownOverlayHex: 0x000000,
  btnCooldownOverlayAlpha: 0.2,
  
  storesOutlineHex: 0x000000,
  storesOutlineAlpha: 0.4,
  storesTitleBg: '#ffffff',
  
  modalBgHex: 0xf8fafc,
  modalBorderHex: 0x94a3b8,
  modalBackdropHex: 0x000000,
  modalBackdropAlpha: 0.4,
  modalDividerHex: 0xe2e8f0,
  modalSlotBgHex: 0xe2e8f0
};

export class ThemeManager {
  private static instance: ThemeManager;
  private currentMode: ThemeMode = 'dark';

  private constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('adarkroom_theme');
        if (saved === 'light' || saved === 'dark') {
          this.currentMode = saved;
        }
      } catch {
        // Fallback to dark
      }
    }
    this.applyDomTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public getTheme(): ThemePalette {
    return this.currentMode === 'light' ? LIGHT_THEME : DARK_THEME;
  }

  public getMode(): ThemeMode {
    return this.currentMode;
  }

  public toggleTheme(): ThemeMode {
    this.currentMode = this.currentMode === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('adarkroom_theme', this.currentMode);
      } catch {
        // Ignore
      }
    }
    this.applyDomTheme();
    EventBus.getInstance().emit(Events.THEME_CHANGED, this.getTheme());
    return this.currentMode;
  }

  public applyDomTheme(): void {
    const theme = this.getTheme();
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme.outerBgCss;
      const container = document.getElementById('game-container');
      if (container) {
        container.style.backgroundColor = theme.gameBgCss;
        container.style.borderColor = theme.gameBorderCss;
      }
    }
  }
}
