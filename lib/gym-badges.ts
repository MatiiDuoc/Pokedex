import type { GameGym } from '@/types/game';

const BADGE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges';
const ITEM_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

export interface GymBadgeVisual {
  imageUrls: string[];
  fallbackText?: string;
  type: string;
  label: string;
}

type BadgeEntry = number | string | number[];

/**
 * Insignias de los juegos principales. Los sprites numerados de PokeAPI
 * siguen el orden de las insignias de cada región. Las entradas con varios
 * números representan insignias que cambian según la versión.
 */
const BADGE_ENTRIES: Record<string, BadgeEntry[]> = {
  'red-blue-green': [1, 2, 3, 4, 5, 6, 7, 8],
  yellow: [1, 2, 3, 4, 5, 6, 7, 8],
  'firered-leafgreen': [1, 2, 3, 4, 5, 6, 7, 8],
  'lets-go-pikachu-eevee': [1, 2, 3, 4, 5, 6, 7, 8],

  'gold-silver': [9, 10, 11, 12, 13, 14, 15, 16],
  crystal: [9, 10, 11, 12, 13, 14, 15, 16],
  'heartgold-soulsilver': [9, 10, 11, 12, 13, 14, 15, 16],

  'ruby-sapphire': [17, 18, 19, 20, 21, 22, 23, 24],
  emerald: [17, 18, 19, 20, 21, 22, 23, 24],
  'omega-ruby-alpha-sapphire': [17, 18, 19, 20, 21, 22, 23, 24],

  'diamond-pearl': [25, 26, 27, 28, 29, 30, 31, 32],
  platinum: [25, 26, 27, 28, 29, 30, 31, 32],
  'brilliant-diamond-shining-pearl': [25, 26, 27, 28, 29, 30, 31, 32],

  'black-white': [33, 34, 35, 36, 37, 38, 39, 40],
  'black2-white2': [34, 35, 36, 37, 38, 39, 40, 60],

  xy: [41, 42, 43, 44, 45, 46, 47, 48],

  'sword-shield': [49, 50, 51, [52, 53], 54, [55, 56], 57, 58],

  'sun-moon': [
    'normalium-z--bag',
    'waterium-z--bag',
    'firium-z--bag',
    'grassium-z--bag',
    'electrium-z--bag',
    'ghostium-z--bag',
    'fairium-z--bag',
  ],
  'ultra-sun-ultra-moon': [
    'normalium-z--bag',
    'waterium-z--bag',
    'firium-z--bag',
    'grassium-z--bag',
    'electrium-z--bag',
    'ghostium-z--bag',
    'fairium-z--bag',
  ],

  'scarlet-violet': [70, 71, 72, 73, 74, 75, 76, 77],
};

export function getGymBadgeVisual(
  gameSlug: string,
  gymIndex: number,
  gym: GameGym
): GymBadgeVisual {
  const entry = BADGE_ENTRIES[gameSlug]?.[gymIndex];
  let imageUrls: string[] = [];

  if (typeof entry === 'number') {
    imageUrls = [`${BADGE_BASE}/${entry}.png`];
  } else if (Array.isArray(entry)) {
    imageUrls = entry.map((id) => `${BADGE_BASE}/${id}.png`);
  } else if (typeof entry === 'string') {
    imageUrls = [`${ITEM_BASE}/${entry}.png`];
  }

  return {
    imageUrls,
    fallbackText:
      gameSlug === 'legends-z-a'
        ? gym.badge.replace(/^Rango\s*/i, '')
        : undefined,
    type: gym.type,
    label: gym.badge,
  };
}
