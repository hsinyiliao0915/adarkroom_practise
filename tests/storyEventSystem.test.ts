import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { StoryEventSystem } from '../src/systems/StoryEventSystem';
import { EventBus, Events } from '../src/core/EventBus';
import { GameData } from '../src/core/GameState';

function createMockGameState(overrides: Partial<GameData> = {}): GameData {
  return {
    gameTime: 100,
    activeTab: 'room',
    unlockedTabs: ['room'],
    fireState: 'burning',
    fireFuel: 50,
    warmthLevel: 'mild',
    unlockedForest: true,
    resources: {
      wood: 100,
      fur: 100,
      meat: 50,
      curedMeat: 20,
      teeth: 5,
      scales: 5,
      iron: 10,
      coal: 0,
      steel: 0,
      bullets: 0,
      torches: 2,
      compass: 0,
      trapBaitMeat: 0,
      boneSpear: 0,
      ironSword: 0,
      steelSword: 0,
      rifle: 0,
      laserRifle: 0,
      grenades: 0,
      alienAlloy: 0,
      energyCells: 0
    },
    buildings: {
      traps: 4,
      cart: 0,
      huts: 2,
      workshop: 1,
      smokehouse: 1
    },
    population: 4,
    workers: {
      woodGatherers: 0,
      trappers: 0,
      curedMeatMakers: 0,
      ironMiners: 0,
      coalMiners: 0,
      steelWorkers: 0,
      armourers: 0
    },
    worldMap: {
      tiles: {},
      playerPos: { x: 0, y: 0 },
      spawnPos: { x: 0, y: 0 },
      landmarks: {},
      visitedCoordinates: ['0,0']
    },
    expedition: {
      water: 10,
      maxWater: 10,
      carriedLoot: {},
      playerHp: 10,
      maxHp: 10
    },
    ship: {
      unlocked: false,
      hull: 0,
      engine: 0
    },
    stats: {
      totalWoodGathered: 0,
      totalBeastsSlain: 0
    },
    ...overrides
  };
}

describe('StoryEventSystem & Narrative Choice Engine', () => {
  let system: StoryEventSystem;

  beforeEach(() => {
    system = StoryEventSystem.getInstance();
    system.reset();
  });

  test('triggerRandomEvent should not trigger if forest is not unlocked', () => {
    const state = createMockGameState({ unlockedForest: false });
    const ev = system.triggerRandomEvent(state);
    assert.strictEqual(ev, null);
    assert.strictEqual(system.getActiveEvent(), null);
  });

  test('triggerEventById should start event with scene start and emit event', () => {
    const state = createMockGameState();
    let emitted = false;

    const unsub = EventBus.getInstance().on(Events.STORY_EVENT_TRIGGERED, (data) => {
      assert.strictEqual(data.event.id, 'noises_inside');
      assert.strictEqual(data.sceneKey, 'start');
      emitted = true;
    });

    const ev = system.triggerEventById('noises_inside', state);
    unsub();

    assert.ok(ev);
    assert.strictEqual(ev.id, 'noises_inside');
    assert.strictEqual(emitted, true);
    assert.ok(system.getActiveEvent());
    assert.strictEqual(system.getActiveEvent()!.event.id, 'noises_inside');
  });

  test('should not trigger a new event while another event is active', () => {
    const state = createMockGameState();
    system.triggerEventById('noises_inside', state);
    assert.ok(system.getActiveEvent());

    const secondEv = system.triggerRandomEvent(state);
    assert.strictEqual(secondEv, null);
  });

  test('canAffordChoice correctly checks costs and conditions', () => {
    const state = createMockGameState({
      resources: { ...createMockGameState().resources, fur: 20 }
    });

    const choiceWithCost = {
      text: '購買精鐵',
      cost: { fur: 80 }
    };

    assert.strictEqual(system.canAffordChoice(choiceWithCost, state), false);

    state.resources.fur = 100;
    assert.strictEqual(system.canAffordChoice(choiceWithCost, state), true);
  });

  test('selecting choice with insufficient resources fails without changing state', () => {
    const state = createMockGameState({
      resources: { ...createMockGameState().resources, fur: 10 }
    });

    system.triggerEventById('the_nomad', state);
    const result = system.selectChoice('buy_iron', state);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.closed, false);
    assert.strictEqual(result.reason, 'insufficient_resources');
    assert.strictEqual(state.resources.fur, 10);
  });

  test('executing choice deducts cost, grants reward, and updates scene or closes', () => {
    const state = createMockGameState({
      resources: { ...createMockGameState().resources, curedMeat: 10, teeth: 0 }
    });

    system.triggerEventById('the_beggar', state);
    assert.ok(system.getActiveEvent());

    const result = system.selectChoice('give_food', state);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.closed, false);
    assert.strictEqual(result.nextScene, 'beggar_thankful');
    assert.strictEqual(state.resources.curedMeat, 6); // 10 - 4
    assert.strictEqual(state.resources.teeth, 2); // 0 + 2

    // Progress to leave
    const finalResult = system.selectChoice('leave', state);
    assert.strictEqual(finalResult.success, true);
    assert.strictEqual(finalResult.closed, true);
    assert.strictEqual(system.getActiveEvent(), null);
  });

  test('noises_inside ignore choice closes modal and produces narrative log without parenthetical numbers', () => {
    const state = createMockGameState({
      resources: { ...createMockGameState().resources, meat: 20 }
    });

    system.triggerEventById('noises_inside', state);
    let capturedLog: string = '';

    const unsub = EventBus.getInstance().on(Events.LOG_MESSAGE, (msg) => {
      capturedLog = msg;
    });

    const result = system.selectChoice('ignore', state);
    unsub();

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.closed, true);
    assert.strictEqual(system.getActiveEvent(), null);
    assert.strictEqual(state.resources.meat, 16);
    assert.ok(capturedLog.includes('聲音漸漸平息了'));
    assert.strictEqual(capturedLog.includes('(+'), false);
    assert.strictEqual(capturedLog.includes('(-'), false);
  });

  test('dev auto mode executes affordable choices and does not freeze', () => {
    const state = createMockGameState();
    system.triggerEventById('noises_inside', state);
    assert.ok(system.getActiveEvent());

    // In auto mode, choice is picked
    const activeEv = system.getActiveEvent()!;
    const buttonKeys = Object.keys(activeEv.scene.buttons);
    assert.ok(buttonKeys.length > 0);

    const firstKey = buttonKeys[0];
    const res = system.selectChoice(firstKey, state);
    assert.strictEqual(res.success, true);
  });
});
