import { TYPE_LABELS } from '@/lib/pokemon';

export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

type Effectiveness = 0 | 0.5 | 1 | 2;

/**
 * Tabla de efectividad de tipos (atacante → defensor). Los tipos no listados
 * tienen multiplicador 1.
 */
export const TYPE_CHART: Record<
  PokemonType,
  Partial<Record<PokemonType, Effectiveness>>
> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: {
    fire: 2,
    water: 0.5,
    grass: 0.5,
    ground: 2,
    rock: 2,
    dragon: 0.5,
  },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: {
    fighting: 2,
    poison: 2,
    psychic: 0.5,
    dark: 0,
    steel: 0.5,
  },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: {
    normal: 0,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
  },
  dragon: {
    dragon: 2,
    steel: 0.5,
    fairy: 0,
  },
  dark: {
    fighting: 0.5,
    psychic: 2,
    ghost: 2,
    dark: 0.5,
    fairy: 0.5,
  },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
};

export function isPokemonType(value: string): value is PokemonType {
  return (POKEMON_TYPES as readonly string[]).includes(value);
}

/**
 * Multiplicador de daño que recibe un Pokémon con esos tipos cuando le ataca
 * un tipo concreto. Un valor mayor que 1 significa debilidad.
 */
export function getDefensiveMultiplier(
  defendingTypes: string[],
  attackingType: PokemonType
): number {
  return defendingTypes
    .map((type) => type.toLowerCase())
    .filter(isPokemonType)
    .reduce(
      (multiplier, defendingType) =>
        multiplier * (TYPE_CHART[attackingType][defendingType] ?? 1),
      1
    );
}

/**
 * Mejor multiplicador ofensivo de los tipos del Pokémon contra un tipo
 * defensor. Un valor mayor que 1 significa que es fuerte contra ese tipo.
 */
export function getBestOffensiveMultiplier(
  attackingTypes: string[],
  defendingType: PokemonType
): number {
  const multipliers = attackingTypes
    .map((type) => type.toLowerCase())
    .filter(isPokemonType)
    .map((attackingType) => TYPE_CHART[attackingType][defendingType] ?? 1);

  return multipliers.length === 0 ? 1 : Math.max(...multipliers);
}

export interface TypeMultiplier {
  type: PokemonType;
  multiplier: number;
}

export interface TypeMatchups {
  weaknesses: TypeMultiplier[];
  resistances: TypeMultiplier[];
  immunities: TypeMultiplier[];
}

/** Calcula las debilidades, resistencias e inmunidades defensivas. */
export function getDefensiveMatchups(defendingTypes: string[]): TypeMatchups {
  const types = defendingTypes
    .map((type) => type.toLowerCase())
    .filter(isPokemonType);

  const multipliers: TypeMultiplier[] = POKEMON_TYPES.map((attackingType) => {
    let multiplier = 1;

    for (const defendingType of types) {
      const effectiveness = TYPE_CHART[attackingType][defendingType] ?? 1;
      multiplier *= effectiveness;
    }

    return { type: attackingType, multiplier };
  }).filter((entry) => entry.multiplier !== 1);

  return {
    weaknesses: multipliers
      .filter((entry) => entry.multiplier > 1)
      .sort((a, b) => b.multiplier - a.multiplier),
    resistances: multipliers
      .filter((entry) => entry.multiplier > 0 && entry.multiplier < 1)
      .sort((a, b) => a.multiplier - b.multiplier),
    immunities: multipliers.filter((entry) => entry.multiplier === 0),
  };
}

/** Tipos atacantes cubiertos por un equipo. */
export function getOffensiveCoverage(teamTypes: string[][]): PokemonType[] {
  const covered = new Set<PokemonType>();

  for (const types of teamTypes) {
    for (const type of types) {
      if (isPokemonType(type)) covered.add(type);
    }
  }

  return Array.from(covered);
}

export interface TeamWeakness {
  type: PokemonType;
  count: number;
}

/** Agrupa las debilidades del equipo y cuenta cuántos miembros las comparten. */
export function getTeamWeaknesses(teamTypes: string[][]): TeamWeakness[] {
  const counts = new Map<PokemonType, number>();

  for (const types of teamTypes) {
    const { weaknesses } = getDefensiveMatchups(types);
    for (const weakness of weaknesses) {
      counts.set(weakness.type, (counts.get(weakness.type) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

export function getTypeName(type: PokemonType): string {
  return TYPE_LABELS[type] ?? type;
}

export function formatMultiplier(multiplier: number): string {
  if (multiplier === 0) return '0×';
  if (multiplier === 0.25) return '¼×';
  if (multiplier === 0.5) return '½×';
  return `${multiplier}×`;
}
