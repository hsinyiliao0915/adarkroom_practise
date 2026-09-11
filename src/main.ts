import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { ExternalToolbar } from './ui/ExternalToolbar';

function initGame(): void {
  ExternalToolbar.init();
  new Phaser.Game(gameConfig);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
