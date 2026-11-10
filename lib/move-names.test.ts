import { describe, expect, it } from 'vitest';
import moveNames from './move-names-es.json';
import versionNames from './version-names-es.json';

const names = moveNames as Record<string, string>;
const versions = versionNames as Record<string, string>;

describe('nombres de movimientos en español', () => {
  it('traduce movimientos habituales', () => {
    expect(names.tackle).toBe('Placaje');
    expect(names['quick-attack']).toBe('Ataque Rápido');
    expect(names.thunderbolt).toBe('Rayo');
    expect(names.earthquake).toBe('Terremoto');
  });

  it('no contiene traducciones vacías', () => {
    const entries = Object.entries(names);

    expect(entries.length).toBeGreaterThan(900);
    expect(entries.every(([, name]) => name.trim().length > 0)).toBe(true);
  });

  it('traduce las versiones de los juegos', () => {
    expect(versions.blue).toBe('Azul');
    expect(versions.crystal).toBe('Cristal');
    expect(versions['alpha-sapphire']).toBe('Zafiro Alfa');
    expect(versions.scarlet).toBe('Escarlata');
  });
});
