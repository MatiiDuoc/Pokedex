import type { CobblemonSpawnsFile } from '@/types/cobblemon';

let spawnsPromise: Promise<CobblemonSpawnsFile> | null = null;

/** Carga una sola vez el JSON de spawns de Cobblemon. */
export function loadCobblemonSpawns(): Promise<CobblemonSpawnsFile> {
  if (!spawnsPromise) {
    spawnsPromise = fetch('/cobbleverse/spawns.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `No se pudieron cargar los spawns de Cobblemon (${response.status})`
          );
        }
        return response.json() as Promise<CobblemonSpawnsFile>;
      })
      .catch((error) => {
        spawnsPromise = null;
        throw error;
      });
  }

  return spawnsPromise;
}

const BUCKET_LABELS: Record<string, string> = {
  common: 'Común',
  uncommon: 'Poco común',
  rare: 'Raro',
  'ultra-rare': 'Ultra raro',
  boss: 'Jefe',
};

export function formatCobblemonBucket(bucket: string): string {
  return BUCKET_LABELS[bucket] ?? formatToken(bucket);
}

export function cobblemonBucketClass(bucket: string): string {
  switch (bucket) {
    case 'common':
      return 'bg-emerald-100 text-emerald-800';
    case 'uncommon':
      return 'bg-sky-100 text-sky-800';
    case 'rare':
      return 'bg-amber-100 text-amber-900';
    case 'ultra-rare':
      return 'bg-fuchsia-100 text-fuchsia-800';
    case 'boss':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

const BIOME_LABELS: Record<string, string> = {
  overworld: 'Superficie',
  jungle: 'Jungla',
  sparse_jungle: 'Jungla dispersa',
  bamboo_jungle: 'Jungla de bambú',
  forest: 'Bosque',
  flower_forest: 'Bosque de flores',
  birch_forest: 'Bosque de abedules',
  old_growth_birch_forest: 'Bosque de abedules ancestral',
  dark_forest: 'Bosque oscuro',
  cherry_grove: 'Bosque de cerezos',
  taiga: 'Taiga',
  snowy_taiga: 'Taiga nevada',
  old_growth_pine_taiga: 'Taiga de pinos ancestral',
  old_growth_spruce_taiga: 'Taiga de abetos ancestral',
  plains: 'Llanuras',
  sunflower_plains: 'Llanuras de girasoles',
  snowy_plains: 'Llanuras nevadas',
  desert: 'Desierto',
  savanna: 'Sabana',
  windswept_savanna: 'Sabana ventosa',
  swamp: 'Pantano',
  mangrove_swamp: 'Pantano de manglares',
  beach: 'Playa',
  snowy_beach: 'Playa nevada',
  stony_shore: 'Costa rocosa',
  river: 'Río',
  ocean: 'Océano',
  warm_ocean: 'Océano cálido',
  lukewarm_ocean: 'Océano templado',
  cold_ocean: 'Océano frío',
  deep_ocean: 'Océano profundo',
  deep_cold_ocean: 'Océano frío profundo',
  deep_lukewarm_ocean: 'Océano templado profundo',
  frozen_ocean: 'Océano helado',
  cave: 'Cueva',
  lush_cave: 'Cueva frondosa',
  dripstone_cave: 'Cueva de estalactitas',
  deep_dark: 'Deep Dark',
  windswept_hills: 'Colinas ventosas',
  windswept_forest: 'Bosque ventoso',
  badlands: 'Badlands',
  eroded_badlands: 'Badlands erosionadas',
  wooded_badlands: 'Badlands boscosas',
  ice_spikes: 'Picos de hielo',
  frozen_peaks: 'Picos helados',
  jagged_peaks: 'Picos escarpados',
  stony_peaks: 'Picos rocosos',
  snowy_slopes: 'Laderas nevadas',
  mushroom_fields: 'Campos de setas',
  meadow: 'Pradera',
  grove: 'Arboleda',
  nether: 'Nether',
  nether_wastes: 'Páramo del Nether',
  soul_sand_valley: 'Valle de arena de almas',
  crimson_forest: 'Bosque carmesí',
  warped_forest: 'Bosque distorsionado',
  basalt_deltas: 'Deltas de basalto',
  end: 'End',
  the_end: 'End',
  end_highlands: 'End: tierras altas',
  end_midlands: 'End: tierras medias',
  small_end_islands: 'End: islas pequeñas',
  end_barrens: 'End: yermos',
  the_void: 'El vacío',
  ocean_floor: 'Fondo marino',
  underwater: 'Submarino',
  mountain: 'Montaña',
  mountains: 'Montañas',
  hills: 'Colinas',
  sky: 'Cielo',
};

export function formatCobblemonBiome(value: string): string {
  const raw = value.replace(/^#/, '');
  const path = raw.includes(':') ? raw.split(':').slice(1).join(':') : raw;
  const key = path.replace(/^is_/, '');
  return BIOME_LABELS[key] ?? formatToken(key);
}

const POSITION_LABELS: Record<string, string> = {
  grounded: 'Suelo',
  fishing: 'Pesca',
  submerged: 'Sumergido',
  surface: 'Superficie',
  seafloor: 'Fondo marino',
};

export function formatCobblemonPosition(position: string): string {
  return POSITION_LABELS[position] ?? formatToken(position);
}

export function formatCobblemonTime(time?: string | null): string | null {
  if (!time) return null;
  if (time === 'day') return 'Día';
  if (time === 'night') return 'Noche';
  if (time === 'dusk') return 'Atardecer';
  return formatToken(time);
}

export function describeCobblemonWeather(
  weather?: { rain?: boolean; thunder?: boolean }
): string | null {
  if (!weather) return null;

  const parts: string[] = [];
  if (weather.rain === true) parts.push('Lluvia');
  if (weather.rain === false) parts.push('Sin lluvia');
  if (weather.thunder === true) parts.push('Tormenta');
  if (weather.thunder === false) parts.push('Sin tormenta');

  return parts.length > 0 ? parts.join(' · ') : null;
}

const STRUCTURE_LABELS: Record<string, string> = {
  graveyard: 'Cementerio',
  mansion: 'Mansión',
  stronghold: 'Fortaleza',
  ancient_city: 'Ciudad ancestral',
  village: 'Aldea',
  pillager_outpost: 'Puesto de saqueadores',
  ruined_portal: 'Portal en ruinas',
  shipwreck: 'Naufragio',
  ocean_ruin: 'Ruina oceánica',
  buried_treasure: 'Tesoro enterrado',
  trial_chambers: 'Cámaras de desafío',
  monument: 'Monumento oceánico',
  fortress: 'Fortaleza del Nether',
  bastion: 'Bastión',
  end_city: 'Ciudad del End',
};

export function formatCobblemonStructure(value: string): string {
  const raw = value.replace(/^#/, '');
  const path = raw.includes(':') ? raw.split(':').slice(1).join(':') : raw;
  const key = path.replace(/^spawns\//, '').replace(/^is_/, '');
  return STRUCTURE_LABELS[key] ?? formatToken(key);
}

export function formatCobblemonLevel(
  level: [number, number] | null
): string | null {
  if (!level) return null;
  return level[0] === level[1]
    ? `Nv. ${level[0]}`
    : `Nv. ${level[0]}-${level[1]}`;
}

export function formatCobblemonForm(form: string): string {
  const tokens = form.split(/\s+/);
  const formPart = tokens.length > 1 ? tokens.slice(1).join(' ') : form;
  return formPart
    .split(/[\s=]+/)
    .filter(Boolean)
    .map(formatToken)
    .join(' ');
}

export function formatCobblemonHerdPokemon(pokemon: string): string {
  const [base, ...rest] = pokemon.split(/\s+/);
  const name = base.charAt(0).toUpperCase() + base.slice(1);
  return rest.length > 0 ? `${name} (${formatToken(rest.join(' '))})` : name;
}

function formatToken(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
