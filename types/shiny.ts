export const SHINY_METHODS = [
  'random',
  'masuda',
  'soft-reset',
  'sos',
  'chain',
  'dexnav',
  'outbreak',
  'sandwich',
  'dynamax-adventure',
] as const;

export type ShinyMethod = (typeof SHINY_METHODS)[number];

export interface ShinyHunt {
  id: string;
  pokemonId: number;
  pokemonName: string;
  gameSlug: string;
  gameTitle: string;
  method: ShinyMethod;
  encounters: number;
  hasShinyCharm: boolean;
  notes: string;
  startedAt: string;
  completedAt: string | null;
}

export const SHINY_HUNTS_SLUG = '__shiny__';
export const MAX_SHINY_HUNTS = 200;
