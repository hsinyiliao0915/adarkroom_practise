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
        resources: { wood: 500, iron: 100 }
      });

      // Wagon requires workshop
      const result = craftSys.craft(state, 'wagon');
      assert.strictEqual(result, false);
      assert.strictEqual(state.resources.wagon || 0, 0);
      assert.strictEqual(state.resources.wood, 500); // Resources untouched
    });

    test('craft should allow cart and compass without workshop', () => {
      const state = createMockGameState({
        buildings: { workshop: 0 },
        resources: { wood: 30, scales: 15, teeth: 10, fur: 30 }
      });

      // Cart craftable early
      const cartResult = craftSys.craft(state, 'cart');
      assert.strictEqual(cartResult, true);
      assert.strictEqual(state.resources.cart, 1);
      assert.strictEqual(state.resources.wood, 0);

      // Compass craftable with hunting loot without workshop
      const compassResult = craftSys.craft(state, 'compass');
      assert.strictEqual(compassResult, true);
      assert.strictEqual(state.resources.compass, 1);
      assert.strictEqual(state.resources.scales, 0);
      assert.strictEqual(state.resources.teeth, 0);
      assert.strictEqual(state.resources.fur, 0);
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

    test('assignWorker should reject assignment if requiredBuilding exists but requiredLandmark is uncleared', () => {
      const state = createMockGameState({
        population: 5,
        buildings: { workshop: 1 },
        workers: { ironMiners: 0 },
        clearedLandmarks: [] // iron_mine_1 not cleared
      });

      const result = villageSys.assignWorker(state, 'ironMiners', 1);
      assert.strictEqual(result, false);
      assert.strictEqual(state.workers.ironMiners, 0);
    });

    test('assignWorker should succeed for ironMiners when landmark is cleared', () => {
      const state = createMockGameState({
        population: 5,
        buildings: { workshop: 1 },
        workers: { ironMiners: 0 },
        clearedLandmarks: ['iron_mine_1']
      });

      const result = villageSys.assignWorker(state, 'ironMiners', 1);
      assert.strictEqual(result, true);
      assert.strictEqual(state.workers.ironMiners, 1);
    });

    test('lodge should reject building if huts < 1 and succeed if huts >= 1', () => {
      const state = createMockGameState({
        buildings: { huts: 0, lodge: 0 },
        resources: { wood: 500, fur: 50, meat: 50 }
      });

      assert.strictEqual(villageSys.build(state, 'lodge'), false);

      state.buildings.huts = 1;
      assert.strictEqual(villageSys.build(state, 'lodge'), true);
      assert.strictEqual(state.buildings.lodge, 1);
      assert.strictEqual(state.resources.wood, 300);
    });

    test('getNumGatherers should dynamically calculate remaining unassigned villagers', () => {
      const state = createMockGameState({
        population: 8,
        buildings: { lodge: 1 },
        workers: { hunters: 2, trappers: 2 }
      });

      assert.strictEqual(villageSys.getNumGatherers(state), 4);

      villageSys.assignWorker(state, 'hunters', 1);
      assert.strictEqual(state.workers.hunters, 3);
      assert.strictEqual(villageSys.getNumGatherers(state), 3);
    });

    test('max traps 10 should reject additional construction', () => {
      const state = createMockGameState({
        buildings: { traps: 10 },
        resources: { wood: 1000 }
      });

      const result = villageSys.build(state, 'traps');
      assert.strictEqual(result, false);
      assert.strictEqual(state.buildings.traps, 10);
    });
  });
});
