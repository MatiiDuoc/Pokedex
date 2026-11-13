import { describe, expect, it } from 'vitest';
import {
  EMPTY_ADVANCED_FILTERS,
  countActiveAdvancedFilters,
  hasActiveAdvancedFilters,
  matchesAdvancedFilters,
  type AdvancedPokemonFilters,
} from './advanced-filters';
import type { PokemonFilterEntry } from '@/types/filters';
import type { PokemonIndexEntry } from '@/types/pokemon';

const charizard: PokemonIndexEntry = {
  id: 6,
  name: 'charizard',
  spriteUrl: '',
  artworkUrl: '',
  shinySpriteUrl: '',
  shinyArtworkUrl: '',
  legendaryCategory: 'none',
};

const bulbasaur: PokemonIndexEntry = {
  ...charizard,
  id: 1,
  name: 'bulbasaur',
};

const charizardFilters: PokemonFilterEntry = {
  id: 6,
  types: ['fire', 'flying'],
  stats: {
    hp: 78,
    attack: 84,
    defense: 78,
    'special-attack': 109,
    'special-defense': 85,
    speed: 100,
  },
  abilities: ['blaze', 'solar-power'],
};

const filters = (
  overrides: Partial<AdvancedPokemonFilters>
): AdvancedPokemonFilters => ({ ...EMPTY_ADVANCED_FILTERS, ...overrides });

describe('filtros avanzados', () => {
  it('detecta y cuenta los filtros activos', () => {
    expect(hasActiveAdvancedFilters(EMPTY_ADVANCED_FILTERS)).toBe(false);
    expect(countActiveAdvancedFilters(EMPTY_ADVANCED_FILTERS)).toBe(0);

    const active = filters({
      type: 'fire',
      weakTo: 'rock',
      species: 'starter',
      minTotal: 500,
    });

    expect(hasActiveAdvancedFilters(active)).toBe(true);
    expect(countActiveAdvancedFilters(active)).toBe(4);
  });

  it('filtra por tipo y por especie', () => {
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ type: 'fire' }),
        true
      )
    ).toBe(true);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ type: 'water' }),
        true
      )
    ).toBe(false);
    expect(
      matchesAdvancedFilters(
        bulbasaur,
        charizardFilters,
        filters({ species: 'starter' }),
        true
      )
    ).toBe(true);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ species: 'starter' }),
        true
      )
    ).toBe(false);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ species: 'fossil' }),
        true
      )
    ).toBe(false);
  });

  it('filtra por efectividad ofensiva y defensiva', () => {
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ strongAgainst: 'grass' }),
        true
      )
    ).toBe(true);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ weakTo: 'rock' }),
        true
      )
    ).toBe(true);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ resists: 'grass' }),
        true
      )
    ).toBe(true);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ resists: 'water' }),
        true
      )
    ).toBe(false);
  });

  it('filtra por estadística y total', () => {
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ stat: 'speed', minStat: 100 }),
        true
      )
    ).toBe(true);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ stat: 'speed', minStat: 120 }),
        true
      )
    ).toBe(false);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ minTotal: 500 }),
        true
      )
    ).toBe(true);
    expect(
      matchesAdvancedFilters(
        charizard,
        charizardFilters,
        filters({ minTotal: 600 }),
        true
      )
    ).toBe(false);
  });

  it('deja pasar los datos mientras el índice no está listo', () => {
    expect(
      matchesAdvancedFilters(
        charizard,
        undefined,
        filters({ type: 'water' }),
        false
      )
    ).toBe(true);
    expect(
      matchesAdvancedFilters(
        charizard,
        undefined,
        filters({ type: 'water' }),
        true
      )
    ).toBe(false);
  });
});
