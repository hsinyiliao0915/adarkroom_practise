import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ResourceSystem } from '../src/systems/ResourceSystem.ts';
import { createMockGameState } from './helpers/mockState.ts';

describe('ResourceSystem & Early Game Economy', () => {
  let resourceSys: ResourceSystem;

  beforeEach(() => {
    resourceSys = ResourceSystem.getInstance();
  });

  test('gatherWood should produce 10 wood base, 50 with cart, and 100 with wagon', () => {
    const state = createMockGameState({
      resources: { wood: 0, cart: 0, wagon: 0 }
    });

    // Base gather
    resourceSys.gatherWood(state);
    assert.strictEqual(state.resources.wood, 10);

    // With cart
    state.resources.wood = 0;
    state.resources.cart = 1;
    resourceSys.gatherWood(state);
    assert.strictEqual(state.resources.wood, 50);

    // With wagon
    state.resources.wood = 0;
    state.resources.wagon = 1;
    resourceSys.gatherWood(state);
    assert.strictEqual(state.resources.wood, 100);
  });

  test('baitTraps should consume meat and increment trapBaitMeat', () => {
    const state = createMockGameState({
      buildings: { traps: 3 },
      resources: { meat: 15 },
      trapBaitMeat: 0
    });

    const success = resourceSys.baitTraps(state, 5);
    assert.strictEqual(success, true);
    assert.strictEqual(state.resources.meat, 10);
    assert.strictEqual(state.trapBaitMeat, 5);

    // Fail when insufficient meat
    const fail = resourceSys.baitTraps(state, 20);
    assert.strictEqual(fail, false);
    assert.strictEqual(state.resources.meat, 10);
    assert.strictEqual(state.trapBaitMeat, 5);
  });

  test('checkTraps should consume bait and yield enhanced resources', () => {
    const state = createMockGameState({
      buildings: { traps: 5 },
      resources: { meat: 0, fur: 0, teeth: 0, scales: 0 },
      trapBaitMeat: 5
    });

    resourceSys.checkTraps(state);

    // 1 bait should be consumed per trap checked
    assert.strictEqual(state.trapBaitMeat, 4);
    // Traps should have caught loot
    const totalCaught = (state.resources.fur || 0) + (state.resources.meat || 0) + (state.resources.scales || 0) + (state.resources.teeth || 0) + (state.resources.cloth || 0);
    assert.ok(totalCaught > 0);
  });

  test('passive wood production should credit builder and unassigned gatherers', () => {
    const state = createMockGameState({
      resources: { wood: 0 },
      strangerState: 'helping',
      population: 4,
      workers: { hunters: 0, trappers: 0, tanners: 0, curedMeatMakers: 0, ironMiners: 0, coalMiners: 0, steelworkers: 0 }
    });

    // Builder gives 2 wood / 10s = 0.2/s
    // 4 gatherers give 4 wood / 10s = 0.4/s
    // Total = 0.6 wood/s => over 10s = 6 wood
    resourceSys.tick(state, 10);
    assert.strictEqual(Math.round(state.resources.wood), 6);
  });
});
