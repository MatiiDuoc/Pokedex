import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cobbleverseGuide } from '@/data/cobbleverse';
import {
  COBBLEVERSE_BADGE_FILES,
  COBBLEVERSE_TROPHIES,
  getCobbleverseBadgeUrl,
  getCobbleverseTrophyUrl,
} from './cobbleverse-badges';

const badgesDir = path.join(
  process.cwd(),
  'public',
  'cobbleverse',
  'badges'
);

describe('insignias y trofeos de Cobbleverse', () => {
  it('tiene las 32 insignias, todas únicas y con textura', () => {
    const files = Object.values(COBBLEVERSE_BADGE_FILES);

    expect(files).toHaveLength(32);
    expect(new Set(files).size).toBe(32);

    for (const file of files) {
      expect(existsSync(path.join(badgesDir, `${file}.png`))).toBe(true);
      expect(getCobbleverseBadgeUrl('Insignia inexistente')).toBeNull();
    }
  });

  it('cada gimnasio de la guía tiene una insignia propia', () => {
    const files = cobbleverseGuide.gyms.map(
      (gym) => COBBLEVERSE_BADGE_FILES[gym.badge]
    );

    expect(files.every(Boolean)).toBe(true);
    expect(new Set(files).size).toBe(cobbleverseGuide.gyms.length);
  });

  it('tiene los 4 trofeos de liga con textura', () => {
    expect(COBBLEVERSE_TROPHIES).toHaveLength(4);

    for (const trophy of COBBLEVERSE_TROPHIES) {
      expect(
        existsSync(path.join(badgesDir, `${trophy.file}.png`))
      ).toBe(true);
      expect(getCobbleverseTrophyUrl(trophy.file)).toBe(
        `/cobbleverse/badges/${trophy.file}.png`
      );
    }
  });
});
