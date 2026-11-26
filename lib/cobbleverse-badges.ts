const BADGE_BASE = '/cobbleverse/badges';

/**
 * Insignias originales de COBBLEVERSE: Badges & Trophies (LUMYVERSE).
 * Se usan sin modificar, con atribución y licencia CC BY-NC-ND 4.0.
 */
export const COBBLEVERSE_BADGE_FILES: Record<string, string> = {
  'Insignia Roca': 'kanto_boulder_badge',
  'Insignia Cascada': 'kanto_cascade_badge',
  'Insignia Trueno': 'kanto_thunder_badge',
  'Insignia Arcoíris': 'kanto_rainbow_badge',
  'Insignia Alma': 'kanto_soul_badge',
  'Insignia Pantano': 'kanto_marsh_badge',
  'Insignia Volcán': 'kanto_volcano_badge',
  'Insignia Tierra': 'kanto_earth_badge',

  'Insignia Céfiro': 'johto_zephyr_badge',
  'Insignia Colmena': 'johto_hive_badge',
  'Insignia Planicie': 'johto_plain_badge',
  'Insignia Niebla': 'johto_fog_badge',
  'Insignia Tormenta': 'johto_storm_badge',
  'Insignia Mineral': 'johto_mineral_badge',
  'Insignia Glaciar': 'johto_glacier_badge',
  'Insignia Ascenso': 'johto_rising_badge',

  'Insignia Piedra': 'hoenn_stone_badge',
  'Insignia Nudillo': 'hoenn_knuckle_badge',
  'Insignia Dinamo': 'hoenn_dynamo_badge',
  'Insignia Calor': 'hoenn_heat_badge',
  'Insignia Equilibrio': 'hoenn_balance_badge',
  'Insignia Pluma': 'hoenn_feather_badge',
  'Insignia Mente': 'hoenn_mind_badge',
  'Insignia Lluvia': 'hoenn_rain_badge',

  'Insignia Carbón': 'sinnoh_coal_badge',
  'Insignia Bosque': 'sinnoh_forest_badge',
  'Insignia Cobre': 'sinnoh_cobble_badge',
  'Insignia Ciénaga': 'sinnoh_fen_badge',
  'Insignia Reliquia': 'sinnoh_relic_badge',
  'Insignia Mina': 'sinnoh_mine_badge',
  'Insignia Carámbano': 'sinnoh_icicle_badge',
  'Insignia Faro': 'sinnoh_beacon_badge',
};

export const COBBLEVERSE_TROPHIES = [
  { region: 'Kanto', file: 'kanto_league_trophy' },
  { region: 'Johto', file: 'johto_league_trophy' },
  { region: 'Hoenn', file: 'hoenn_league_trophy' },
  { region: 'Sinnoh', file: 'sinnoh_league_trophy' },
] as const;

export function getCobbleverseBadgeUrl(badge: string): string | null {
  const file = COBBLEVERSE_BADGE_FILES[badge];
  return file ? `${BADGE_BASE}/${file}.png` : null;
}

export function getCobbleverseTrophyUrl(file: string): string {
  return `${BADGE_BASE}/${file}.png`;
}
