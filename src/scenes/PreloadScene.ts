import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    // Directly transition to MainScene
    this.scene.start('MainScene');
  }
}
