import {
  getDefensiveMatchups,
  getTeamWeaknesses,
  type TeamWeakness,
} from '@/lib/type-chart';

export interface SuggestionCandidate {
  id: number;
  types: string[];
}

export function scoreSuggestion(
  candidateTypes: string[],
  weaknesses: TeamWeakness[]
): number {
  const { resistances, immunities } = getDefensiveMatchups(candidateTypes);
  const resisted = new Set([
    ...resistances.map((entry) => entry.type),
    ...immunities.map((entry) => entry.type),
  ]);

  return weaknesses.reduce(
    (score, weakness) => score + (resisted.has(weakness.type) ? weakness.count : 0),
    0
  );
}

/**
 * Ordena un pool de Pokémon según cuántas debilidades del equipo cubren.
 * No incluye miembros que ya están en el equipo.
 */
export function getTeamSuggestions<T extends SuggestionCandidate>(
  teamTypes: string[][],
  pool: T[],
  excludeIds: number[],
  limit = 6
): Array<T & { score: number }> {
  const weaknesses = getTeamWeaknesses(teamTypes);
  const excluded = new Set(excludeIds);

  return pool
    .filter((candidate) => !excluded.has(candidate.id))
    .map((candidate) => ({
      ...candidate,
      score: scoreSuggestion(candidate.types, weaknesses),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, limit);
}
