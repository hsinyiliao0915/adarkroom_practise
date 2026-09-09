import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { StarshipSystem } from '../src/systems/StarshipSystem.ts';
import { MapSystem } from '../src/systems/MapSystem.ts';
import { SaveManager } from '../src/core/SaveManager.ts';
import { createMockGameState } from './helpers/mockState.ts';
import { setupMockLocalStorage } from './helpers/mockStorage.ts';

describe('StarshipSystem & Endgame Mechanics', () => {
  let starSys: StarshipSystem;

  beforeEach(() => {
    starSys = StarshipSystem.getInstance();
  });

  test('canLaunch requirement gating', () => {
    const state = createMockGameState({
      starship: {
        unlocked: true,
        hullLevel: 0,
        engineLevel: 1,
        clearedEscape: false
      }
    });

    // Hull level 0 cannot launch
    assert.strictEqual(starSys.canLaunch(state), false);

    // Locked ship cannot launch even with hull level >= 1
    state.starship.unlocked = false;
    state.starship.hullLevel = 1;
    assert.strictEqual(starSys.canLaunch(state), false);

    // Unlocked and repaired (hullLevel >= 1) can launch
    state.starship.unlocked = true;
    assert.strictEqual(starSys.canLaunch(state), true);
  });

  test('stat calculations for hull health and climb speed', () => {
    assert.strictEqual(starSys.getHullHealth(0), 0);
    assert.strictEqual(starSys.getHullHealth(1), 40);
    assert.strictEqual(starSys.getHullHealth(2), 70);
    assert.strictEqual(starSys.getHullHealth(5), 160);

    assert.strictEqual(starSys.getClimbSpeed(1), 25);
    assert.strictEqual(starSys.getClimbSpeed(2), 35);
    assert.strictEqual(starSys.getClimbSpeed(4), 55);
  });

  test('upgradeHull costs and deduction', () => {
    const state = createMockGameState({
      resources: {
        alienAlloy: 5,
        steel: 120
      },
      starship: {
        unlocked: true,
        hullLevel: 0,
        engineLevel: 1,
        clearedEscape: false
      }
    });

    // Successful upgrade from level 0 -> 1 (requires alloy: 1, steel: 100)
    const success = starSys.upgradeHull(state);
    assert.strictEqual(success, true);
    assert.strictEqual(state.starship.hullLevel, 1);
    assert.strictEqual(state.resources.alienAlloy, 4);
    assert.strictEqual(state.resources.steel, 20);

    // Next upgrade requires alienAlloy: 2, steel: 175
    const fail = starSys.upgradeHull(state);
    assert.strictEqual(fail, false);
    assert.strictEqual(state.starship.hullLevel, 1);
  });

  test('upgradeEngine costs and deduction', () => {
    const state = createMockGameState({
      resources: {
        alienAlloy: 5,
        steel: 150
      },
      starship: {
        unlocked: true,
        hullLevel: 1,
        engineLevel: 1,
        clearedEscape: false
      }
    });

    // Level 1 cost: alloy 2, steel 100
    const success = starSys.upgradeEngine(state);
    assert.strictEqual(success, true);
    assert.strictEqual(state.starship.engineLevel, 2);
    assert.strictEqual(state.resources.alienAlloy, 3);
    assert.strictEqual(state.resources.steel, 50);
  });

  test('MapSystem scavenge crashed_starship unlocks starship and ship tab', () => {
    const mapSys = MapSystem.getInstance();
    const state = createMockGameState({
      expedition: {
        active: true,
        x: 32,
        y: 30,
        hp: 20,
        maxHp: 20,
        water: 10,
        maxWater: 10,
        curedMeat: 5,
        torches: 2,
        weapon: 'fists',
        bullets: 0,
        carriedLoot: {},
        inCombat: false,
        enemy: null,
        combatLog: []
      },
      clearedLandmarks: [],
      starship: {
        unlocked: false,
        hullLevel: 0,
        engineLevel: 1,
        clearedEscape: false
      },
      unlockedTabs: {
        room: true,
        village: true,
        craft: true,
        map: true,
        ship: false
      }
    });

    mapSys.scavengeLandmark(state);
    assert.strictEqual(state.starship.unlocked, true);
    assert.strictEqual(state.unlockedTabs.ship, true);
    assert.ok(state.clearedLandmarks.includes('crashed_starship'));
    assert.strictEqual(state.expedition.carriedLoot.alienAlloy, 10);
  });

  test('SaveManager backward compatibility and sanitization for starship', () => {
    setupMockLocalStorage();
    const mgr = SaveManager.getInstance();

    // Legacy save without starship property
    const legacyRaw: any = {
      resources: { wood: 50 },
      population: 4
    };

    const clean = mgr.validateAndSanitize(legacyRaw);
    assert.ok(clean.starship);
    assert.strictEqual(clean.starship.unlocked, false);
    assert.strictEqual(clean.starship.hullLevel, 0);
    assert.strictEqual(clean.starship.engineLevel, 1);
    assert.strictEqual(clean.starship.clearedEscape, false);
    assert.strictEqual(clean.unlockedTabs.ship, false);

    // Corrupted save with negative numbers
    const corruptedRaw: any = {
      resources: { wood: 10 },
      starship: {
        unlocked: true,
        hullLevel: -3,
        engineLevel: NaN,
        clearedEscape: 'yes'
      }
    };

    const cleanCorrupted = mgr.validateAndSanitize(corruptedRaw);
    assert.strictEqual(cleanCorrupted.starship.unlocked, true);
    assert.strictEqual(cleanCorrupted.starship.hullLevel, 0);
    assert.strictEqual(cleanCorrupted.starship.engineLevel, 1);
    assert.strictEqual(cleanCorrupted.starship.clearedEscape, true);
  });
});
