import { describe, expect, it } from 'vitest';
import { games } from './games';
import { getVersionGroupInfo } from './versionGroups';

describe('catálogo de guías', () => {
  it('no tiene slugs duplicados', () => {
    const slugs = games.map((game) => game.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('incluye juegos principales y spin-offs', () => {
    const main = games.filter((game) => (game.category ?? 'main') === 'main');
    const spinOffs = games.filter((game) => game.category === 'spin-off');

    expect(main.length).toBeGreaterThanOrEqual(20);
    expect(spinOffs.length).toBeGreaterThanOrEqual(10);
  });

  it('los juegos principales tienen version-group y checklist amplia', () => {
    for (const game of games) {
      if (game.category === 'spin-off') continue;

      expect(getVersionGroupInfo(game.slug), game.slug).not.toBeNull();
      expect(game.gyms.length, game.slug).toBeGreaterThanOrEqual(5);
      expect(game.walkthrough.length, game.slug).toBeGreaterThanOrEqual(5);
      expect(game.completionChecklist.length, game.slug).toBeGreaterThanOrEqual(5);
      expect(game.dexRange[0], game.slug).toBeGreaterThan(0);
      expect(game.dexRange[1], game.slug).toBeGreaterThanOrEqual(game.dexRange[0]);
    }
  });

  it('los spin-offs están marcados sin Pokédex', () => {
    for (const game of games) {
      if (game.category !== 'spin-off') continue;
      expect(game.pokedexMode, game.slug).toBe('none');
      expect(game.walkthrough.length, game.slug).toBeGreaterThanOrEqual(4);
      expect(game.completionChecklist.length, game.slug).toBeGreaterThanOrEqual(5);
    }
  });

  it('todas las guías tienen datos mínimos', () => {
    for (const game of games) {
      expect(game.title.length, game.slug).toBeGreaterThan(3);
      expect(game.shortTitle.length, game.slug).toBeGreaterThan(3);
      expect(game.tips.length, game.slug).toBeGreaterThanOrEqual(4);
      expect(game.champion.length, game.slug).toBeGreaterThan(0);
    }
  });
});
