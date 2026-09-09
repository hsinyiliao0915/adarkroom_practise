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

  test('moving without water should inflict 2 damage and not consume cured meat', () => {
    const state = createMockGameState({
      expedition: {
        active: true,
        x: 20,
        y: 20,
        hp: 20,
        maxHp: 20,
        water: 0,
        maxWater: 10,
        curedMeat: 10,
        torches: 2,
        weapon: 'fists',
        bullets: 0,
        carriedLoot: {},
        inCombat: false,
        enemy: null,
        combatLog: []
      }
    });

    mapSys.move(state, 1, 0);

    // HP reduced by 2
    assert.strictEqual(state.expedition.hp, 18);
    // Meat should NOT be consumed as a water replacement
    assert.strictEqual(state.expedition.curedMeat, 10);
    assert.strictEqual(state.expedition.water, 0);
  });

  test('entering a cleared outpost should refill water to maxWater', () => {
    const state = createMockGameState({
      clearedLandmarks: ['outpost_1'],
      expedition: {
        active: true,
        x: 25, // outpost_1 is at (26, 24)
        y: 24,
        hp: 20,
        maxHp: 20,
        water: 1,
        maxWater: 15,
        curedMeat: 5,
        torches: 1,
        weapon: 'fists',
        bullets: 0,
        carriedLoot: {},
        inCombat: false,
        enemy: null,
        combatLog: []
      }
    });

    mapSys.move(state, 1, 0); // moves to (26, 24)
    assert.strictEqual(state.expedition.x, 26);
    assert.strictEqual(state.expedition.y, 24);
    assert.strictEqual(state.expedition.water, 15);
  });

  test('eatCuredMeat should consume 1 meat and heal 10 HP up to maxHp', () => {
    const state = createMockGameState({
      expedition: {
        active: true,
        x: 20,
        y: 20,
        hp: 8,
        maxHp: 20,
        water: 5,
        maxWater: 10,
        curedMeat: 3,
        torches: 0,
        weapon: 'fists',
        bullets: 0,
        carriedLoot: {},
        inCombat: false,
        enemy: null,
        combatLog: []
      }
    });

    const healed = mapSys.eatCuredMeat(state);
    assert.strictEqual(healed, true);
    assert.strictEqual(state.expedition.curedMeat, 2);
    assert.strictEqual(state.expedition.hp, 18);

    // Heal again, capped at maxHp (20)
    mapSys.eatCuredMeat(state);
    assert.strictEqual(state.expedition.curedMeat, 1);
    assert.strictEqual(state.expedition.hp, 20);

    // Fail if already full HP
    const fullHeal = mapSys.eatCuredMeat(state);
    assert.strictEqual(fullHeal, false);
    assert.strictEqual(state.expedition.curedMeat, 1);
  });

  test('scavenging cave without torch should fail, with torch should consume 1 torch', () => {
    const state = createMockGameState({
      clearedLandmarks: [],
      expedition: {
        active: true,
        x: 13, // cave_1 is at (13, 15)
        y: 15,
        hp: 20,
        maxHp: 20,
        water: 5,
        maxWater: 10,
        curedMeat: 3,
        torches: 0,
        weapon: 'fists',
        bullets: 0,
        carriedLoot: {},
        inCombat: false,
        enemy: null,
        combatLog: []
      }
    });

    // Without torch
    mapSys.scavengeLandmark(state);
    assert.strictEqual(state.clearedLandmarks.includes('cave_1'), false);

    // With torch
    state.expedition.torches = 1;
    mapSys.scavengeLandmark(state);
    assert.strictEqual(state.clearedLandmarks.includes('cave_1'), true);
    assert.strictEqual(state.expedition.torches, 0);
    assert.ok((state.expedition.carriedLoot.teeth || 0) > 0);
  });

  test('attackWithWeapon should respect cooldowns and updateCombat should tick timers', () => {
    const state = createMockGameState({
      expedition: {
        active: true,
        x: 20,
        y: 20,
        hp: 20,
        maxHp: 20,
        water: 10,
        maxWater: 10,
        curedMeat: 5,
        torches: 0,
        weapon: 'fists',
        bullets: 0,
        carriedLoot: {},
        inCombat: true,
        enemy: {
          name: '測試野狗',
          hp: 20,
          maxHp: 20,
          attack: 3,
          accuracy: 1.0,
          speed: 1.5,
          loot: {}
        },
        combatLog: [],
        enemyAttackCooldown: 2000,
        enemyMaxAttackCooldown: 2000,
        weaponCooldowns: {}
      }
    });

    // First attack succeeds and sets 2000ms cooldown for fists
    const attacked = mapSys.attackWithWeapon(state, 'fists');
    assert.strictEqual(attacked, true);
    assert.strictEqual(state.expedition.enemy!.hp, 18);
    assert.strictEqual(state.expedition.weaponCooldowns.fists, 2000);

    // Second immediate attack fails due to cooldown
    const cdAttack = mapSys.attackWithWeapon(state, 'fists');
    assert.strictEqual(cdAttack, false);
    assert.strictEqual(state.expedition.enemy!.hp, 18);

    // updateCombat ticks delta
    mapSys.updateCombat(1000, state);
    assert.strictEqual(state.expedition.weaponCooldowns.fists, 1000);
    assert.strictEqual(state.expedition.enemyAttackCooldown, 1000);

    // Advance remaining 1000ms -> enemy attacks (accuracy 1.0 -> deals 3 damage)
    mapSys.updateCombat(1000, state);
    assert.strictEqual(state.expedition.weaponCooldowns.fists, 0);
    assert.strictEqual(state.expedition.hp, 17);
    assert.strictEqual(state.expedition.enemyAttackCooldown, 2000); // reset
  });
});
