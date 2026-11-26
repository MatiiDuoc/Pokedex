export interface CobblemonHerdMember {
  pokemon: string;
  level: [number, number] | null;
  weight?: number;
}

export interface CobblemonSpawn {
  bucket: string;
  level: [number, number] | null;
  weight?: number;
  position?: string;
  biomes?: string[];
  time?: 'day' | 'night' | 'dusk' | null;
  weather?: { rain?: boolean; thunder?: boolean };
  structures?: string[];
  form?: string;
  presets?: string[];
  herd?: { maxSize?: number; members: CobblemonHerdMember[] };
  multipliers?: Array<{ x: number; when?: Record<string, unknown> }>;
}

export interface CobblemonSpawnsMeta {
  source: string;
  modpack: string;
  cobblemonVersion: string;
  generatedAt: string;
  implementedSpecies: number;
  spawnEntries: number;
  license: string;
}

export interface CobblemonSpawnsFile {
  meta: CobblemonSpawnsMeta;
  spawns: Record<string, CobblemonSpawn[]>;
}
