import { getIdFromResourceUrl, getArtworkUrl, getSpriteUrl } from '@/services/pokeapi';
import type { PokemonIndexEntry } from '@/types/pokemon';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const INDEX_REVALIDATE_SECONDS = 60 * 60 * 24 * 7; // 7 días
const NATIONAL_DEX_SIZE = 1025;

interface PokeApiListResponse {
  results: Array<{ name: string; url: string }>;
}

let indexPromise: Promise<PokemonIndexEntry[]> | null = null;

/**
 * Índice ligero del Pokédex Nacional. Se obtiene con una única petición a
 * PokeAPI y se reutiliza durante el build y en las peticiones posteriores.
 */
export async function getPokemonIndex(): Promise<PokemonIndexEntry[]> {
  if (!indexPromise) {
    indexPromise = fetch(
      `${POKEAPI_BASE}/pokemon?limit=${NATIONAL_DEX_SIZE}`,
      {
        next: { revalidate: INDEX_REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(20_000),
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`PokeAPI respondió ${response.status}`);
        }

        const data = (await response.json()) as PokeApiListResponse;

        return data.results
          .map((entry): PokemonIndexEntry | null => {
            const id = getIdFromResourceUrl(entry.url);
            if (id === null || id > NATIONAL_DEX_SIZE) return null;

            return {
              id,
              name: entry.name,
              spriteUrl: getSpriteUrl(id),
              artworkUrl: getArtworkUrl(id),
            };
          })
          .filter((entry): entry is PokemonIndexEntry => entry !== null)
          .sort((a, b) => a.id - b.id);
      })
      .catch((error) => {
        indexPromise = null;
        throw error;
      });
  }

  return indexPromise;
}

export async function getPokemonIndexRange(
  from: number,
  to: number
): Promise<PokemonIndexEntry[]> {
  const index = await getPokemonIndex();
  const min = Math.max(1, Math.min(from, to));
  const max = Math.min(NATIONAL_DEX_SIZE, Math.max(from, to));
  return index.filter((pokemon) => pokemon.id >= min && pokemon.id <= max);
}

export { NATIONAL_DEX_SIZE };
