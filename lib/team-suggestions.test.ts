import { describe, expect, it } from 'vitest';
import { getTeamSuggestions, scoreSuggestion } from './team-suggestions';
import { getTeamWeaknesses } from './type-chart';

describe('sugerencias de equipo', () => {
  it('puntúa Pokémon que resisten las debilidades del equipo', () => {
    const weaknesses = getTeamWeaknesses([['fire', 'flying'], ['water']]);

    const ground = scoreSuggestion(['ground'], weaknesses);
    const fire = scoreSuggestion(['fire'], weaknesses);
    const grass = scoreSuggestion(['grass'], weaknesses);

    expect(ground).toBeGreaterThan(fire);
    expect(grass).toBeGreaterThan(fire);
    expect(fire).toBeGreaterThanOrEqual(0);
  });

  it('ordena sugerencias y excluye miembros actuales', () => {
    const suggestions = getTeamSuggestions(
      [['fire', 'flying'], ['water']],
      [
        { id: 1, types: ['ground'] },
        { id: 2, types: ['grass'] },
      ],
      [1]
    );

    expect(suggestions.map((entry) => entry.id)).toEqual([2]);
  });
});
