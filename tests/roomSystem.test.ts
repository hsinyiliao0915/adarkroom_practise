import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RoomSystem } from '../src/systems/RoomSystem.ts';
import { createMockGameState } from './helpers/mockState.ts';

describe('RoomSystem & Opening Progression (1:1 ADR)', () => {
  let roomSys: RoomSystem;

  beforeEach(() => {
    roomSys = RoomSystem.getInstance();
    roomSys.resetTimers();
  });

  test('lightFire should start burning without granting wood or unlocking forest', () => {
    const state = createMockGameState({
      fireState: 'dead',
      fireFuel: 0,
      warmthLevel: 'freezing',
      resources: { wood: 0 },
      unlockedForest: false
    });

    const lit = roomSys.lightFire(state);
    assert.strictEqual(lit, true);
    assert.strictEqual(state.fireState, 'burning');
    assert.strictEqual(state.resources.wood, 0, 'Wood must remain 0 on fire light');
    assert.strictEqual(state.unlockedForest, false, 'Forest must not unlock immediately on fire light');
    assert.strictEqual(state.unlockedTabs.forest, false, 'Forest tab must not unlock immediately');
  });

  test('stokeFire should be free before forest is unlocked', () => {
    const state = createMockGameState({
      fireState: 'burning',
      fireFuel: 30,
      resources: { wood: 0 },
      unlockedForest: false
    });

    const stoked = roomSys.stokeFire(state);
    assert.strictEqual(stoked, true);
    assert.strictEqual(state.resources.wood, 0, 'Wood should not be deducted when free');
    assert.strictEqual(state.fireFuel, 60);
  });

  test('opening progression sequence: stranger arrives at ~8s, forest unlocks at ~20s with 4 wood', () => {
    const state = createMockGameState({
      fireState: 'dead',
      fireFuel: 0,
      warmthLevel: 'freezing',
      resources: { wood: 0 },
      unlockedForest: false,
      strangerState: 'none'
    });

    // 1. Light fire
    roomSys.lightFire(state);
    assert.strictEqual(state.strangerState, 'none');
    assert.strictEqual(state.unlockedForest, false);

    // 2. Tick 5 seconds (not arrived yet)
    roomSys.tick(state, 5);
    assert.strictEqual(state.strangerState, 'none');
    assert.strictEqual(state.unlockedForest, false);

    // 3. Tick another 3.5 seconds (total > 8s -> stranger collapses)
    roomSys.tick(state, 3.5);
    assert.strictEqual(state.strangerState, 'sleeping');
    assert.strictEqual(state.unlockedForest, false, 'Forest should not unlock when stranger arrives');
    assert.strictEqual(state.resources.wood, 0);

    // 4. Tick 6 seconds into forest timer (12s total needed)
    roomSys.tick(state, 6);
    assert.strictEqual(state.unlockedForest, false);
    assert.strictEqual(state.resources.wood, 0);

    // 5. Tick another 6.5 seconds (forest unlock timer expires)
    roomSys.tick(state, 6.5);
    assert.strictEqual(state.unlockedForest, true, 'Forest must be unlocked now');
    assert.strictEqual(state.unlockedTabs.forest, true);
    assert.strictEqual(state.resources.wood, 4, 'Initial wood must be 4 upon forest unlock');
  });

  test('stokeFire after forest is unlocked should require and consume wood', () => {
    const state = createMockGameState({
      fireState: 'burning',
      fireFuel: 50,
      resources: { wood: 4 },
      unlockedForest: true
    });

    // Stoke with wood
    const stoked = roomSys.stokeFire(state);
    assert.strictEqual(stoked, true);
    assert.strictEqual(state.resources.wood, 3);
    assert.strictEqual(state.fireFuel, 75);

    // Drain wood to 0
    state.resources.wood = 0;
    const failStoke = roomSys.stokeFire(state);
    assert.strictEqual(failStoke, false);
  });

  test('stranger wakes up and becomes builder once room is warm over stages', () => {
    const state = createMockGameState({
      fireState: 'burning',
      fireFuel: 80,
      warmthLevel: 'warm',
      resources: { wood: 10 },
      unlockedForest: true,
      strangerState: 'sleeping'
    });

    // Stage 1 -> Stage 2 (15s)
    roomSys.tick(state, 16);
    assert.strictEqual(state.strangerState, 'sleeping');

    // Stage 2 -> Stage 3 (15s)
    roomSys.tick(state, 16);
    assert.strictEqual(state.strangerState, 'sleeping');

    // Stage 3 -> Awake as builder (15s)
    roomSys.tick(state, 16);
    assert.strictEqual(state.strangerState, 'awake');
    assert.strictEqual(state.unlockedBuilder, true);
    assert.strictEqual(state.unlockedTabs.village, true);
  });
});
