import Phaser from 'phaser';
import { GameData, SaveMetadata } from '../core/GameState';
import { SaveManager } from '../core/SaveManager';
import { RoomSystem } from '../systems/RoomSystem';
import { EventBus, Events } from '../core/EventBus';
import { TextButton } from './TextButton';
import { createTextStyle } from '../config/typography';
import { ThemeManager } from '../config/ThemeManager';

export class SaveLoadModal extends Phaser.GameObjects.Container {
  private bgBackdrop: Phaser.GameObjects.Rectangle;
  private modalBg: Phaser.GameObjects.Rectangle;
  private modalBorder: Phaser.GameObjects.Rectangle;

  private titleText: Phaser.GameObjects.Text;
  private currentSaveText: Phaser.GameObjects.Text;
  private listLabel: Phaser.GameObjects.Text;
  private divider: Phaser.GameObjects.Rectangle;

  private quickSaveBtn: TextButton;
  private createNewSaveBtn: TextButton;
  private newGameBtn: TextButton;
  private closeBtn: TextButton;

  private slotContainers: Phaser.GameObjects.Container[] = [];
  private unsubTheme?: () => void;

  constructor(scene: Phaser.Scene, width: number = 620, height: number = 540) {
    const cameraWidth = scene.cameras.main.width;
    const cameraHeight = scene.cameras.main.height;
    super(scene, cameraWidth / 2, cameraHeight / 2);

    const theme = ThemeManager.getInstance().getTheme();

    // 背景遮罩
    this.bgBackdrop = scene.add.rectangle(0, 0, cameraWidth, cameraHeight, theme.modalBackdropHex, theme.modalBackdropAlpha);
    this.bgBackdrop.setInteractive();
    this.bgBackdrop.on('pointerdown', () => this.hide());
    if (this.bgBackdrop.input) this.bgBackdrop.input.enabled = false;

    // 彈窗背景與邊框
    this.modalBg = scene.add.rectangle(0, 0, width, height, theme.modalBgHex, 0.98);
    this.modalBorder = scene.add.rectangle(0, 0, width, height);
    this.modalBorder.setStrokeStyle(1, theme.modalBorderHex);
    this.modalBorder.setFillStyle(0x000000, 0);

    // 標題
    this.titleText = scene.add.text(
      0,
      -height / 2 + 30,
      '── 冒險存檔與進度管理 ──',
      createTextStyle('15px', theme.textPrimary, false, { align: 'center' })
    );
    this.titleText.setOrigin(0.5);

    // 當前槽位
    this.currentSaveText = scene.add.text(
      0,
      -height / 2 + 60,
      '目前使用中的存檔：載入中...',
      createTextStyle('12px', '#94a3b8', false, { align: 'center' })
    );
    this.currentSaveText.setOrigin(0.5);

    // 操作功能按鈕區
    const topBtnY = -height / 2 + 100;

    this.quickSaveBtn = new TextButton(scene, -180, topBtnY, {
      text: '覆蓋儲存',
      width: 110,
      height: 32,
      fontSize: '12px',
      onClick: () => this.handleQuickSave(scene)
    });

    this.createNewSaveBtn = new TextButton(scene, -45, topBtnY, {
      text: '建立新存檔',
      width: 120,
      height: 32,
      fontSize: '12px',
      onClick: () => this.handleCreateNamedSave(scene)
    });

    this.newGameBtn = new TextButton(scene, 100, topBtnY, {
      text: '開啟新遊戲',
      width: 120,
      height: 32,
      fontSize: '12px',
      onClick: () => this.handleNewGame(scene)
    });

    this.closeBtn = new TextButton(scene, 220, topBtnY, {
      text: '關閉',
      width: 80,
      height: 32,
      fontSize: '12px',
      onClick: () => this.hide()
    });

    this.divider = scene.add.rectangle(0, -height / 2 + 135, width - 40, 1, theme.modalDividerHex);

    this.listLabel = scene.add.text(
      -width / 2 + 30,
      -height / 2 + 148,
      '【 本機歷史存檔列表 】（最多保留 10 份）',
      createTextStyle('12px', theme.textPrimary, true)
    );

    this.add([
      this.bgBackdrop,
      this.modalBg,
      this.modalBorder,
      this.titleText,
      this.currentSaveText,
      this.quickSaveBtn,
      this.createNewSaveBtn,
      this.newGameBtn,
      this.closeBtn,
      this.divider,
      this.listLabel
    ]);

    this.unsubTheme = EventBus.getInstance().on(Events.THEME_CHANGED, () => {
      if (this.visible) this.refreshSlots(scene);
    });

    this.on('destroy', () => {
      if (this.unsubTheme) this.unsubTheme();
    });

    this.setVisible(false);
    this.setDepth(200);
    scene.add.existing(this);
  }

