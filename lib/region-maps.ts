export interface RegionMapShape {
  label: string;
  paths: string[];
  circles?: Array<{ cx: number; cy: number; r: number }>;
  lines?: string[];
}

const GENERIC_MAP: RegionMapShape = {
  label: 'Región',
  paths: [
    'M 16,52 C 12,38 24,24 40,22 C 56,20 64,10 78,18 C 92,26 94,42 84,54 C 74,66 84,80 68,86 C 52,92 40,82 30,86 C 18,90 10,76 12,64 Z',
  ],
  circles: [{ cx: 84, cy: 70, r: 5 }],
};

const REGION_MAPS: Record<string, RegionMapShape> = {
  Kanto: {
    label: 'Kanto',
    paths: [
      'M 18,52 C 16,42 22,32 32,26 C 42,20 54,22 62,28 C 70,34 72,44 68,52 C 64,60 70,68 64,74 C 58,80 48,78 40,76 C 32,74 26,80 20,72 C 16,66 20,58 18,52 Z',
    ],
    circles: [
      { cx: 72, cy: 58, r: 4 },
      { cx: 64, cy: 84, r: 3 },
    ],
  },
  Johto: {
    label: 'Johto',
    paths: [
      'M 34,20 C 44,16 56,22 60,32 C 64,42 58,50 62,58 C 66,66 62,76 52,80 C 42,84 32,78 32,68 C 32,58 38,52 36,44 C 34,36 30,28 34,20 Z',
    ],
    circles: [{ cx: 68, cy: 40, r: 5 }],
  },
  Hoenn: {
    label: 'Hoenn',
    paths: [
      'M 22,54 C 18,42 28,30 42,26 C 55,22 66,28 72,38 C 76,46 72,54 76,62 C 80,70 74,80 64,82 C 54,84 48,76 40,74 C 32,72 26,66 24,58 Z',
    ],
    circles: [{ cx: 80, cy: 72, r: 5 }],
  },
  Sinnoh: {
    label: 'Sinnoh',
    paths: [
      'M 24,44 C 24,32 36,22 50,24 C 63,26 72,36 70,48 C 68,58 76,64 70,74 C 64,84 50,84 42,76 C 34,68 36,58 30,54 C 26,52 24,48 24,44 Z',
      'M 18,38 C 14,32 18,24 26,24 C 32,24 36,30 34,36 C 32,42 24,44 18,38 Z',
    ],
    lines: ['M 48,38 L 56,52 L 40,52 Z'],
  },
  Hisui: {
    label: 'Hisui',
    paths: [
      'M 24,44 C 24,32 36,22 50,24 C 63,26 72,36 70,48 C 68,58 76,64 70,74 C 64,84 50,84 42,76 C 34,68 36,58 30,54 C 26,52 24,48 24,44 Z',
      'M 18,38 C 14,32 18,24 26,24 C 32,24 36,30 34,36 C 32,42 24,44 18,38 Z',
    ],
    lines: ['M 48,34 L 58,54 L 38,54 Z'],
  },
  Unova: {
    label: 'Unova',
    paths: [
      'M 30,32 C 38,20 54,18 64,28 C 74,38 72,52 66,62 C 60,72 48,80 38,74 C 28,68 22,56 26,44 C 28,38 28,35 30,32 Z',
    ],
    circles: [{ cx: 52, cy: 58, r: 3 }],
    lines: ['M 36,34 C 44,44 48,54 44,68'],
  },
  Kalos: {
    label: 'Kalos',
    paths: [
      'M 50,18 C 58,14 66,20 64,30 C 62,38 72,42 74,52 C 76,62 68,68 60,66 C 52,64 48,74 40,76 C 32,78 24,70 28,60 C 32,50 24,44 28,34 C 32,24 42,22 50,18 Z',
    ],
    circles: [{ cx: 70, cy: 34, r: 3 }],
  },
  Alola: {
    label: 'Alola',
    paths: [],
    circles: [
      { cx: 26, cy: 40, r: 10 },
      { cx: 48, cy: 58, r: 12 },
      { cx: 70, cy: 36, r: 10 },
      { cx: 80, cy: 68, r: 7 },
    ],
  },
  Galar: {
    label: 'Galar',
    paths: [
      'M 36,18 C 46,14 56,20 58,30 C 60,40 54,48 60,58 C 66,68 60,80 48,82 C 36,84 28,74 32,64 C 36,54 30,46 34,36 C 38,26 32,22 36,18 Z',
    ],
    circles: [{ cx: 66, cy: 28, r: 4 }],
  },
  Paldea: {
    label: 'Paldea',
    paths: [
      'M 24,36 C 34,26 50,22 62,28 C 74,34 78,46 72,56 C 66,66 54,70 44,68 C 34,66 24,58 24,48 C 24,42 22,38 24,36 Z',
      'M 62,30 C 72,26 80,32 78,40 C 76,48 70,46 66,40 Z',
    ],
  },
  Orre: {
    label: 'Orre',
    paths: [
      'M 20,44 C 28,30 44,24 58,30 C 72,36 80,50 74,62 C 68,74 52,80 40,74 C 28,68 18,58 20,44 Z',
    ],
    lines: ['M 32,52 C 44,46 54,54 66,48'],
  },
  Fiore: {
    label: 'Fiore',
    paths: [
      'M 26,34 C 38,24 54,26 62,36 C 70,46 66,60 58,68 C 50,76 36,74 30,64 C 24,54 20,44 26,34 Z',
    ],
    circles: [{ cx: 72, cy: 62, r: 4 }],
  },
  Almia: {
    label: 'Almia',
    paths: [
      'M 24,42 C 30,28 46,22 60,28 C 74,34 78,48 70,60 C 62,72 48,78 36,72 C 24,66 18,56 24,42 Z',
    ],
    circles: [{ cx: 78, cy: 36, r: 4 }],
  },
  Oblivia: {
    label: 'Oblivia',
    paths: [
      'M 20,38 C 30,26 48,24 60,32 C 72,40 76,54 68,64 C 60,74 44,76 34,68 C 24,60 14,50 20,38 Z',
    ],
    circles: [
      { cx: 78, cy: 64, r: 4 },
      { cx: 32, cy: 72, r: 3 },
    ],
  },
  Ransei: {
    label: 'Ransei',
    paths: [
      'M 50,18 C 66,20 78,32 78,48 C 78,64 66,78 50,80 C 34,78 22,64 22,48 C 22,32 34,20 50,18 Z',
    ],
    lines: ['M 50,18 L 50,80', 'M 22,48 L 78,48'],
  },
  Lentil: {
    label: 'Lentil',
    paths: [
      'M 22,40 C 32,26 52,22 66,32 C 80,42 80,58 68,68 C 56,78 38,76 28,64 C 18,52 16,48 22,40 Z',
    ],
    circles: [{ cx: 78, cy: 72, r: 3 }],
  },
  Ferrum: {
    label: 'Ferrum',
    paths: [
      'M 30,30 C 44,20 62,24 70,38 C 78,52 70,68 56,74 C 42,80 26,70 24,54 C 22,42 24,34 30,30 Z',
    ],
  },
};

function normalizeRegion(region: string): string {
  if (region.startsWith('Kalos')) return 'Kalos';
  return region;
}

export function getRegionMap(region: string): RegionMapShape {
  return REGION_MAPS[normalizeRegion(region)] ?? GENERIC_MAP;
}
