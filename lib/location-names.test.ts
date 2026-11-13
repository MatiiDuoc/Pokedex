import { describe, expect, it } from 'vitest';
import {
  translateEncounterMethod,
  translateLocationName,
} from './location-names';

describe('nombres de localizaciones', () => {
  it('traduce las áreas de PokeAPI usando su localización base', () => {
    expect(translateLocationName('viridian-forest-area')).toBe('Bosque Verde');
    expect(translateLocationName('kanto-power-plant-area')).toBe(
      'Central de Energía'
    );
    expect(translateLocationName('pallet-town-area')).toBe('Pueblo Paleta');
    expect(translateLocationName('kanto-route-1-area')).toBe('Ruta 1');
    expect(translateLocationName('mt-coronet-2f')).toBe('Monte Corona');
    expect(translateLocationName('oreburgh-mine-1f')).toBe('Mina Pirita');
  });

  it('traduce las provincias de Paldea y las rutas sin mapeo directo', () => {
    expect(translateLocationName('south-province-area-one')).toBe(
      'Área 1 del sur'
    );
    expect(translateLocationName('west-province-area-three')).toBe(
      'Área 3 del oeste'
    );
    expect(translateLocationName('johto-route-29-area')).toBe('Ruta 29');
  });

  it('traduce los métodos de encuentro', () => {
    expect(translateEncounterMethod('walk')).toBe('Caminando');
    expect(translateEncounterMethod('gift')).toBe('Regalo');
    expect(translateEncounterMethod('super-rod')).toBe('Caña súper');
    expect(translateEncounterMethod('max-raid')).toBe('Maxincursión');
  });
});