  public show(scene: Phaser.Scene): void {
    this.setVisible(true);
    if (this.bgBackdrop.input) this.bgBackdrop.input.enabled = true;
    this.refreshSlots(scene);
  }

  public hide(): void {
    this.setVisible(false);
    if (this.bgBackdrop.input) this.bgBackdrop.input.enabled = false;
  }

  private refreshSlots(scene: Phaser.Scene): void {
    // 清除既有 slot 項目
    for (const c of this.slotContainers) {
      c.destroy();
    }
    this.slotContainers = [];

    const theme = ThemeManager.getInstance().getTheme();
    this.modalBg.setFillStyle(theme.modalBgHex, 0.98);
    this.modalBorder.setStrokeStyle(1, theme.modalBorderHex);
    this.bgBackdrop.setFillStyle(theme.modalBackdropHex, theme.modalBackdropAlpha);
    this.titleText.setColor(theme.textPrimary);
    this.listLabel.setColor(theme.textPrimary);
    this.divider.setFillStyle(theme.modalDividerHex);

    const activeId = SaveManager.getInstance().getActiveSaveId();
    const saves = SaveManager.getInstance().listSaves();

    const activeMeta = saves.find((s) => s.id === activeId);
    if (activeMeta) {
      this.currentSaveText.setText(`目前遊玩進度：【${activeMeta.name}】（第 ${activeMeta.days} 天）`);
    } else {
      this.currentSaveText.setText(`目前遊玩進度：【預設存檔】`);
    }
    this.currentSaveText.setColor(theme.textSecondary);

    const startY = -100;
    const itemHeight = 62;

    saves.slice(0, 5).forEach((meta, idx) => {
      const rowY = startY + idx * itemHeight;
      const rowContainer = scene.add.container(0, rowY);

      const isCurrent = meta.id === activeId;
      const rowBg = scene.add.rectangle(0, 0, 560, 54, theme.modalSlotBgHex, isCurrent ? 0.95 : 0.6);
      const rowBorder = scene.add.rectangle(0, 0, 560, 54);
      rowBorder.setStrokeStyle(1, isCurrent ? theme.underlineHex : theme.modalBorderHex);
      rowBorder.setFillStyle(0, 0);

      const nameText = scene.add.text(
        -265,
        -18,
        `${isCurrent ? '▶ ' : ''}${meta.name}`,
        createTextStyle('13px', theme.textPrimary, true)
      );

      const d = new Date(meta.updatedAt);
      const timeStr = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      const descText = scene.add.text(
        -265,
        4,
        `${meta.summary || ''}  |  更新時間: ${timeStr}`,
        createTextStyle('11px', theme.textSecondary)
      );

      // 載入按鈕
      const loadBtn = new TextButton(scene, 185, 0, {
        text: '載入',
        width: 60,
        height: 28,
        fontSize: '11px',
        onClick: () => this.handleLoadSlot(scene, meta)
      });

      // 刪除按鈕
      const deleteBtn = new TextButton(scene, 245, 0, {
        text: '刪除',
        width: 50,
        height: 28,
        fontSize: '11px',
        onClick: () => this.handleDeleteSlot(scene, meta)
      });

      rowContainer.add([rowBg, rowBorder, nameText, descText, loadBtn, deleteBtn]);
      this.add(rowContainer);
      this.slotContainers.push(rowContainer);
    });

    if (saves.length === 0) {
      const emptyText = scene.add.text(
        0,
        0,
        '目前尚無已儲存的槽位記錄，點擊上方按鈕建立新存檔。',
        createTextStyle('12px', '#64748b', false, { align: 'center' })
      );
      emptyText.setOrigin(0.5);
      const emptyContainer = scene.add.container(0, 0);
      emptyContainer.add(emptyText);
      this.add(emptyContainer);
      this.slotContainers.push(emptyContainer);
    }
  }

