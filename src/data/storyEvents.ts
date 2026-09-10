import { GameData } from '../core/GameState';

export interface StoryChoice {
  text: string;
  cost?: Partial<GameData['resources']>;
  reward?: Partial<GameData['resources']>;
  statChanges?: {
    population?: number;
    traps?: number;
  };
  condition?: (state: GameData) => boolean;
  notification?: string; // Log message output to the main log panel
  nextScene?: string; // Next scene in this event, or 'end'
  onExecute?: (state: GameData) => {
    notification?: string;
    nextScene?: string;
    reward?: Partial<GameData['resources']>;
    cost?: Partial<GameData['resources']>;
    statChanges?: { population?: number; traps?: number };
  };
}

export interface StoryScene {
  text: string[];
  notification?: string;
  buttons: Record<string, StoryChoice>;
}

export interface StoryEvent {
  id: string;
  title: string;
  weight: number;
  cooldownSeconds?: number;
  isAvailable: (state: GameData) => boolean;
  scenes: Record<string, StoryScene>;
}

export const STORY_EVENTS: StoryEvent[] = [
  // 1. 噪聲 (Noises in the Storehouse - Exact 1:1 match with user screenshot)
  {
    id: 'noises_inside',
    title: '噪聲',
    weight: 35,
    cooldownSeconds: 90,
    isAvailable: (state) => state.unlockedForest && state.resources.wood > 10,
    scenes: {
      start: {
        text: [
          '倉庫裡傳出悉悉索索的聲音',
          '那裡有什麼東西'
        ],
        buttons: {
          investigate: {
            text: '調查',
            onExecute: () => {
              const r = Math.random();
              if (r < 0.45) {
                return {
                  nextScene: 'rat',
                  reward: { meat: 3, fur: 2, teeth: 1 },
                  notification: '倉庫裡有一隻大鼠，你把它除掉了。'
                };
              } else if (r < 0.8) {
                return {
                  nextScene: 'supplies',
                  reward: { wood: 15, fur: 3 },
                  notification: '你在倉庫角落的翻倒雜物下找到了一些可用的物資。'
                };
              } else {
                return {
                  nextScene: 'nothing',
                  notification: '倉庫裡空空如也，只有風聲穿過板縫。'
                };
              }
            }
          },
          ignore: {
            text: '忽略',
            onExecute: (state) => {
              if (state.resources.meat > 5) {
                state.resources.meat = Math.max(0, state.resources.meat - 4);
              }
              return {
                nextScene: 'end',
                notification: '聲音漸漸平息了，但倉庫似乎丟失了少許儲備。'
              };
            }
          }
        }
      },
      rat: {
        text: [
          '一隻體型肥碩的灰鼠正撕咬著儲存的麻袋',
          '你在黑暗中抄起木棍將牠擊斃'
        ],
        buttons: {
          leave: {
            text: '離開',
            nextScene: 'end'
          }
        }
      },
      supplies: {
        text: [
          '只是幾捆被風吹倒的舊板材',
          '在搬開它們時，你意外發現了先前遺落的柴火與碎毛皮'
        ],
        buttons: {
          leave: {
            text: '離開',
            nextScene: 'end'
          }
        }
      },
      nothing: {
        text: [
          '倉庫裡死一般寂靜',
          '什麼都沒有'
        ],
        buttons: {
          leave: {
            text: '離開',
            nextScene: 'end'
          }
        }
      }
    }
  },

  // 2. 異響 (Noises Outside)
  {
    id: 'noises_outside',
    title: '異響',
    weight: 25,
    cooldownSeconds: 100,
    isAvailable: (state) => state.unlockedForest,
    scenes: {
      start: {
        text: [
          '隔著木牆，外面傳來奇怪的拖曳聲',
          '不知道外面是什麼'
        ],
        buttons: {
          investigate: {
            text: '出門查看',
            onExecute: () => {
              if (Math.random() < 0.5) {
                return {
                  nextScene: 'bundle',
                  reward: { wood: 20, fur: 4 },
                  notification: '門外的雪地上放著一捆柴火與毛皮。'
                };
              } else {
                return {
                  nextScene: 'empty_snow',
                  notification: '雪地上只留下一串淺淺的腳印，迅速被風雪抹平。'
                };
              }
            }
          },
          ignore: {
            text: '待在屋內',
            nextScene: 'end',
            notification: '你守在火堆旁，外面的聲響漸漸隱沒在呼嘯的寒風中。'
          }
        }
      },
      bundle: {
        text: [
          '門口臺階旁的雪地裡躺著一捆用粗麻繩綁著的柴火',
          '四周靜悄悄的，沒有看見任何人影'
        ],
        buttons: {
          leave: {
            text: '拿進屋內',
            nextScene: 'end'
          }
        }
      },
      empty_snow: {
        text: [
          '推開門，只有冰冷刺骨的風雪撲面而來',
          '荒原一片死寂'
        ],
        buttons: {
          leave: {
            text: '返回屋內',
            nextScene: 'end'
          }
        }
      }
    }
  },

  // 3. 乞丐 (The Beggar)
  {
    id: 'the_beggar',
    title: '乞丐',
    weight: 20,
    cooldownSeconds: 120,
    isAvailable: (state) => state.resources.curedMeat >= 5 || state.resources.wood >= 60,
    scenes: {
      start: {
        text: [
          '一個衣衫襤褸的流民倒在門前',
          '他飢寒交迫，發出微弱的求救聲'
        ],
        buttons: {
          give_food: {
            text: '給予肉乾',
            cost: { curedMeat: 4 },
            condition: (state) => state.resources.curedMeat >= 4,
            reward: { teeth: 2 },
            nextScene: 'beggar_thankful',
            notification: '流民感激涕零，臨走前交給你兩枚隨身攜帶的奇異獸牙。'
          },
          give_wood: {
            text: '分予柴火',
            cost: { wood: 40 },
            condition: (state) => state.resources.wood >= 40,
            reward: { fur: 3 },
            nextScene: 'beggar_warm',
            notification: '流民在火堆旁取暖，送了你幾張碎獸皮以示謝意。'
          },
          drive_away: {
            text: '驅逐',
            nextScene: 'end',
            notification: '流民顫巍巍地爬起身，眼底帶著絕望消失在風雪中。'
          }
        }
      },
      beggar_thankful: {
        text: [
          '流民大口吞下肉乾，眼角泛著淚光',
          '他深深向你鞠躬，留下了幾枚珍貴的尖牙作為報答'
        ],
        buttons: {
          leave: {
            text: '目送他離開',
            nextScene: 'end'
          }
        }
      },
      beggar_warm: {
        text: [
          '流民捧著柴火在門口烤乾了凍僵的雙手',
          '他將幾塊打獵收穫的毛皮放在門檻上，默默離去'
        ],
        buttons: {
          leave: {
            text: '點頭致意',
            nextScene: 'end'
          }
        }
      }
    }
  },

  // 4. 遊蕩商人 (The Nomad)
  {
    id: 'the_nomad',
    title: '遊蕩商人',
    weight: 22,
    cooldownSeconds: 150,
    isAvailable: (state) => state.resources.fur >= 30,
    scenes: {
      start: {
        text: [
          '一位遊蕩商人推著沉重的手推車停在門口',
          '車上擺滿了琳瑯滿目的奇異物件'
        ],
        buttons: {
          buy_scales: {
            text: '購買鱗片',
            cost: { fur: 60 },
            condition: (state) => state.resources.fur >= 60,
            reward: { scales: 4 },
            notification: '你用毛皮向遊蕩商人換取了堅硬的鱗片。',
            nextScene: 'trade_done'
          },
          buy_teeth: {
            text: '購買尖牙',
            cost: { fur: 50 },
            condition: (state) => state.resources.fur >= 50,
            reward: { teeth: 4 },
            notification: '你用毛皮向商人交換了一袋打磨鋒利的尖牙。',
            nextScene: 'trade_done'
          },
          buy_iron: {
            text: '購買精鐵',
            cost: { fur: 80 },
            condition: (state) => state.resources.fur >= 80,
            reward: { iron: 15 },
            notification: '你用大量厚毛皮換來了一捆精純鐵條。',
            nextScene: 'trade_done'
          },
          farewell: {
            text: '告別',
            nextScene: 'end',
            notification: '遊蕩商人拉起手推車，緩緩走向地平線。'
          }
        }
      },
      trade_done: {
        text: [
          '商人清點了毛皮，滿意地將貨物交到你手中',
          '他的手推車上似乎還有其他東西'
        ],
        buttons: {
          farewell: {
            text: '告別',
            nextScene: 'end'
          }
        }
      }
    }
  },

  // 5. 毀壞的陷阱 (A Ruined Trap)
  {
    id: 'ruined_traps',
    title: '毀壞的陷阱',
    weight: 20,
    cooldownSeconds: 130,
    isAvailable: (state) => state.buildings.traps > 1,
    scenes: {
      start: {
        text: [
          '巡視時發現有幾個陷阱被猛力扯得粉碎',
          '雪地上留著巨大的深爪印，延伸進了陰暗的森林'
        ],
        buttons: {
          track: {
            text: '循跡追蹤',
            onExecute: () => {
              if (Math.random() < 0.6) {
                return {
                  nextScene: 'beast_slain',
                  reward: { meat: 12, fur: 6, teeth: 3 },
                  notification: '你在林地深處追上了一隻負傷的雪原猛獸，將牠制伏並帶回獵物。'
                };
              } else {
                return {
                  nextScene: 'lost_track',
                  notification: '爪印在凍結的石灘前中斷了，四週只剩狂風。'
                };
              }
            }
          },
          repair: {
            text: '重新修整',
            nextScene: 'end',
            notification: '你清理了被破壞的陷阱殘骸，重新架設了機關。'
          }
        }
      },
      beast_slain: {
        text: [
          '那是一隻體型巨大的雪原野獸，毛皮已被暗紅染透',
          '在短暫的博鬥後，野獸轟然倒地'
        ],
        buttons: {
          leave: {
            text: '滿載而歸',
            nextScene: 'end'
          }
        }
      },
      lost_track: {
        text: [
          '冰冷的風雪迅速掩埋了一切痕跡',
          '你不得不空手返回'
        ],
        buttons: {
          leave: {
            text: '返回營地',
            nextScene: 'end'
          }
        }
      }
    }
  },

  // 6. 突發的怪病 (The Sickness)
  {
    id: 'the_sickness',
    title: '突發的怪病',
    weight: 15,
    cooldownSeconds: 180,
    isAvailable: (state) => state.population > 5,
    scenes: {
      start: {
        text: [
          '聚落裡有幾名村民突然發起了高燒',
          '情況看起來相當嚴峻'
        ],
        buttons: {
          treat: {
            text: '悉心照料',
            cost: { curedMeat: 6 },
            condition: (state) => state.resources.curedMeat >= 6,
            nextScene: 'recovered',
            notification: '在充足的熱食與悉心照料下，村民挺過了高燒，聚落恢復了健康。'
          },
          isolate: {
            text: '聽天由命',
            onExecute: (state) => {
              state.population = Math.max(1, state.population - 1);
              return {
                nextScene: 'end',
                notification: '嚴寒與怪病奪走了一名村民的生命。'
              };
            }
          }
        }
      },
      recovered: {
        text: [
          '高燒逐漸退去，村民們臉上重現血色',
          '大家對你的照護充滿感激'
        ],
        buttons: {
          leave: {
            text: '回到工作中',
            nextScene: 'end'
          }
        }
      }
    }
  },

  // 7. 倉庫起火 (Storehouse Fire)
  {
    id: 'storehouse_fire',
    title: '倉庫起火',
    weight: 15,
    cooldownSeconds: 200,
    isAvailable: (state) => state.resources.wood >= 100 && (state.buildings.workshop > 0 || state.buildings.huts > 2),
    scenes: {
      start: {
        text: [
          '木料堆突然冒出刺鼻的濃煙',
          '火舌正沿著乾燥的木牆向上蔓延'
        ],
        buttons: {
          extinguish: {
            text: '全力撲救',
            onExecute: (state) => {
              const lost = Math.min(25, Math.floor(state.resources.wood * 0.15));
              state.resources.wood = Math.max(0, state.resources.wood - lost);
              return {
                nextScene: 'end',
                notification: '大家奮力提水撲滅了大火，只損失了堆在最外層的少量木料。'
              };
            }
          },
          save_valuables: {
            text: '搶救珍貴物資',
            onExecute: (state) => {
              const lost = Math.min(60, Math.floor(state.resources.wood * 0.35));
              state.resources.wood = Math.max(0, state.resources.wood - lost);
              return {
                nextScene: 'end',
                notification: '你搶救出了重要的工具與皮料，但部分庫存木材化為了焦炭。'
              };
            }
          }
        }
      }
    }
  },

  // 8. 林中行者 (The Mysterious Wanderer)
  {
    id: 'mysterious_wanderer',
    title: '林中行者',
    weight: 18,
    cooldownSeconds: 140,
    isAvailable: (state) => state.unlockedForest,
    scenes: {
      start: {
        text: [
          '一位戴著寬檐斗笠的孤獨行者在火堆旁停下腳步',
          '他久久注視著躍動的火苗，沉默不語'
        ],
        buttons: {
          welcome: {
            text: '遞上一杯溫水',
            reward: { teeth: 1, scales: 1 },
            nextScene: 'wanderer_speaks',
            notification: '行者接過水杯微微頷首，留下了一小包罕見的材料作為回禮。'
          },
          watch: {
            text: '保持警戒',
            nextScene: 'end',
            notification: '行者看了你一眼，什麼也沒說，轉身走入了深沉的暮色中。'
          }
        }
      },
      wanderer_speaks: {
        text: [
          '行者靜靜喝完水，壓低了帽檐',
          '「外面還有很多人在遊蕩，要守住這簇火。」他輕聲說道'
        ],
        buttons: {
          leave: {
            text: '目送離去',
            nextScene: 'end'
          }
        }
      }
    }
  },

  // 9. 暗處的影子 (The Thief)
  {
    id: 'the_thief',
    title: '暗處的影子',
    weight: 20,
    cooldownSeconds: 120,
    isAvailable: (state) => state.resources.meat >= 15 && state.population >= 3,
    scenes: {
      start: {
        text: [
          '夜深人靜時，倉庫附近有影子在急速晃動',
          '似乎有人潛入了物資存放處'
        ],
        buttons: {
          ambush: {
            text: '伏擊抓捕',
            onExecute: () => {
              if (Math.random() < 0.7) {
                return {
                  nextScene: 'caught',
                  reward: { fur: 4, teeth: 2 },
                  notification: '你悄聲摸近抓住了潛入者，奪回了被盜物資並繳獲了對方攜帶的小刀。'
                };
              } else {
                return {
                  nextScene: 'escaped',
                  notification: '黑影身手敏捷，翻牆逃入了黑夜中。'
                };
              }
            }
          },
          shout: {
            text: '大聲呵斥',
            nextScene: 'end',
            notification: '一聲斷喝驚動了對方，小偷驚慌失措地丟下手頭的物品落荒而逃。'
          }
        }
      },
      caught: {
        text: [
          '被捕獲的人跪在地上瑟瑟發抖',
          '他把偷拿的物品全部交還，並求饒著放他一條生路'
        ],
        buttons: {
          leave: {
            text: '驅離聚落',
            nextScene: 'end'
          }
        }
      },
      escaped: {
        text: [
          '倉庫外只留下一串慌亂的腳印與凌亂的雪地',
          '看來需要加強守備'
        ],
        buttons: {
          leave: {
            text: '回去休息',
            nextScene: 'end'
          }
        }
      }
    }
  },

  // 10. 流民 (Shivering Pack)
  {
    id: 'shivering_pack',
    title: '流民',
    weight: 25,
    cooldownSeconds: 100,
    isAvailable: (state) => {
      const maxPop = state.buildings.huts * 4;
      return state.buildings.huts > 0 && state.population < maxPop;
    },
    scenes: {
      start: {
        text: [
          '幾名飢寒交迫的流民聚集在村落外圍',
          '他們看著聚落升起的炊煙，目光滿是渴望'
        ],
        buttons: {
          welcome: {
            text: '接納收留',
            onExecute: (state) => {
              const maxPop = state.buildings.huts * 4;
              const space = maxPop - state.population;
              const count = Math.min(space, Math.floor(Math.random() * 2) + 1);
              state.population += count;
              return {
                nextScene: 'end',
                notification: '新的流民進入了小屋，安頓下來並成為了聚落的村民。'
              };
            }
          },
          refuse: {
            text: '拒之門外',
            nextScene: 'end',
            notification: '門窗緊閉，流民們在刺骨寒風中默默轉身離去。'
          }
        }
      }
    }
  }
];
