import type { LegendaryCategory } from '@/types/pokemon';

export type SpeciesCategory =
  | 'all'
  | 'starter'
  | 'fossil'
  | 'pseudo'
  | 'baby'
  | 'paradox'
  | 'legendary'
  | 'mythical'
  | 'ultra-beast';

export const SPECIES_CATEGORY_OPTIONS: Array<{
  value: SpeciesCategory;
  label: string;
}> = [
  { value: 'all', label: 'Todas las especies' },
  { value: 'starter', label: 'Iniciales' },
  { value: 'fossil', label: 'Fósiles' },
  { value: 'pseudo', label: 'Pseudo-legendarios' },
  { value: 'baby', label: 'Bebés' },
  { value: 'paradox', label: 'Paradoja' },
  { value: 'legendary', label: 'Legendarios' },
  { value: 'mythical', label: 'Míticos' },
  { value: 'ultra-beast', label: 'Ultraentes' },
];

const STARTER_IDS = new Set([
  1, 4, 7,
  152, 155, 158,
  252, 255, 258,
  387, 390, 393,
  495, 498, 501,
  650, 653, 656,
  722, 725, 728,
  810, 813, 816,
  906, 909, 912,
]);

const FOSSIL_IDS = new Set([
  138, 140, 142,
  345, 347,
  408, 410,
  564, 566,
  696, 698,
  880, 881, 882, 883,
]);

const PSEUDO_IDS = new Set([
  149, 248, 373, 445, 635, 706, 784, 887, 998,
]);

const BABY_IDS = new Set([
  172, 173, 174, 175, 236, 238, 239, 240, 298, 360, 406, 433, 438, 439, 440,
  446, 447, 458,
]);

const PARADOX_IDS = new Set([
  984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 1005, 1006,
  1009, 1010, 1020, 1021, 1022, 1023,
]);

export function matchesSpeciesCategory(
  id: number,
  legendaryCategory: LegendaryCategory,
  category: SpeciesCategory
): boolean {
  if (category === 'all') return true;
  if (category === 'starter') return STARTER_IDS.has(id);
  if (category === 'fossil') return FOSSIL_IDS.has(id);
  if (category === 'pseudo') return PSEUDO_IDS.has(id);
  if (category === 'baby') return BABY_IDS.has(id);
  if (category === 'paradox') return PARADOX_IDS.has(id);
  return legendaryCategory === category;
}
