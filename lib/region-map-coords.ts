export interface MapPoint {
  x: number;
  y: number;
}

const REGION_GYM_POSITIONS: Record<string, MapPoint[]> = {
  Kanto: [
    { x: 50, y: 30 },
    { x: 62, y: 26 },
    { x: 64, y: 58 },
    { x: 50, y: 46 },
    { x: 54, y: 74 },
    { x: 60, y: 48 },
    { x: 36, y: 82 },
    { x: 30, y: 56 },
  ],
  Johto: [
    { x: 40, y: 28 },
    { x: 36, y: 54 },
    { x: 50, y: 42 },
    { x: 52, y: 32 },
    { x: 28, y: 68 },
    { x: 34, y: 62 },
    { x: 60, y: 38 },
    { x: 62, y: 58 },
  ],
  Hoenn: [
    { x: 34, y: 34 },
    { x: 28, y: 60 },
    { x: 50, y: 48 },
    { x: 44, y: 32 },
    { x: 24, y: 52 },
    { x: 60, y: 34 },
    { x: 72, y: 64 },
    { x: 62, y: 52 },
  ],
  Sinnoh: [
    { x: 46, y: 68 },
    { x: 42, y: 38 },
    { x: 62, y: 54 },
    { x: 50, y: 76 },
    { x: 44, y: 54 },
    { x: 26, y: 50 },
    { x: 52, y: 24 },
    { x: 68, y: 68 },
  ],
  Unova: [
    { x: 54, y: 34 },
    { x: 44, y: 46 },
    { x: 58, y: 54 },
    { x: 48, y: 40 },
    { x: 42, y: 60 },
    { x: 56, y: 24 },
    { x: 50, y: 28 },
    { x: 62, y: 44 },
  ],
  Kalos: [
    { x: 36, y: 64 },
    { x: 30, y: 48 },
    { x: 40, y: 36 },
    { x: 50, y: 58 },
    { x: 58, y: 30 },
    { x: 62, y: 46 },
    { x: 54, y: 52 },
    { x: 48, y: 22 },
  ],
  Alola: [
    { x: 26, y: 34 },
    { x: 42, y: 54 },
    { x: 54, y: 62 },
    { x: 58, y: 52 },
    { x: 66, y: 32 },
    { x: 74, y: 42 },
    { x: 80, y: 68 },
  ],
  Galar: [
    { x: 40, y: 74 },
    { x: 58, y: 62 },
    { x: 62, y: 48 },
    { x: 44, y: 44 },
    { x: 50, y: 32 },
    { x: 36, y: 24 },
    { x: 48, y: 16 },
    { x: 60, y: 30 },
  ],
  Paldea: [
    { x: 38, y: 60 },
    { x: 46, y: 42 },
    { x: 66, y: 46 },
    { x: 56, y: 64 },
    { x: 48, y: 52 },
    { x: 60, y: 34 },
    { x: 34, y: 48 },
    { x: 52, y: 26 },
  ],
  Hisui: [
    { x: 42, y: 30 },
    { x: 52, y: 44 },
    { x: 62, y: 52 },
    { x: 46, y: 60 },
    { x: 38, y: 24 },
  ],
  Lumiose: [
    { x: 50, y: 52 },
    { x: 56, y: 44 },
    { x: 44, y: 44 },
    { x: 60, y: 56 },
    { x: 40, y: 56 },
    { x: 52, y: 36 },
    { x: 48, y: 64 },
    { x: 66, y: 46 },
    { x: 34, y: 48 },
  ],
};

function normalizeRegion(region: string): string {
  if (region === 'Kalos (Lumiose)') return 'Lumiose';
  if (region.startsWith('Kalos')) return 'Kalos';
  return region;
}

export function getRegionGymPositions(region: string): MapPoint[] {
  return REGION_GYM_POSITIONS[normalizeRegion(region)] ?? [];
}
