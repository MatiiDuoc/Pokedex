import type { GameProgress } from '@/types/progress';
import type { PokemonBasic } from '@/types/pokemon';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const MAX_CAUGHT = 1025;
const MAX_CHECKLIST_ITEMS = 300;
const MAX_CHECKLIST_LENGTH = 200;
const MAX_NOTES = 120;
const MAX_NOTE_KEY_LENGTH = 120;
const MAX_NOTE_LENGTH = 1000;
const MAX_TEAM_SIZE = 6;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(username));
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{2,80}$/.test(slug);
}

export function validateProgressData(value: unknown): GameProgress | null {
  if (typeof value !== 'object' || value === null) return null;

  const candidate = value as Partial<GameProgress>;

  if (!Array.isArray(candidate.caught) || !Array.isArray(candidate.checklist)) {
    return null;
  }

  if (candidate.caught.length > MAX_CAUGHT) return null;
  if (candidate.checklist.length > MAX_CHECKLIST_ITEMS) return null;

  const caught = candidate.caught.filter(
    (id): id is number => Number.isInteger(id) && id >= 1 && id <= MAX_CAUGHT
  );

  const checklist = candidate.checklist.filter(
    (item): item is string =>
      typeof item === 'string' &&
      item.length > 0 &&
      item.length <= MAX_CHECKLIST_LENGTH
  );

  const seen = Array.from(
    new Set([
      ...(Array.isArray(candidate.seen) ? candidate.seen : []).filter(
        (id): id is number =>
          Number.isInteger(id) && id >= 1 && id <= MAX_CAUGHT
      ),
      ...caught,
    ])
  );

  let notes: Record<string, string> | undefined;

  if (
    candidate.notes &&
    typeof candidate.notes === 'object' &&
    !Array.isArray(candidate.notes)
  ) {
    const entries = Object.entries(candidate.notes)
      .filter(
        ([key, value]) =>
          key.length > 0 &&
          key.length <= MAX_NOTE_KEY_LENGTH &&
          typeof value === 'string'
      )
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(
        ([, value]) => value.length > 0 && value.length <= MAX_NOTE_LENGTH
      )
      .slice(0, MAX_NOTES);

    if (entries.length > 0) notes = Object.fromEntries(entries);
  }

  return notes
    ? { caught, seen, checklist, notes }
    : { caught, seen, checklist };
}

function isSafePokemon(value: unknown): value is PokemonBasic {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PokemonBasic>;

  return (
    typeof candidate.id === 'number' &&
    Number.isInteger(candidate.id) &&
    candidate.id >= 1 &&
    candidate.id <= 1025 &&
    typeof candidate.name === 'string' &&
    candidate.name.length <= 80 &&
    typeof candidate.spriteUrl === 'string' &&
    candidate.spriteUrl.length <= 500 &&
    Array.isArray(candidate.types) &&
    candidate.types.length <= 3 &&
    candidate.types.every((type) => typeof type === 'string' && type.length <= 30) &&
    Array.isArray(candidate.stats) &&
    candidate.stats.length <= 10
  );
}

export function validateTeamData(value: unknown): PokemonBasic[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > MAX_TEAM_SIZE) return null;
  if (!value.every(isSafePokemon)) return null;

  const ids = new Set(value.map((pokemon) => pokemon.id));
  if (ids.size !== value.length) return null;

  return value;
}

export { MAX_TEAM_SIZE };
