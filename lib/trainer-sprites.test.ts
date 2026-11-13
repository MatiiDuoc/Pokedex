import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { games } from '@/data/games';
import { getTrainerSprites } from './trainer-sprites';

const NON_TRAINER_GYMS = new Set([
  'Kleavor',
  'Lilligant',
  'Arcanine',
  'Electrode',
  'Avalugg',
]);

const NON_TRAINER_CHAMPIONS = new Set(['Arceus', 'Rango A / Ange']);

describe('sprites de entrenadores', () => {
  it('asigna sprite a todos los gimnasios con entrenador', () => {
    for (const game of games) {
      if (game.category === 'spin-off') continue;

      for (const gym of game.gyms) {
        if (NON_TRAINER_GYMS.has(gym.leader) || gym.leader.startsWith('Rango ')) {
          expect(getTrainerSprites(gym.leader), `${game.slug}: ${gym.leader}`).toHaveLength(0);
          continue;
        }

        expect(
          getTrainerSprites(gym.leader).length,
          `${game.slug}: ${gym.leader}`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('asigna sprite a los campeones que son entrenadores', () => {
    for (const game of games) {
      if (game.category === 'spin-off') continue;
      if (NON_TRAINER_CHAMPIONS.has(game.champion)) continue;

      expect(
        getTrainerSprites(game.champion).length,
        `${game.slug}: ${game.champion}`
      ).toBeGreaterThan(0);
    }
  });

  it('devuelve varios sprites para líderes compartidos', () => {
    expect(getTrainerSprites('Tate y Liza')).toHaveLength(2);
    expect(getTrainerSprites('Cilan / Chili / Cress')).toHaveLength(3);
    expect(getTrainerSprites('Bea / Allister')).toHaveLength(2);
    expect(getTrainerSprites('Gordie / Melony')).toHaveLength(2);
  });

  it('resuelve alias y nombres con paréntesis', () => {
    expect(getTrainerSprites('Azul (rival)')[0]?.id).toBe('blue');
    expect(getTrainerSprites('Lt. Surge')[0]?.id).toBe('ltsurge');
    expect(getTrainerSprites('Crasher Wake')[0]?.id).toBe('crasherwake');
  });

  it('todos los sprites referenciados existen en public/trainers', () => {
    const publicDir = join(process.cwd(), 'public');

    for (const game of games) {
      const names = [
        ...game.gyms.map((gym) => gym.leader),
        ...game.eliteFour.map((member) => member.name),
        game.champion,
      ];

      for (const name of names) {
        for (const sprite of getTrainerSprites(name)) {
          expect(existsSync(join(publicDir, sprite.src)), sprite.src).toBe(true);
        }
      }
    }
  });
});
