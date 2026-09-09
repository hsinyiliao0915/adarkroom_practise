import { GameData } from '../core/GameState';

export interface GameEvent {
  id: string;
  name: string;
  condition: (state: GameData) => boolean;
  frequency: number; // weight in random pool
  onTrigger: (state: GameData) => string; // returns log text
}

export const RANDOM_VILLAGE_EVENTS: GameEvent[] = [
  {
    id: 'nomads_arrive',
    name: '流浪者抵達',
    condition: (state) => {
      const maxPop = state.buildings.huts * 4;
      return state.buildings.huts > 0 && state.population < maxPop;
    },
    frequency: 30,
    onTrigger: (state) => {
      const maxPop = state.buildings.huts * 4;
      const space = maxPop - state.population;
      const count = Math.min(space, Math.floor(Math.random() * 2) + 1);
      state.population += count;
      return `一小隊飢寒交迫的流民在村落尋求庇護。(${count} 位新村民加入)`;
    }
  },
  {
    id: 'trader_visit',
    name: '流動商人造訪',
    condition: (state) => state.buildings.workshop > 0 && state.resources.teeth >= 5,
    frequency: 15,
    onTrigger: (state) => {
      // Trade teeth for iron or scales
      const teethTraded = Math.min(state.resources.teeth, 10);
      const ironGained = teethTraded * 2;
      state.resources.teeth -= teethTraded;
      state.resources.iron += ironGained;
      return `一名戴著兜帽的神秘商人悄悄造訪，用 ${ironGained} 塊精鐵換走了你收集的 ${teethTraded} 顆尖牙。`;
    }
  },
  {
    id: 'beast_pack_attack',
    name: '野獸夜襲',
    condition: (state) => state.population > 6 && state.resources.meat > 20,
    frequency: 10,
    onTrigger: (state) => {
      if (state.resources.boneSpear > 0 || state.resources.ironSword > 0 || state.resources.steelSword > 0) {
        state.resources.fur += 4;
        state.resources.meat += 6;
        return `深夜有狼群試圖襲擊儲藏庫，村民們拿起武器將牠們擊退，並收穫了狼皮與生肉。`;
      } else {
        const lostMeat = Math.min(state.resources.meat, 15);
        state.resources.meat -= lostMeat;
        return `一陣低吼撕破了黑夜，幾隻野獸闖入村莊掠奪了肉品儲藏。(-${lostMeat} 生肉)`;
      }
    }
  },
  {
    id: 'forest_bounty',
    name: '森林豐產',
    condition: (state) => state.unlockedForest,
    frequency: 20,
    onTrigger: (state) => {
      state.resources.wood += 25;
      return `暴風雨過後，森林邊緣散落著許多被狂風吹斷的乾燥巨木。(+25 木材)`;
    }
  },
  {
    id: 'beggar_share',
    name: '乞食的旅人',
    condition: (state) => state.resources.curedMeat >= 5,
    frequency: 12,
    onTrigger: (state) => {
      state.resources.curedMeat -= 2;
      state.resources.torches += 1;
      return `一個虛弱的旅人討要了少許肉乾，作為回報，他贈予了一根完好的火把。`;
    }
  }
];
