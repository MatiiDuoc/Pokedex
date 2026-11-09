import type {
  PaginatedResponse,
  PokemonBasic,
  PokemonStat,
} from '@/types/pokemon';
import { getGenerationFromId, getLegendaryCategory } from '@/lib/pokemon';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const REVALIDATE_SECONDS = 60 * 60 * 24; // 24 horas
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_POKEMON = 1025;

interface PokeApiNamedResource {
  name: string;
  url: string;
}

interface PokeApiListResponse {
  count: number;
  results: PokeApiNamedResource[];
}

interface PokeApiDetailResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{ slot: number; type: PokeApiNamedResource }>;
  stats: Array<{ base_stat: number; stat: PokeApiNamedResource }>;
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: { front_default: string | null };
    };
  };
}

async function fetchJson<T>(url: string, revalidate = REVALIDATE_SECONDS): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`PokeAPI respondió ${response.status} para ${url}`);
  }

  return (await response.json()) as T;
}

export function getArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function getSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function getShinyArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
}

export function getShinySpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
}

export function getIdFromResourceUrl(url: string): number | null {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match) return null;
  const id = Number.parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
}

/** Total de especies del Pokédex Nacional (sin formas alternativas). */
export async function getTotalPokemon(): Promise<number> {
  const data = await fetchJson<PokeApiListResponse>(
    `${POKEAPI_BASE}/pokemon-species?limit=1`
  );
  return Math.min(data.count, MAX_POKEMON);
}

async function getPokemonDetail(resource: PokeApiNamedResource): Promise<PokemonBasic | null> {
  try {
    const details = await fetchJson<PokeApiDetailResponse>(resource.url);
    const id = details.id;

    const officialArtwork =
      details.sprites.other?.['official-artwork']?.front_default ?? '';
    const spriteUrl = officialArtwork || details.sprites.front_default || getArtworkUrl(id);

    const stats: PokemonStat[] = details.stats.map((stat) => ({
      name: stat.stat.name,
      value: stat.base_stat,
    }));

    return {
      name: details.name,
      url: resource.url,
      id,
      height: details.height,
      weight: details.weight,
      types: details.types
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => entry.type.name),
      stats,
      spriteUrl,
      shinySpriteUrl: getShinySpriteUrl(id),
      shinyArtworkUrl: getShinyArtworkUrl(id),
      // La URL del modelo 3D se resuelve desde el visor.
      model3dUrl: '',
      generation: getGenerationFromId(id),
      legendaryCategory: getLegendaryCategory(id),
    };
  } catch (error) {
    console.error(`No se pudo cargar ${resource.name}:`, error);
    return null;
  }
}

/** Obtiene detalles de una lista concreta de IDs nacionales. */
export async function getPokemonByIds(ids: number[]): Promise<PokemonBasic[]> {
  const uniqueIds = Array.from(
    new Set(ids.filter((id) => Number.isInteger(id) && id >= 1 && id <= MAX_POKEMON))
  );

  const results: Array<PokemonBasic | null> = [];
  const batchSize = 20;

  for (let index = 0; index < uniqueIds.length; index += batchSize) {
    const batch = uniqueIds.slice(index, index + batchSize);
    const batchResults = await Promise.all(
      batch.map((id) =>
        getPokemonDetail({
          name: String(id),
          url: `${POKEAPI_BASE}/pokemon/${id}`,
        })
      )
    );
    results.push(...batchResults);
  }

  const byId = new Map(
    results
      .filter((pokemon): pokemon is PokemonBasic => pokemon !== null)
      .map((pokemon) => [pokemon.id, pokemon])
  );

  return uniqueIds
    .map((id) => byId.get(id))
    .filter((pokemon): pokemon is PokemonBasic => pokemon !== undefined);
}

/** Obtiene Pokémon con paginación y detalles básicos. */
export async function getPokemonPaginated(
  offset = 0,
  limit = 20
): Promise<PaginatedResponse> {
  const safeOffset = Math.max(0, Number.isFinite(offset) ? Math.floor(offset) : 0);
  const safeLimit = Math.min(
    MAX_POKEMON,
    Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : 20)
  );

  const [total, list] = await Promise.all([
    getTotalPokemon(),
    fetchJson<PokeApiListResponse>(
      `${POKEAPI_BASE}/pokemon?limit=${safeLimit}&offset=${safeOffset}`
    ),
  ]);

  // Procesamos en lotes para no saturar PokeAPI ni el runtime de Vercel.
  const batchSize = 40;
  const pokemonWithDetails: PokemonBasic[] = [];

  for (let index = 0; index < list.results.length; index += batchSize) {
    const batch = list.results.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map(getPokemonDetail));
    pokemonWithDetails.push(
      ...batchResults.filter((pokemon): pokemon is PokemonBasic => pokemon !== null)
    );
  }

  return {
    pokemon: pokemonWithDetails,
    total,
    hasMore: safeOffset + safeLimit < total,
  };
}

const GENERATION_RANGES: Record<number, { offset: number; limit: number }> = {
  1: { offset: 0, limit: 151 },
  2: { offset: 151, limit: 100 },
  3: { offset: 251, limit: 135 },
  4: { offset: 386, limit: 107 },
  5: { offset: 493, limit: 156 },
  6: { offset: 649, limit: 72 },
  7: { offset: 721, limit: 88 },
  8: { offset: 809, limit: 96 },
  9: { offset: 905, limit: 120 },
};

/** Obtiene los Pokémon de una generación concreta (1-9). */
export async function getPokemonByGeneration(
  generation: number
): Promise<PokemonBasic[]> {
  const range = GENERATION_RANGES[generation];
  if (!range) throw new Error('Generación no válida');

  const result = await getPokemonPaginated(range.offset, range.limit);
  return result.pokemon;
}
