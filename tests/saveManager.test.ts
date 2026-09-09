import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SaveManager, LEGACY_SAVE_KEY, SAVE_SLOT_PREFIX, SAVE_INDEX_KEY } from '../src/core/SaveManager.ts';
import { createMockGameState } from './helpers/mockState.ts';
import { setupMockLocalStorage, MockLocalStorage } from './helpers/mockStorage.ts';

describe('SaveManager & State Validation', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = setupMockLocalStorage();
  });

  test('validateAndSanitize should clamp negative resources and NaN to 0', () => {
    const raw: any = {
      resources: {
        wood: -100,
        fur: NaN,
        meat: 50,
        bullets: -5
      },
      population: -2
    };

    const clean = SaveManager.getInstance().validateAndSanitize(raw);
    assert.strictEqual(clean.resources.wood, 0);
    assert.strictEqual(clean.resources.fur, 0);
    assert.strictEqual(clean.resources.meat, 50);
    assert.strictEqual(clean.resources.bullets, 0);
    assert.strictEqual(clean.population, 0);
  });

  test('createSave and listSaves should create distinct named slots', () => {
    const mgr = SaveManager.getInstance();
    const state1 = createMockGameState({ resources: { wood: 100 } });
    const state2 = createMockGameState({ resources: { wood: 500 } });

    const res1 = mgr.createSave(state1, '存檔一號');
    assert.strictEqual(res1.success, true);
    assert.ok(res1.metadata?.id);
    assert.strictEqual(res1.metadata?.name, '存檔一號');

    const res2 = mgr.createSave(state2, '存檔二號');
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.metadata?.name, '存檔二號');

    const list = mgr.listSaves();
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].name, '存檔二號'); // newest first
    assert.strictEqual(list[1].name, '存檔一號');

    // Verify loading specific slot
    const loaded1 = mgr.load(res1.metadata!.id);
    assert.strictEqual(loaded1.resources.wood, 100);

    const loaded2 = mgr.load(res2.metadata!.id);
    assert.strictEqual(loaded2.resources.wood, 500);
  });

  test('startNewGame should create a new slot without overwriting existing saves', () => {
    const mgr = SaveManager.getInstance();
    const oldState = createMockGameState({ resources: { wood: 999 } });
    mgr.createSave(oldState, '舊英雄存檔');

    const newGame = mgr.startNewGame();
    assert.strictEqual(newGame.state.resources.wood, 0);
    assert.ok(newGame.metadata.name.startsWith('新旅途'));

    const list = mgr.listSaves();
    assert.strictEqual(list.length, 2);
    assert.ok(list.some(s => s.name === '舊英雄存檔'));
  });

  test('deleteSave should remove slot payload and update index', () => {
    const mgr = SaveManager.getInstance();
    const state = createMockGameState();
    const created = mgr.createSave(state, '即將刪除的存檔');
    const slotId = created.metadata!.id;

    assert.strictEqual(mgr.listSaves().length, 1);
    const delRes = mgr.deleteSave(slotId);
    assert.strictEqual(delRes, true);
    assert.strictEqual(mgr.listSaves().length, 0);
    assert.strictEqual(mockStorage.getItem(SAVE_SLOT_PREFIX + slotId), null);
  });

  test('legacy save migration should auto-convert old single save into slot_default', () => {
    const mgr = SaveManager.getInstance();
    const oldLegacyData = createMockGameState({ resources: { wood: 777 } });
    mockStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(oldLegacyData));

    const list = mgr.listSaves();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, 'slot_default');
    assert.strictEqual(list[0].name, '旅人記錄 (預設存檔)');

    const loaded = mgr.load('slot_default');
    assert.strictEqual(loaded.resources.wood, 777);
  });
});
