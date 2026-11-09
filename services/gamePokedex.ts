import {
  getArtworkUrl,
  getIdFromResourceUrl,
  getShinyArtworkUrl,
  getShinySpriteUrl,
  getSpriteUrl,
} from '@/services/pokeapi';
import { getLegendaryCategory } from '@/lib/pokemon';
import { getPokemonIndexRange } from '@/services/pokedexIndex';
import type { PokemonIndexEntry } from '@/types/pokemon';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const cache = new Map<string, Promise<PokemonIndexEntry[]>>();

interface NamedResource {
  name: string;
  url: string;
}

interface VersionGroupResponse {
  pokedexes: NamedResource[];
}

interface PokedexResponse {
  pokemon_entries: Array<{
    entry_number: number;
    pokemon_species: NamedResource;
  }>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`PokeAPI respondió ${response.status} para ${url}`);
  }

  return (await response.json()) as T;
}

async function fetchVersionGroup(versionGroup: string): Promise<PokemonIndexEntry[]> {
  const group = await fetchJson<VersionGroupResponse>(
    `${POKEAPI_BASE}/version-group/${versionGroup}`
  );

  const dexLists = await Promise.all(
    group.pokedexes.map((pokedex) => fetchJson<PokedexResponse>(pokedex.url))
  );

  const entries = new Map<number, PokemonIndexEntry>();

  for (const dex of dexLists) {
    for (const entry of dex.pokemon_entries) {
      const id = getIdFromResourceUrl(entry.pokemon_species.url);
      if (id === null || id > 1025 || entries.has(id)) continue;

      entries.set(id, {
        id,
        name: entry.pokemon_species.name,
        spriteUrl: getSpriteUrl(id),
        artworkUrl: getArtworkUrl(id),
        shinySpriteUrl: getShinySpriteUrl(id),
        shinyArtworkUrl: getShinyArtworkUrl(id),
        legendaryCategory: getLegendaryCategory(id),
      });
    }
  }

  return Array.from(entries.values()).sort((a, b) => a.id - b.id);
}

/**
 * Devuelve el Pokédex regional oficial de un version-group. Si PokeAPI falla,
 * usa el rango nacional como respaldo para que la guía nunca se rompa.
 */
async function safeFallback(
  fallbackRange: [number, number]
): Promise<PokemonIndexEntry[]> {
  try {
    return await getPokemonIndexRange(fallbackRange[0], fallbackRange[1]);
  } catch (error) {
    console.error('No se pudo cargar el Pokédex de respaldo:', error);
    return [];
  }
}

export async function getGamePokedex(
  versionGroup: string | null,
  fallbackRange: [number, number]
): Promise<PokemonIndexEntry[]> {
  if (!versionGroup) {
    return safeFallback(fallbackRange);
  }

  let promise = cache.get(versionGroup);

  if (!promise) {
    promise = fetchVersionGroup(versionGroup).catch((error) => {
      console.error(`No se pudo cargar el Pokédex de ${versionGroup}:`, error);
      cache.delete(versionGroup);
      return [] as PokemonIndexEntry[];
    });
    cache.set(versionGroup, promise);
  }

  const entries = await promise;
  if (entries.length > 0) return entries;

  return safeFallback(fallbackRange);
}
