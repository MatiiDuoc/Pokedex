import { describe, expect, it } from 'vitest';
import { validateLastGuideData } from './last-guide';

const valid = {
  slug: 'red-blue-green',
  title: 'Pokémon Rojo, Azul y Verde',
  region: 'Kanto',
  accent: 'from-red-500 to-orange-500',
  tab: 'pasos' as const,
  checklistTotal: 8,
  stepsTotal: 10,
  challengesTotal: 8,
  nextStep: 2,
  nextStepTitle: 'Ciudad Celeste y Monte Moon',
  updatedAt: 1_800_000_000_000,
};

describe('última guía guardada', () => {
  it('acepta una guía válida', () => {
    expect(validateLastGuideData(valid)).toEqual(valid);
  });

  it('rechaza pestañas, pasos y slugs inválidos', () => {
    expect(validateLastGuideData({ ...valid, tab: 'inventada' })).toBeNull();
    expect(validateLastGuideData({ ...valid, slug: 'x' })).toBeNull();
    expect(validateLastGuideData({ ...valid, nextStep: -2 })).toBeNull();
  });

  it('rechaza datos que no son un objeto', () => {
    expect(validateLastGuideData(null)).toBeNull();
    expect(validateLastGuideData('guía')).toBeNull();
  });
});
