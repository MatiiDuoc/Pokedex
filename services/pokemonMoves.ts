const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const TIMEOUT_MS = 20_000;

interface NamedResource {
  name: string;
  url: string;
}

interface PokemonMovesResponse {
  moves: Array<{
    move: NamedResource;
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: NamedResource;
      version_group: NamedResource;
    }>;
  }>;
}

interface MoveResponse {
  name: string;
  type: NamedResource;
  damage_class: NamedResource;
  power: number | null;
  accuracy: number | null;
}

export type MoveMethod = 'level-up' | 'machine' | 'tutor' | 'egg';

export interface LearnedMove {
  name: string;
  level: number | null;
  method: MoveMethod;
  type: string | null;
  damageClass: string | null;
  power: number | null;
  accuracy: number | null;
}

export interface PokemonMoveSet {
  levelUp: LearnedMove[];
  machine: LearnedMove[];
  tutor: LearnedMove[];
  egg: LearnedMove[];
}

const cache = new Map<string, Promise<PokemonMoveSet>>();

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`PokeAPI respondió ${response.status} para ${url}`);
  }

  return (await response.json()) as T;
}

async function getMoveDetails(
  names: string[]
): Promise<Map<string, MoveResponse>> {
  const details = new Map<string, MoveResponse>();
  const batchSize = 8;

  for (let index = 0; index < names.length; index += batchSize) {
    const batch = names.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map(async (name) => {
        try {
          return await fetchJson<MoveResponse>(`${POKEAPI_BASE}/move/${name}`);
        } catch {
          return null;
        }
      })
    );

    for (const result of results) {
      if (result) details.set(result.name, result);
    }
  }

  return details;
}

export async function getPokemonMoves(
  id: number,
  versionGroup: string
): Promise<PokemonMoveSet> {
  const key = `${id}:${versionGroup}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const data = await fetchJson<PokemonMovesResponse>(
      `${POKEAPI_BASE}/pokemon/${id}`
    );

    const levelUp: LearnedMove[] = [];
    const machine: LearnedMove[] = [];
    const tutor: LearnedMove[] = [];
    const egg: LearnedMove[] = [];

    for (const entry of data.moves) {
      const detail = entry.version_group_details.find(
        (item) => item.version_group.name === versionGroup
      );
      if (!detail) continue;

      const method = detail.move_learn_method.name as MoveMethod;
      if (!['level-up', 'machine', 'tutor', 'egg'].includes(method)) continue;

      const move: LearnedMove = {
        name: entry.move.name,
        level: method === 'level-up' ? detail.level_learned_at : null,
        method,
        type: null,
        damageClass: null,
        power: null,
        accuracy: null,
      };

      if (method === 'level-up') levelUp.push(move);
      else if (method === 'machine') machine.push(move);
      else if (method === 'tutor') tutor.push(move);
      else egg.push(move);
    }

    const levelUpDetails = await getMoveDetails(
      Array.from(new Set(levelUp.map((move) => move.name)))
    );

    for (const move of levelUp) {
      const detail = levelUpDetails.get(move.name);
      if (!detail) continue;
      move.type = detail.type.name;
      move.damageClass = detail.damage_class.name;
      move.power = detail.power;
      move.accuracy = detail.accuracy;
    }

    levelUp.sort(
      (a, b) =>
        (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name)
    );
    machine.sort((a, b) => a.name.localeCompare(b.name));
    tutor.sort((a, b) => a.name.localeCompare(b.name));
    egg.sort((a, b) => a.name.localeCompare(b.name));

    return { levelUp, machine, tutor, egg };
  })();

  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}
