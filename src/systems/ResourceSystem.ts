import { GameData, Resources, Workers } from '../core/GameState';
import { WORKER_JOBS } from '../data/recipes';
import { EventBus, Events } from '../core/EventBus';

export class ResourceSystem {
  private static instance: ResourceSystem;

  private constructor() {}

  public static getInstance(): ResourceSystem {
    if (!ResourceSystem.instance) {
      ResourceSystem.instance = new ResourceSystem();
    }
    return ResourceSystem.instance;
  }

  public gatherWood(state: GameData): number {
    let amount = 10;
    if (state.resources.cart > 0) amount = 50;
    if (state.resources.wagon > 0) amount = 100;

    state.resources.wood += amount;
    const gatherMsgs = [
      '林地上散落著枯枝敗葉。',
      '乾燥的枯枝在腳下碎裂。',
      '林間吹過刺骨的寒風。',
      '收集到了足夠燃燒的木頭。'
    ];
    const randMsg = gatherMsgs[Math.floor(Math.random() * gatherMsgs.length)];
    EventBus.getInstance().emit(Events.LOG_MESSAGE, randMsg, 'info');
    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    return amount;
  }

  public baitTraps(state: GameData, amount: number = 1): boolean {
    if (state.buildings.traps <= 0) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '尚未設置任何陷阱。', 'warn');
      return false;
    }
    if (state.resources.meat < amount) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '生肉不足，無法投放誘餌。', 'warn');
      return false;
    }

    state.resources.meat -= amount;
    state.trapBaitMeat = (state.trapBaitMeat || 0) + amount;
    EventBus.getInstance().emit(Events.LOG_MESSAGE, `為森林陷阱投放了生肉作為誘餌。`, 'info');
    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
    return true;
  }

  public checkTraps(state: GameData): void {
    const trapCount = state.buildings.traps;
    if (trapCount <= 0) return;

    const hasBait = (state.trapBaitMeat || 0) > 0;
    if (hasBait) {
      state.trapBaitMeat = Math.max(0, state.trapBaitMeat - 1);
    }

    // Base catch calculation per trap
    let totalMeat = 0;
    let totalFur = 0;
    let totalTeeth = 0;
    let totalScales = 0;

    const teethChance = hasBait ? 0.40 : 0.15;
    const scalesChance = hasBait ? 0.25 : 0.08;

    for (let i = 0; i < trapCount; i++) {
      const roll = Math.random();
      if (roll < 0.6) {
        totalMeat += Math.floor(Math.random() * 2) + 1;
        totalFur += Math.floor(Math.random() * 2) + 1;
      }
      if (roll < teethChance) {
        totalTeeth += 1;
      }
      if (roll < scalesChance) {
        totalScales += 1;
      }
    }

    state.resources.meat += totalMeat;
    state.resources.fur += totalFur;
    state.resources.teeth += totalTeeth;
    state.resources.scales += totalScales;

    if (totalScales > 0) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '陷阱捕獲到古怪鱗片。', 'story');
    } else if (totalTeeth > 0) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '陷阱捕獲到一些尖牙。', 'story');
    } else if (totalMeat > 0 || totalFur > 0) {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '陷阱抓到了一些生肉和毛皮。', 'info');
    } else {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '陷阱空空如也。', 'info');
    }

    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
  }

  public getNetRates(state: GameData): Partial<Record<keyof Resources, number>> {
    const netRates: Partial<Record<keyof Resources, number>> = {};

    WORKER_JOBS.forEach((job) => {
      const count = state.workers[job.id as keyof Workers] || 0;
      if (count <= 0) return;

      // Check if consumption is met
      let canProduce = true;
      for (const [resKey, costPer10s] of Object.entries(job.consumption)) {
        const requiredPerSec = (costPer10s * count) / 10;
        if ((state.resources[resKey as keyof Resources] || 0) < requiredPerSec) {
          canProduce = false;
          break;
        }
      }

      if (canProduce) {
        // Add production
        for (const [resKey, prodPer10s] of Object.entries(job.production)) {
          const rate = (prodPer10s * count) / 10;
          netRates[resKey as keyof Resources] = (netRates[resKey as keyof Resources] || 0) + rate;
        }
        // Subtract consumption
        for (const [resKey, costPer10s] of Object.entries(job.consumption)) {
          const rate = (costPer10s * count) / 10;
          netRates[resKey as keyof Resources] = (netRates[resKey as keyof Resources] || 0) - rate;
        }
      }
    });

    return netRates;
  }

  public tick(state: GameData, deltaSeconds: number): void {
    WORKER_JOBS.forEach((job) => {
      const count = state.workers[job.id as keyof Workers] || 0;
      if (count <= 0) return;

      // Check if enough resources for consumption
      let canProduce = true;
      for (const [resKey, costPer10s] of Object.entries(job.consumption)) {
        const needed = (costPer10s * count * deltaSeconds) / 10;
        if ((state.resources[resKey as keyof Resources] || 0) < needed) {
          canProduce = false;
          break;
        }
      }

      if (canProduce) {
        // Consume
        for (const [resKey, costPer10s] of Object.entries(job.consumption)) {
          const needed = (costPer10s * count * deltaSeconds) / 10;
          state.resources[resKey as keyof Resources] = Math.max(0, (state.resources[resKey as keyof Resources] || 0) - needed);
        }
        // Produce
        for (const [resKey, prodPer10s] of Object.entries(job.production)) {
          const generated = (prodPer10s * count * deltaSeconds) / 10;
          state.resources[resKey as keyof Resources] = (state.resources[resKey as keyof Resources] || 0) + generated;
        }
      }
    });
  }
}
