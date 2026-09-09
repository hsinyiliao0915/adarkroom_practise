import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CraftSystem } from '../src/systems/CraftSystem.ts';
import { VillageSystem } from '../src/systems/VillageSystem.ts';
import { createMockGameState } from './helpers/mockState.ts';

describe('System Guards & Domain Invariants', () => {
  let craftSys: CraftSystem;
  let villageSys: VillageSystem;

  beforeEach(() => {
    craftSys = CraftSystem.getInstance();
    villageSys = VillageSystem.getInstance();
  });

  describe('CraftSystem guards', () => {
    test('craft should reject items requiring workshop if workshop is not built', () => {
      const state = createMockGameState({
        buildings: { workshop: 0 },
        resources: { wood: 500, leather: 100 }
      });

      // Cart requires workshop
      const result = craftSys.craft(state, 'cart');
      assert.strictEqual(result, false);
      assert.strictEqual(state.resources.cart || 0, 0);
      assert.strictEqual(state.resources.wood, 500); // Resources untouched
    });

    test('craft should reject items if unlockRequirement is not met', () => {
      const state = createMockGameState({
        buildings: { workshop: 1 },
        resources: { wood: 500, iron: 10 } // boneSpear requires teeth >= 5, but teeth is 0
      });

      const result = craftSys.craft(state, 'boneSpear');
      assert.strictEqual(result, false);
      assert.strictEqual(state.resources.boneSpear || 0, 0);
    });

    test('craft should succeed when all requirements are satisfied', () => {
      const state = createMockGameState({
        buildings: { workshop: 1 },
        resources: { wood: 100, curedMeat: 10 }
      });

      const result = craftSys.craft(state, 'torches');
      assert.strictEqual(result, true);
      assert.strictEqual(state.resources.torches, 1);
      assert.strictEqual(state.resources.wood, 95);
      assert.strictEqual(state.resources.curedMeat, 9);
    });
  });

  describe('VillageSystem guards', () => {
    test('build should reject building if unlockRequirement is unmet', () => {
      const state = createMockGameState({
        buildings: { workshop: 0 },
        resources: { wood: 1000, leather: 200 } // furnace requires iron >= 50, but iron is 0
      });

      const result = villageSys.build(state, 'furnace');
      assert.strictEqual(result, false);
      assert.strictEqual(state.buildings.furnace, 0);
      assert.strictEqual(state.resources.wood, 1000);
    });

    test('build should succeed when unlockRequirement and costs are satisfied', () => {
      const state = createMockGameState({
        buildings: { workshop: 0 },
        resources: { wood: 500, leather: 100 } // workshop requires wood >= 150 && leather >= 30
      });

      const result = villageSys.build(state, 'workshop');
      assert.strictEqual(result, true);
      assert.strictEqual(state.buildings.workshop, 1);
      assert.strictEqual(state.resources.wood, 100);
      assert.strictEqual(state.resources.leather, 0);
    });

    test('assignWorker should reject assignment if requiredBuilding is not built', () => {
      const state = createMockGameState({
        population: 5,
        buildings: { traps: 0 }, // Trapper requires traps
        workers: { trappers: 0 }
      });

      const result = villageSys.assignWorker(state, 'trappers', 1);
      assert.strictEqual(result, false);
      assert.strictEqual(state.workers.trappers, 0);
    });

    test('assignWorker should succeed when requiredBuilding exists and free villagers available', () => {
      const state = createMockGameState({
        population: 5,
        buildings: { traps: 1 },
        workers: { trappers: 0 }
      });

      const result = villageSys.assignWorker(state, 'trappers', 1);
      assert.strictEqual(result, true);
      assert.strictEqual(state.workers.trappers, 1);
    });
  });
});
