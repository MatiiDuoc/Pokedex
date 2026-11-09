import { describe, expect, it } from 'vitest';
import {
  formatDexNumber,
  formatPokemonName,
  getGenerationFromId,
  getLegendaryCategory,
  getLegendaryLabel,
  getStatLabel,
  getTypeColorByLabel,
  getTypeLabel,
} from './pokemon';

describe('lib/pokemon', () => {
  it('asigna generaciones en los límites correctos', () => {
    expect(getGenerationFromId(1)).toBe(1);
    expect(getGenerationFromId(151)).toBe(1);
    expect(getGenerationFromId(152)).toBe(2);
    expect(getGenerationFromId(251)).toBe(2);
    expect(getGenerationFromId(252)).toBe(3);
    expect(getGenerationFromId(386)).toBe(3);
    expect(getGenerationFromId(493)).toBe(4);
    expect(getGenerationFromId(649)).toBe(5);
    expect(getGenerationFromId(721)).toBe(6);
    expect(getGenerationFromId(809)).toBe(7);
    expect(getGenerationFromId(905)).toBe(8);
    expect(getGenerationFromId(906)).toBe(9);
    expect(getGenerationFromId(1025)).toBe(9);
    expect(getGenerationFromId(2000)).toBe(9);
  });

  it('formatea nombres y números de Pokédex', () => {
    expect(formatPokemonName('mr-mime')).toBe('Mr Mime');
    expect(formatPokemonName('pikachu')).toBe('Pikachu');
    expect(formatDexNumber(1)).toBe('#0001');
    expect(formatDexNumber(1025)).toBe('#1025');
  });

  it('traduce tipos y estadísticas', () => {
    expect(getTypeLabel('fire')).toBe('Fuego');
    expect(getTypeLabel('unknown-type')).toBe('Unknown-type');
    expect(getStatLabel('special-attack')).toBe('Ataque Esp.');
    expect(getStatLabel('hp')).toBe('PS');
  });

  it('obtiene un color para tipos escritos en español', () => {
    expect(getTypeColorByLabel('Fuego')).toBe('bg-red-500');
    expect(getTypeColorByLabel('Agua / Hielo')).toBe('bg-blue-500');
    expect(getTypeColorByLabel('Desconocido')).toBe('bg-gray-400');
  });

  it('clasifica legendarios, míticos y ultraentes', () => {
    expect(getLegendaryCategory(150)).toBe('legendary');
    expect(getLegendaryCategory(151)).toBe('mythical');
    expect(getLegendaryCategory(793)).toBe('ultra-beast');
    expect(getLegendaryCategory(25)).toBe('none');
    expect(getLegendaryCategory(1025)).toBe('mythical');
    expect(getLegendaryCategory(1024)).toBe('legendary');

    expect(getLegendaryLabel('legendary')).toBe('Legendario');
    expect(getLegendaryLabel('mythical')).toBe('Mítico');
    expect(getLegendaryLabel('ultra-beast')).toBe('Ultraente');
    expect(getLegendaryLabel('none')).toBeNull();
  });
});
