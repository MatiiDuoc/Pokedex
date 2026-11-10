import { describe, expect, it } from 'vitest';
import {
  isValidPassword,
  isValidSlug,
  isValidUsername,
  validateProgressData,
  validateTeamData,
} from './validation';

describe('validación de cuenta y progreso', () => {
  it('valida nombres de usuario y contraseñas', () => {
    expect(isValidUsername('matias_1')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('con espacio')).toBe(false);
    expect(isValidUsername('acentuado_á')).toBe(false);
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('corta')).toBe(false);
    expect(isValidPassword('a'.repeat(129))).toBe(false);
  });

  it('valida slugs de guía', () => {
    expect(isValidSlug('red-blue-green')).toBe(true);
    expect(isValidSlug('x/y')).toBe(false);
    expect(isValidSlug('a')).toBe(false);
  });

  it('acepta y sanea progreso válido', () => {
    const result = validateProgressData({
      caught: [1, 25, 25, 0, 2000, 3.5],
      checklist: ['Completar la historia', 123, ''],
    });

    expect(result).toEqual({
      caught: [1, 25, 25],
      checklist: ['Completar la historia'],
    });
  });

  it('sanea las notas personales por paso', () => {
    const result = validateProgressData({
      caught: [],
      checklist: [],
      notes: {
        'step:0': '  Comprar Pociones antes de entrar  ',
        'step:1': '',
        [`x`.repeat(130)]: 'Clave demasiado larga',
        'step:2': 123,
      },
    });

    expect(result).toEqual({
      caught: [],
      checklist: [],
      notes: { 'step:0': 'Comprar Pociones antes de entrar' },
    });
  });

  it('rechaza progreso con forma inválida', () => {
    expect(validateProgressData(null)).toBeNull();
    expect(validateProgressData({ caught: 'no', checklist: [] })).toBeNull();
    expect(validateProgressData({ caught: [], checklist: 'no' })).toBeNull();
  });

  it('valida equipos de hasta 6 Pokémon sin duplicados', () => {
    const pokemon = {
      id: 25,
      name: 'pikachu',
      spriteUrl: 'https://example.com/25.png',
      types: ['electric'],
      stats: [{ name: 'hp', value: 35 }],
    };

    expect(validateTeamData([pokemon])).toHaveLength(1);
    expect(validateTeamData([pokemon, pokemon])).toBeNull();
    expect(validateTeamData([{ ...pokemon, id: 0 }])).toBeNull();
    expect(validateTeamData('no')).toBeNull();
  });
});
