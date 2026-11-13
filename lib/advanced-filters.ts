import {
  matchesSpeciesCategory,
  type SpeciesCategory,
} from '@/lib/pokemon-categories';
import {
  getBestOffensiveMultiplier,
  getDefensiveMultiplier,
  isPokemonType,
} from '@/lib/type-chart';
import type { PokemonFilterEntry } from '@/types/filters';
import type { PokemonIndexEntry } from '@/types/pokemon';

export interface AdvancedPokemonFilters {
  type: string;
  weakTo: string;
  resists: string;
  strongAgainst: string;
  species: SpeciesCategory;
  stat: string;
  minStat: number;
  minTotal: number;
}

export const EMPTY_ADVANCED_FILTERS: AdvancedPokemonFilters = {
  type: '',
  weakTo: '',
  resists: '',
  strongAgainst: '',
  species: 'all',
  stat: '',
  minStat: 100,
  minTotal: 0,
};

export function countActiveAdvancedFilters(
  filters: AdvancedPokemonFilters
): number {
  return [
    filters.type,
    filters.weakTo,
    filters.resists,
    filters.strongAgainst,
    filters.species !== 'all' ? filters.species : '',
    filters.stat,
    filters.minTotal > 0 ? filters.minTotal.toString() : '',
  ].filter(Boolean).length;
}

export function hasActiveAdvancedFilters(
  filters: AdvancedPokemonFilters
): boolean {
  return countActiveAdvancedFilters(filters) > 0;
}

function getStatValue(
  filterEntry: PokemonFilterEntry,
  stat: string
): number {
  return filterEntry.stats[stat as keyof typeof filterEntry.stats] ?? 0;
}

function getTotalStats(filterEntry: PokemonFilterEntry): number {
  return Object.values(filterEntry.stats).reduce(
    (total, value) => total + value,
    0
  );
}

/**
 * Aplica los filtros de tipo, efectividad, especie y estadísticas. Mientras el
 * índice ligero de PokeAPI todavía no ha cargado, deja pasar las especies para
 * no mostrar una lista vacía de forma momentánea.
 */
export function matchesAdvancedFilters(
  entry: PokemonIndexEntry,
  filterEntry: PokemonFilterEntry | undefined,
  filters: AdvancedPokemonFilters,
  dataReady: boolean
): boolean {
  if (
    filters.species !== 'all' &&
    !matchesSpeciesCategory(
      entry.id,
      entry.legendaryCategory,
      filters.species
    )
  ) {
    return false;
  }

  const needsData =
    filters.type !== '' ||
    filters.weakTo !== '' ||
    filters.resists !== '' ||
    filters.strongAgainst !== '' ||
    filters.stat !== '' ||
    filters.minTotal > 0;

  if (!needsData) return true;
  if (!dataReady) return true;
  if (!filterEntry) return false;

  if (
    filters.type !== '' &&
    !filterEntry.types.includes(filters.type)
  ) {
    return false;
  }

  if (filters.weakTo !== '' && isPokemonType(filters.weakTo)) {
    const multiplier = getDefensiveMultiplier(
      filterEntry.types,
      filters.weakTo
    );
    if (multiplier <= 1) return false;
  }

  if (filters.resists !== '' && isPokemonType(filters.resists)) {
    const multiplier = getDefensiveMultiplier(
      filterEntry.types,
      filters.resists
    );
    if (multiplier >= 1) return false;
  }

  if (
    filters.strongAgainst !== '' &&
    isPokemonType(filters.strongAgainst)
  ) {
    const multiplier = getBestOffensiveMultiplier(
      filterEntry.types,
      filters.strongAgainst
    );
    if (multiplier <= 1) return false;
  }

  if (filters.stat !== '') {
    if (getStatValue(filterEntry, filters.stat) < filters.minStat) {
      return false;
    }
  }

  if (filters.minTotal > 0 && getTotalStats(filterEntry) < filters.minTotal) {
    return false;
  }

  return true;
}
