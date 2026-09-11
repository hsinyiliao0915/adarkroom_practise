import Phaser from 'phaser';
import { MainScene } from '../scenes/MainScene';
import { ThemeManager } from './ThemeManager';

export const GAME_LANDSCAPE_WIDTH = 1050;
export const GAME_LANDSCAPE_HEIGHT = 720;
export const GAME_PORTRAIT_WIDTH = 480;
export const GAME_PORTRAIT_HEIGHT = 854;

export const isInitialPortrait = typeof window !== 'undefined' && (window.innerWidth < window.innerHeight || window.innerWidth <= 768);

export const GAME_WIDTH = isInitialPortrait ? GAME_PORTRAIT_WIDTH : GAME_LANDSCAPE_WIDTH;
export const GAME_HEIGHT = isInitialPortrait ? GAME_PORTRAIT_HEIGHT : GAME_LANDSCAPE_HEIGHT;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: ThemeManager.getInstance().getTheme().gameBgCss,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [MainScene]
};