  private handleQuickSave(scene: Phaser.Scene): void {
    const state = (scene as any).gameState as GameData;
    if (!state) return;

    const res = SaveManager.getInstance().saveSlot(state);
    if (res.success) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `進度已成功儲存至【${res.metadata?.name}】。`, 'info');
      this.refreshSlots(scene);
    } else {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `存檔失敗：${res.error || '未知錯誤'}`, 'warn');
      window.alert(`存檔失敗：${res.error || '未知錯誤'}`);
    }
  }

  private handleCreateNamedSave(scene: Phaser.Scene): void {
    const state = (scene as any).gameState as GameData;
    if (!state) return;

    const defaultName = `荒野探險紀錄 (${new Date().toLocaleDateString()})`;
    const customName = window.prompt('輸入新存檔名稱：', defaultName);

    if (customName && customName.trim()) {
      const res = SaveManager.getInstance().createSave(state, customName.trim());
      if (res.success) {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `已建立新存檔【${res.metadata?.name}】。`, 'info');
        this.refreshSlots(scene);
      } else {
        EventBus.getInstance().emit(Events.LOG_MESSAGE, `建立存檔失敗：${res.error || '未知錯誤'}`, 'warn');
        window.alert(`建立存檔失敗：${res.error || '未知錯誤'}`);
      }
    }
  }

  private handleLoadSlot(scene: Phaser.Scene, meta: SaveMetadata): void {
    if (window.confirm(`確定要載入【${meta.name}】嗎？未儲存的當前進度將會遺失。`)) {
      const loaded = SaveManager.getInstance().load(meta.id);
      (scene as any).gameState = loaded;
      RoomSystem.getInstance().resetTimers();
      (scene as any).resourcePanel?.resetDiscovered(loaded);
      (scene as any).switchTab(loaded.activeTab || 'room');
      (scene as any).logPanel?.initFromState(loaded);
      (scene as any).refreshUI();
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `已成功載入存檔【${meta.name}】。`, 'story');
      this.hide();
    }
  }

  private handleDeleteSlot(scene: Phaser.Scene, meta: SaveMetadata): void {
    if (window.confirm(`確定要永久刪除存檔【${meta.name}】嗎？此動作無法復原。`)) {
      SaveManager.getInstance().deleteSave(meta.id);
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `存檔【${meta.name}】已刪除。`, 'info');
      this.refreshSlots(scene);
    }
  }

  private handleNewGame(scene: Phaser.Scene): void {
    if (window.confirm('確定要開啟新遊戲嗎？現有歷史存檔將完整保留，系統將為你建立全新開局。')) {
      const newGame = SaveManager.getInstance().startNewGame();
      (scene as any).gameState = newGame.state;
      RoomSystem.getInstance().resetTimers();
      (scene as any).resourcePanel?.resetDiscovered(newGame.state);
      (scene as any).switchTab('room');
      (scene as any).logPanel?.initFromState(newGame.state);
      (scene as any).refreshUI();
      EventBus.getInstance().emit(Events.LOG_MESSAGE, `已開啟全新冒險【${newGame.metadata.name}】！房間寒冷刺骨，火堆熄滅了。`, 'story');
      this.hide();
    }
  }
}
