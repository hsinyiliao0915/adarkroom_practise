import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';

function initGame(): void {
  new Phaser.Game(gameConfig);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
