export const TYPE_LABELS: Record<string, string> = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  grass: 'Planta',
  electric: 'Eléctrico',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada',
};

export const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400',
  ice: 'bg-cyan-400',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-700',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-700',
  dark: 'bg-gray-700',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
};

export const SPANISH_TYPE_TO_KEY: Record<string, string> = {
  normal: 'normal',
  fuego: 'fire',
  agua: 'water',
  planta: 'grass',
  eléctrico: 'electric',
  electrico: 'electric',
  hielo: 'ice',
  lucha: 'fighting',
  veneno: 'poison',
  tierra: 'ground',
  volador: 'flying',
  psíquico: 'psychic',
  psiquico: 'psychic',
  bicho: 'bug',
  roca: 'rock',
  fantasma: 'ghost',
  dragón: 'dragon',
  dragon: 'dragon',
  siniestro: 'dark',
  acero: 'steel',
  hada: 'fairy',
};

export function getTypeColorByLabel(label: string): string {
  const firstType = label.split('/')[0].trim().toLowerCase();
  const key = SPANISH_TYPE_TO_KEY[firstType];
  return key ? (TYPE_COLORS[key] ?? 'bg-gray-400') : 'bg-gray-400';
}

export const STAT_LABELS: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'Ataque Esp.',
  'special-defense': 'Defensa Esp.',
  speed: 'Velocidad',
};

export const GENERATION_REGIONS: Record<number, string> = {
  1: 'Kanto',
  2: 'Johto',
  3: 'Hoenn',
  4: 'Sinnoh',
  5: 'Unova',
  6: 'Kalos',
  7: 'Alola',
  8: 'Galar',
  9: 'Paldea',
};

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Convierte nombres de PokeAPI (pikachu, mr-mime) en algo legible. */
export function formatPokemonName(name: string): string {
  return name
    .split('-')
    .map((part) => capitalize(part))
    .join(' ');
}

export function formatDexNumber(id: number): string {
  return `#${id.toString().padStart(4, '0')}`;
}

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? capitalize(type);
}

export function getGenerationFromId(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

export function getStatLabel(stat: string): string {
  return STAT_LABELS[stat] ?? formatPokemonName(stat);
}
