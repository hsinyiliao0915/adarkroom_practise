import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MapSystem, SPAWN_POINT } from '../src/systems/MapSystem.ts';
import { createMockGameState } from './helpers/mockState.ts';

describe('MapSystem & Expedition Invariants', () => {
  let mapSys: MapSystem;

  beforeEach(() => {
    mapSys = MapSystem.getInstance();
  });

  test('startExpedition should deduct bullets from resources to expedition', () => {
    const state = createMockGameState({
      resources: {
        curedMeat: 20,
        torches: 5,
        rifle: 1,
        bullets: 30
      }
    });

    const started = mapSys.startExpedition(state, 10, 2);
    assert.strictEqual(started, true);
    assert.strictEqual(state.resources.curedMeat, 10);
    assert.strictEqual(state.resources.torches, 3);
    // Bullets should be deducted from village resources and moved to expedition
    assert.strictEqual(state.resources.bullets, 0);
    assert.strictEqual(state.expedition.bullets, 30);
    assert.strictEqual(state.expedition.weapon, 'rifle');
  });

  test('returnHome should return remaining bullets, meat, torches and carried loot', () => {
    const state = createMockGameState({
      resources: {
        curedMeat: 10,
        torches: 2,
        bullets: 0
      },
      expedition: {
        active: true,
        x: 25,
        y: 25,
        hp: 15,
        maxHp: 20,
        water: 5,
        maxWater: 10,
        curedMeat: 6,
        torches: 1,
        weapon: 'rifle',
        bullets: 18, // 12 used in combat
        carriedLoot: { iron: 25, teeth: 10 },
        inCombat: false,
        enemy: null,
        combatLog: []
      }
    });

    mapSys.returnHome(state);

    assert.strictEqual(state.expedition.active, false);
    assert.strictEqual(state.expedition.x, SPAWN_POINT.x);
    assert.strictEqual(state.expedition.y, SPAWN_POINT.y);
    assert.strictEqual(state.expedition.bullets, 0);
    assert.strictEqual(state.expedition.curedMeat, 0);

    // Returned to village
    assert.strictEqual(state.resources.curedMeat, 16);
    assert.strictEqual(state.resources.torches, 3);
    assert.strictEqual(state.resources.bullets, 18);
    assert.strictEqual(state.resources.iron, 25);
    assert.strictEqual(state.resources.teeth, 10);
  });

  test('dieInWilderness should reset expedition state and coordinates back to spawn point', () => {
    const state = createMockGameState({
      expedition: {
        active: true,
        x: 35,
        y: 12,
        hp: 0,
        maxHp: 20,
        water: 0,
        maxWater: 10,
        curedMeat: 5,
        torches: 2,
        weapon: 'ironSword',
        bullets: 0,
        carriedLoot: { steel: 50 },
        inCombat: true,
        enemy: { name: '狂暴野獸', hp: 10, maxHp: 10, attack: 5, loot: {} } as any,
        combatLog: ['戰鬥中']
      }
    });

    mapSys.dieInWilderness(state);

    assert.strictEqual(state.expedition.active, false);
    assert.strictEqual(state.expedition.x, SPAWN_POINT.x);
    assert.strictEqual(state.expedition.y, SPAWN_POINT.y);
    assert.strictEqual(state.expedition.inCombat, false);
    assert.strictEqual(state.expedition.enemy, null);
    assert.strictEqual(state.expedition.curedMeat, 0);
    assert.strictEqual(state.expedition.torches, 0);
    assert.strictEqual(state.expedition.bullets, 0);
  });
});
