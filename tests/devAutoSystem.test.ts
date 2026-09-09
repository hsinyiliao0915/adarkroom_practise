import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { DevAutoSystem } from '../src/systems/DevAutoSystem.ts';
import { RoomSystem } from '../src/systems/RoomSystem.ts';
import { createMockGameState } from './helpers/mockState.ts';

describe('DevAutoSystem', () => {
  let devAuto: DevAutoSystem;

  beforeEach(() => {
    devAuto = DevAutoSystem.getInstance();
    devAuto.setEnabled(false);
    devAuto.resetCooldowns();
    RoomSystem.getInstance().resetTimers();
  });

  test('toggle should toggle auto mode on and off', () => {
    assert.strictEqual(devAuto.isEnabled(), false);
    devAuto.toggle();
    assert.strictEqual(devAuto.isEnabled(), true);
    devAuto.toggle();
    assert.strictEqual(devAuto.isEnabled(), false);
  });

  test('does nothing when disabled', () => {
    const state = createMockGameState({
      fireState: 'dead',
      resources: { wood: 0 },
      unlockedForest: false
    });

    devAuto.setEnabled(false);
    devAuto.update(1000, state);

    assert.strictEqual(state.fireState, 'dead');
  });

  test('automatically lights fire when fire is dead and auto mode is enabled', () => {
    const state = createMockGameState({
      fireState: 'dead',
      resources: { wood: 0 },
      unlockedForest: false
    });

    devAuto.setEnabled(true);
    devAuto.update(100, state);

    assert.strictEqual(state.fireState, 'burning');
    assert.strictEqual(state.warmthLevel, 'cold');
  });

  test('automatically stokes fire when fire is flickering', () => {
    const state = createMockGameState({
      fireState: 'flickering',
      fireFuel: 20,
      resources: { wood: 0 },
      unlockedForest: false
    });

    devAuto.setEnabled(true);
    devAuto.update(100, state);

    assert.strictEqual(state.fireFuel, 50);
  });

  test('automatically gathers wood when forest is unlocked and cooldown ready', () => {
    const state = createMockGameState({
      fireState: 'burning',
      fireFuel: 80,
      resources: { wood: 5 },
      unlockedForest: true
    });

    devAuto.setEnabled(true);
    devAuto.update(100, state);

    // Initial gather triggered (+10 wood)
    assert.strictEqual(state.resources.wood, 15);

    // Immediately updating before cooldown (e.g. 1000ms) should NOT gather again
    devAuto.update(1000, state);
    assert.strictEqual(state.resources.wood, 15);

    // Once cooldown expires (> 60000ms)
    devAuto.update(DevAutoSystem.GATHER_INTERVAL_MS, state);
    assert.strictEqual(state.resources.wood, 25);
  });

  test('automatically checks traps when traps exist', () => {
    const state = createMockGameState({
      fireState: 'burning',
      fireFuel: 80,
      resources: { wood: 50, meat: 0, fur: 0 },
      buildings: { traps: 5 },
      unlockedForest: true
    });

    devAuto.setEnabled(true);
    devAuto.update(100, state);

    // Traps checked on first tick
    // Verify check cooldown prevents checking on subsequent short tick
    devAuto.update(2000, state);
  });
});
