import { GameData, INITIAL_GAME_DATA } from '../../src/core/GameState.ts';

export function createMockGameState(overrides?: Partial<GameData>): GameData {
  const base: GameData = JSON.parse(JSON.stringify(INITIAL_GAME_DATA));
  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    resources: {
      ...base.resources,
      ...(overrides.resources || {})
    },
    buildings: {
      ...base.buildings,
      ...(overrides.buildings || {})
    },
    workers: {
      ...base.workers,
      ...(overrides.workers || {})
    },
    unlockedTabs: {
      ...base.unlockedTabs,
      ...(overrides.unlockedTabs || {})
    },
    expedition: {
      ...base.expedition,
      ...(overrides.expedition || {})
    },
    starship: {
      ...base.starship,
      ...(overrides.starship || {})
    }
  };
}
