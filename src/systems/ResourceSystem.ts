import { GameData, Resources, Workers } from '../core/GameState';
import { WORKER_JOBS } from '../data/recipes';
import { EventBus, Events } from '../core/EventBus';
import { VillageSystem } from './VillageSystem';

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

    if (!state.hasGatheredWood) {
      state.hasGatheredWood = true;
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '林地上散落著枯枝敗葉。', 'story');
    } else {
      const gatherMsgs = [
        '林地上散落著枯枝敗葉。',
        '乾燥的枯枝在腳下碎裂。',
        '林間吹過刺骨的寒風。',
        '收集到了足夠燃燒的木頭。'
      ];
      const randMsg = gatherMsgs[Math.floor(Math.random() * gatherMsgs.length)];
      EventBus.getInstance().emit(Events.LOG_MESSAGE, randMsg, 'info');
    }

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
    const numTraps = state.buildings.traps || 0;
    if (numTraps <= 0) return;

    // Deduct bait: legacy trapBaitMeat consumes 1 per check; store bait consumes min(bait, traps)
    let baitBonus = 0;
    if (state.trapBaitMeat && state.trapBaitMeat > 0) {
      state.trapBaitMeat -= 1;
      baitBonus = numTraps;
    } else if (state.resources.bait && state.resources.bait > 0) {
      const baitUsed = Math.min(state.resources.bait, numTraps);
      state.resources.bait -= baitUsed;
      baitBonus = baitUsed;
    }

    const numDrops = numTraps + baitBonus;
    const trapDrops = [
      { rollUnder: 0.5, name: 'fur', label: '皮毛碎片' },
      { rollUnder: 0.75, name: 'meat', label: '小片肉' },
      { rollUnder: 0.85, name: 'scales', label: '古怪鱗片' },
      { rollUnder: 0.93, name: 'teeth', label: '殘缺牙齒' },
      { rollUnder: 0.995, name: 'cloth', label: '破爛布料' }
    ];

    const drops: Record<string, number> = {};
    const caughtLabels: string[] = [];

    for (let i = 0; i < numDrops; i++) {
      const roll = Math.random();
      for (const drop of trapDrops) {
        if (roll < drop.rollUnder) {
          drops[drop.name] = (drops[drop.name] || 0) + 1;
          if (!caughtLabels.includes(drop.label)) {
            caughtLabels.push(drop.label);
          }
          break;
        }
      }
    }

    // Apply drops to resources
    for (const [resKey, amount] of Object.entries(drops)) {
      state.resources[resKey as keyof Resources] = (state.resources[resKey as keyof Resources] || 0) + amount;
    }

    if (caughtLabels.length > 0) {
      let msg = '陷阱捕獲到';
      if (caughtLabels.length === 1) {
        msg += caughtLabels[0] + '。';
      } else {
        const last = caughtLabels.pop();
        msg += caughtLabels.join('，') + '以及' + last + '。';
      }
      EventBus.getInstance().emit(Events.LOG_MESSAGE, msg, 'story');
    } else {
      EventBus.getInstance().emit(Events.LOG_MESSAGE, '陷阱空空如也。', 'info');
    }

    EventBus.getInstance().emit(Events.RESOURCE_CHANGED);
    EventBus.getInstance().emit(Events.STATE_CHANGED);
  }

  public getNetRates(state: GameData): Partial<Record<keyof Resources, number>> {
    const netRates: Partial<Record<keyof Resources, number>> = {};

    // 1. Builder passive income (when helping/awake)
    if (state.strangerState === 'awake' || state.strangerState === 'helping') {
      netRates.wood = (netRates.wood || 0) + 0.2;
    }

    // 2. Workers income
    WORKER_JOBS.forEach((job) => {
      const count = job.id === 'gatherers'
        ? VillageSystem.getInstance().getNumGatherers(state)
        : (state.workers[job.id as keyof Workers] || 0);
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
    // 1. Builder passive wood production (when stranger is helping)
    if (state.strangerState === 'awake' || state.strangerState === 'helping') {
      state.resources.wood = (state.resources.wood || 0) + (2 * deltaSeconds) / 10;
    }

    // 2. Workers jobs production and consumption
    WORKER_JOBS.forEach((job) => {
      const count = job.id === 'gatherers'
        ? VillageSystem.getInstance().getNumGatherers(state)
        : (state.workers[job.id as keyof Workers] || 0);
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
