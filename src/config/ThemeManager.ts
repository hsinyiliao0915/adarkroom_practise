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
  eventModalBgHex: number;
  eventModalBorderHex: number;
  eventModalText: string;
  // Utility navigation (top right)
  navText: string;
  navTextHover: string;
  navBgHoverHex: number;
  navBgHoverAlpha: number;
  navSepColor: string;
}

export const DARK_THEME: ThemePalette = {
  mode: 'dark',
  // Outer frame: solid neutral slate gray
  outerBgCss: '#262930',
  
  // Game canvas frame: pure black
  gameBgCss: '#000000',
  gameBgHex: 0x000000,
  gameBorderCss: '#404040',
  gameBorderHex: 0x404040,
  
  textPrimary: '#ffffff',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  
  underlineHex: 0xffffff,
  tabSepColor: '#525252',
  
  // Pure monochrome log levels (distinction purely by alpha)
  logStory: '#ffffff',
  logEvent: '#ffffff',
  logWarn: '#ffffff',
  logInfo: '#ffffff',
  
  btnBorderHex: 0xffffff,
  btnBorderAlpha: 0.85,
  btnText: '#ffffff',
  btnBgNormalHex: 0x000000,
  btnBgNormalAlpha: 0.01,
  btnBgHoverHex: 0xffffff,
  btnBgHoverAlpha: 0.95,
  btnTextHover: '#000000',
  btnDisabledBorderHex: 0x404040,
  btnDisabledText: '#525252',
  btnCooldownOverlayHex: 0xffffff,
  btnCooldownOverlayAlpha: 0.95,
  
  storesOutlineHex: 0xffffff,
  storesOutlineAlpha: 0.35,
  storesTitleBg: '#000000',
  
  modalBgHex: 0x0a0a0a,
  modalBorderHex: 0x404040,
  modalBackdropHex: 0x000000,
  modalBackdropAlpha: 0.75,
  modalDividerHex: 0x262626,
  modalSlotBgHex: 0x171717,
  eventModalBgHex: 0x5a5a5a,
  eventModalBorderHex: 0x1a1a1a,
  eventModalText: '#ffffff',

  navText: '#e5e5e5',
  navTextHover: '#ffffff',
  navBgHoverHex: 0xffffff,
  navBgHoverAlpha: 0.15,
  navSepColor: '#525252'
};

export const LIGHT_THEME: ThemePalette = {
  mode: 'light',
  // Outer frame: solid clean medium-light gray
  outerBgCss: '#cfd4dc',
  
  // Game canvas frame: pure white
  gameBgCss: '#ffffff',
  gameBgHex: 0xffffff,
  gameBorderCss: '#a3a3a3',
  gameBorderHex: 0xa3a3a3,
  
  textPrimary: '#000000',
  textSecondary: '#525252',
  textMuted: '#737373',
  
  underlineHex: 0x000000,
  tabSepColor: '#a3a3a3',
  
  // Pure monochrome log levels
  logStory: '#000000',
  logEvent: '#000000',
  logWarn: '#000000',
  logInfo: '#000000',
  
  btnBorderHex: 0x000000,
  btnBorderAlpha: 0.85,
  btnText: '#000000',
  btnBgNormalHex: 0xffffff,
  btnBgNormalAlpha: 0.01,
  btnBgHoverHex: 0x000000,
  btnBgHoverAlpha: 0.95,
  btnTextHover: '#ffffff',
  btnDisabledBorderHex: 0xd4d4d4,
  btnDisabledText: '#a3a3a3',
  btnCooldownOverlayHex: 0x000000,
  btnCooldownOverlayAlpha: 0.2,
  
  storesOutlineHex: 0x000000,
  storesOutlineAlpha: 0.35,
  storesTitleBg: '#ffffff',
  
  modalBgHex: 0xffffff,
  modalBorderHex: 0xa3a3a3,
  modalBackdropHex: 0x000000,
  modalBackdropAlpha: 0.35,
  modalDividerHex: 0xe5e5e5,
  modalSlotBgHex: 0xf5f5f5,
  eventModalBgHex: 0xd8d8d8,
  eventModalBorderHex: 0x666666,
  eventModalText: '#000000',

  navText: '#262626',
  navTextHover: '#000000',
  navBgHoverHex: 0x000000,
  navBgHoverAlpha: 0.1,
  navSepColor: '#a3a3a3'
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
