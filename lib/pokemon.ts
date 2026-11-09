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

const LEGENDARY_IDS = new Set([
  144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382,
  383, 384, 480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641,
  642, 643, 644, 645, 646, 716, 717, 718, 772, 773, 785, 786, 787, 788, 789,
  790, 791, 792, 800, 888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905,
  1001, 1002, 1003, 1004, 1007, 1008, 1009, 1010, 1014, 1015, 1016, 1017,
  1020, 1021, 1022, 1023, 1024,
]);

const MYTHICAL_IDS = new Set([
  151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720,
  721, 801, 802, 807, 808, 809, 893, 1025,
]);

const ULTRA_BEAST_IDS = new Set([
  793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806,
]);

export type LegendaryCategory = 'legendary' | 'mythical' | 'ultra-beast' | 'none';

export function getLegendaryCategory(id: number): LegendaryCategory {
  if (MYTHICAL_IDS.has(id)) return 'mythical';
  if (ULTRA_BEAST_IDS.has(id)) return 'ultra-beast';
  if (LEGENDARY_IDS.has(id)) return 'legendary';
  return 'none';
}

export function getLegendaryLabel(category: LegendaryCategory): string | null {
  switch (category) {
    case 'legendary':
      return 'Legendario';
    case 'mythical':
      return 'Mítico';
    case 'ultra-beast':
      return 'Ultraente';
    default:
      return null;
  }
}

export const LEGENDARY_FILTERS: Array<{
  value: LegendaryCategory | '';
  label: string;
}> = [
  { value: '', label: 'Todos' },
  { value: 'legendary', label: 'Legendarios' },
  { value: 'mythical', label: 'Míticos' },
  { value: 'ultra-beast', label: 'Ultraentes' },
];

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
