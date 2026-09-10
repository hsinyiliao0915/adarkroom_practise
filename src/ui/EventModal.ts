import Phaser from 'phaser';
import { GameData } from '../core/GameState';
import { EventBus, Events } from '../core/EventBus';
import { StoryEventSystem, ActiveEventState } from '../systems/StoryEventSystem';
import { StoryChoice } from '../data/storyEvents';
import { TextButton } from './TextButton';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';

export class EventModal extends Phaser.GameObjects.Container {
  private bgBackdrop: Phaser.GameObjects.Rectangle;
  private shadowRect: Phaser.GameObjects.Rectangle;
  private modalBg: Phaser.GameObjects.Rectangle;
  private modalBorder: Phaser.GameObjects.Rectangle;

  private titleText: Phaser.GameObjects.Text;
  private contentContainer: Phaser.GameObjects.Container;
  private buttonContainer: Phaser.GameObjects.Container;

  private currentButtons: TextButton[] = [];
  private unsubTriggered?: () => void;
  private unsubUpdated?: () => void;
  private unsubClosed?: () => void;
  private unsubTheme?: () => void;

  private modalWidth: number = 440;
  private modalHeight: number = 240;

  constructor(scene: Phaser.Scene) {
    const cameraWidth = scene.cameras.main.width;
    const cameraHeight = scene.cameras.main.height;
    super(scene, cameraWidth / 2, cameraHeight / 2);

    const theme = ThemeManager.getInstance().getTheme();

    // 1. Semi-transparent backdrop to block clicks behind modal
    this.bgBackdrop = scene.add.rectangle(
      0,
      0,
      cameraWidth,
      cameraHeight,
      0x000000,
      0.65
    );
    this.bgBackdrop.setInteractive();
    // Clicking backdrop does NOT close modal (player must make a choice)
    this.bgBackdrop.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event?.stopPropagation();
    });

    // 2. Drop shadow for elevation
    this.shadowRect = scene.add.rectangle(
      4,
      4,
      this.modalWidth,
      this.modalHeight,
      0x000000,
      0.45
    );

    // 3. Modal solid gray background (matches authentic ADR screenshot media_1788955019030.png)
    this.modalBg = scene.add.rectangle(
      0,
      0,
      this.modalWidth,
      this.modalHeight,
      theme.eventModalBgHex,
      1.0
    );

    // 4. Modal 1px border
    this.modalBorder = scene.add.rectangle(0, 0, this.modalWidth, this.modalHeight);
    this.modalBorder.setStrokeStyle(1, theme.eventModalBorderHex, 1.0);
    this.modalBorder.setFillStyle(0x000000, 0);

    // 5. Title Text (Top Left)
    this.titleText = scene.add.text(
      -this.modalWidth / 2 + 25,
      -this.modalHeight / 2 + 22,
      '',
      createTextStyle('16px', theme.eventModalText, true, { align: 'left' })
    );

    // 6. Story description content container
    this.contentContainer = scene.add.container(0, 0);

    // 7. Buttons container
    this.buttonContainer = scene.add.container(0, 0);

    this.add([
      this.bgBackdrop,
      this.shadowRect,
      this.modalBg,
      this.modalBorder,
      this.titleText,
      this.contentContainer,
      this.buttonContainer
    ]);

    this.setDepth(150); // Above all standard scene elements
    this.setVisible(false);

    // Subscribe to EventBus
    this.unsubTriggered = EventBus.getInstance().on(
      Events.STORY_EVENT_TRIGGERED,
      (data: ActiveEventState) => this.renderEvent(data)
    );

    this.unsubUpdated = EventBus.getInstance().on(
      Events.STORY_EVENT_UPDATED,
      (data: ActiveEventState) => this.renderEvent(data)
    );

    this.unsubClosed = EventBus.getInstance().on(
      Events.STORY_EVENT_CLOSED,
      () => this.hide()
    );

    this.unsubTheme = EventBus.getInstance().on(
      Events.THEME_CHANGED,
      () => this.updateTheme()
    );

    this.on('destroy', () => {
      if (this.unsubTriggered) this.unsubTriggered();
      if (this.unsubUpdated) this.unsubUpdated();
      if (this.unsubClosed) this.unsubClosed();
      if (this.unsubTheme) this.unsubTheme();
      this.clearButtons();
    });

    scene.add.existing(this);
  }

  public renderEvent(data: ActiveEventState): void {
    const theme = ThemeManager.getInstance().getTheme();
    const { event, scene } = data;

    this.titleText.setText(event.title);

    // Clear previous content
    this.contentContainer.removeAll(true);
    this.clearButtons();

    // Render multi-line narrative description
    const startY = -this.modalHeight / 2 + 65;
    let currentY = startY;

    scene.text.forEach((line) => {
      const lineText = this.scene.add.text(
        -this.modalWidth / 2 + 25,
        currentY,
        line,
        createTextStyle('15px', theme.eventModalText, false, {
          align: 'left',
          wordWrap: { width: this.modalWidth - 50 }
        })
      );
      this.contentContainer.add(lineText);
      currentY += 28;
    });

    // Render action buttons at bottom
    const buttonKeys = Object.keys(scene.buttons);
    const numButtons = buttonKeys.length;

    const btnY = this.modalHeight / 2 - 38;
    const btnHeight = 36;

    if (numButtons === 1) {
      const key = buttonKeys[0];
      const choice = scene.buttons[key];
      const btn = this.createButton(0, btnY, 140, btnHeight, key, choice);
      this.buttonContainer.add(btn);
      this.currentButtons.push(btn);
    } else if (numButtons === 2) {
      const btnWidth = 130;
      const gap = 20;
      const x1 = -(btnWidth / 2 + gap / 2);
      const x2 = btnWidth / 2 + gap / 2;

      const btn1 = this.createButton(x1, btnY, btnWidth, btnHeight, buttonKeys[0], scene.buttons[buttonKeys[0]]);
      const btn2 = this.createButton(x2, btnY, btnWidth, btnHeight, buttonKeys[1], scene.buttons[buttonKeys[1]]);

      this.buttonContainer.add([btn1, btn2]);
      this.currentButtons.push(btn1, btn2);
    } else {
      // 3 or 4 buttons: distribute evenly or pack compactly
      const btnWidth = Math.min(130, Math.floor((this.modalWidth - 40 - (numButtons - 1) * 10) / numButtons));
      const totalWidth = numButtons * btnWidth + (numButtons - 1) * 10;
      let startX = -totalWidth / 2 + btnWidth / 2;

      buttonKeys.forEach((key) => {
        const choice = scene.buttons[key];
        const btn = this.createButton(startX, btnY, btnWidth, btnHeight, key, choice);
        this.buttonContainer.add(btn);
        this.currentButtons.push(btn);
        startX += btnWidth + 10;
      });
    }

    this.setVisible(true);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    key: string,
    choice: StoryChoice
  ): TextButton {
    const mainScene = this.scene as any;
    const gameState: GameData = mainScene.gameState;

    const canAfford = StoryEventSystem.getInstance().canAffordChoice(choice, gameState);

    let label = choice.text;
    if (choice.cost) {
      const costParts: string[] = [];
      if (choice.cost.wood) costParts.push(`${choice.cost.wood}木`);
      if (choice.cost.fur) costParts.push(`${choice.cost.fur}皮`);
      if (choice.cost.meat) costParts.push(`${choice.cost.meat}生肉`);
      if (choice.cost.curedMeat) costParts.push(`${choice.cost.curedMeat}熟肉`);
      if (costParts.length > 0) {
        label = `${choice.text} (${costParts.join(',')})`;
      }
    }

    const btn = new TextButton(this.scene, x, y, {
      text: label,
      width,
      height,
      fontSize: '13px',
      onClick: () => {
        StoryEventSystem.getInstance().selectChoice(key, gameState);
      }
    });

    if (!canAfford) {
      btn.setEnabled(false);
    }

    return btn;
  }

  private clearButtons(): void {
    this.currentButtons.forEach((btn) => btn.destroy());
    this.currentButtons = [];
    this.buttonContainer.removeAll(true);
  }

  public hide(): void {
    this.setVisible(false);
    this.clearButtons();
    this.contentContainer.removeAll(true);
  }

  private updateTheme(): void {
    const theme = ThemeManager.getInstance().getTheme();
    this.modalBg.setFillStyle(theme.eventModalBgHex, 1.0);
    this.modalBorder.setStrokeStyle(1, theme.eventModalBorderHex, 1.0);
    this.titleText.setColor(theme.eventModalText);
  }
}
