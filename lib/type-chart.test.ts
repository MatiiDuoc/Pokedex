import { describe, expect, it } from 'vitest';
import {
  getBestOffensiveMultiplier,
  getDefensiveMatchups,
  getDefensiveMultiplier,
  getOffensiveCoverage,
  getTeamWeaknesses,
} from './type-chart';

describe('tabla de tipos', () => {
  it('calcula debilidades, resistencias e inmunidades de Charizard', () => {
    const matchups = getDefensiveMatchups(['fire', 'flying']);

    expect(matchups.weaknesses).toEqual(
      expect.arrayContaining([
        { type: 'rock', multiplier: 4 },
        { type: 'water', multiplier: 2 },
        { type: 'electric', multiplier: 2 },
      ])
    );
    expect(matchups.immunities).toEqual(
      expect.arrayContaining([{ type: 'ground', multiplier: 0 }])
    );
    expect(matchups.resistances).toEqual(
      expect.arrayContaining([
        { type: 'grass', multiplier: 0.25 },
        { type: 'bug', multiplier: 0.25 },
        { type: 'fire', multiplier: 0.5 },
        { type: 'fighting', multiplier: 0.5 },
      ])
    );
  });

  it('calcula inmunidades de un tipo puro', () => {
    const matchups = getDefensiveMatchups(['normal']);
    expect(matchups.immunities).toEqual([{ type: 'ghost', multiplier: 0 }]);
    expect(matchups.weaknesses).toEqual([{ type: 'fighting', multiplier: 2 }]);
  });

  it('calcula cobertura ofensiva y debilidades compartidas', () => {
    expect(getOffensiveCoverage([['fire'], ['water', 'ice']])).toEqual(
      expect.arrayContaining(['fire', 'water', 'ice'])
    );

    const weaknesses = getTeamWeaknesses([['fire', 'flying'], ['water']]);
    expect(weaknesses.find((entry) => entry.type === 'water')?.count).toBe(1);
    expect(weaknesses.find((entry) => entry.type === 'electric')?.count).toBe(2);
    expect(weaknesses.find((entry) => entry.type === 'rock')?.count).toBe(1);
  });

  it('calcula multiplicadores defensivos y ofensivos para filtros', () => {
    expect(getDefensiveMultiplier(['fire', 'flying'], 'rock')).toBe(4);
    expect(getDefensiveMultiplier(['fire', 'flying'], 'grass')).toBe(0.25);
    expect(getDefensiveMultiplier(['normal'], 'ghost')).toBe(0);
    expect(getDefensiveMultiplier(['water'], 'electric')).toBe(2);

    expect(getBestOffensiveMultiplier(['fire', 'flying'], 'grass')).toBe(2);
    expect(getBestOffensiveMultiplier(['fire', 'flying'], 'rock')).toBe(0.5);
    expect(getBestOffensiveMultiplier(['normal'], 'ghost')).toBe(0);
  });
});
