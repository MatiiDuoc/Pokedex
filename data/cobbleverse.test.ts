import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getGameBySlug } from './games';
import { cobbleverseGuide } from './cobbleverse';
import type { CobblemonSpawnsFile } from '@/types/cobblemon';

describe('guía de Cobbleverse', () => {
  it('está registrada en el catálogo y usa la Pokédex nacional', () => {
    const game = getGameBySlug('cobbleverse');

    expect(game).toBe(cobbleverseGuide);
    expect(game?.pokedexMode).toBe('regional');
    expect(game?.encounterSource).toBe('cobblemon');
    expect(game?.dexRange).toEqual([1, 1025]);
  });

  it('incluye las cuatro ligas y una checklist amplia', () => {
    expect(cobbleverseGuide.gyms).toHaveLength(32);
    expect(cobbleverseGuide.eliteFour).toHaveLength(16);
    expect(cobbleverseGuide.walkthrough.length).toBeGreaterThanOrEqual(8);
    expect(cobbleverseGuide.completionChecklist.length).toBeGreaterThanOrEqual(
      10
    );
  });

  it('los spawns generados conservan los conteos esperados', () => {
    const metaPath = path.join(
      process.cwd(),
      'public',
      'cobbleverse',
      'meta.json'
    );
    const spawnsPath = path.join(
      process.cwd(),
      'public',
      'cobbleverse',
      'spawns.json'
    );

    const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as {
      counts: { implementedSpecies: number; spawnEntries: number };
    };
    const data = JSON.parse(
      readFileSync(spawnsPath, 'utf8')
    ) as CobblemonSpawnsFile;

    expect(meta.counts.implementedSpecies).toBe(905);
    expect(meta.counts.spawnEntries).toBe(5176);
    expect(Object.keys(data.spawns).length).toBeGreaterThan(800);
    expect(data.spawns['1']?.length).toBeGreaterThan(0);
  });
});
