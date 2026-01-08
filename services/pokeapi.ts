export interface PokemonBasic {
  name: string;
  url: string;
  id: number;
  height: number;
  weight: number;
  types: string[];
  stats: Array<{ name: string; value: number }>;
  spriteUrl: string;
  model3dUrl: string;
}

export interface PaginatedResponse {
  pokemon: PokemonBasic[];
  total: number;
  hasMore: boolean;
}

// Obtener total de Pokémon disponibles
export async function getTotalPokemon(): Promise<number> {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1');
  const data = await response.json();
  return data.count; // Actualmente ~1300+ Pokémon
}

// Obtener Pokémon con paginación
export async function getPokemonPaginated(
  offset: number = 0,
  limit: number = 20
): Promise<PaginatedResponse> {
  const totalCount = await getTotalPokemon();
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
  );
  const data = await response.json();

  const pokemonWithDetails = await Promise.all(
    data.results.map(async (pokemon: any) => {
      const detailResponse = await fetch(pokemon.url);
      const details = await detailResponse.json();
      const pokemonId = details.id;

      return {
        name: pokemon.name,
        url: pokemon.url,
        id: pokemonId,
        height: details.height,
        weight: details.weight,
        types: details.types.map((t: any) => t.type.name),
        stats: details.stats.map((s: any) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
        spriteUrl: details.sprites.other['official-artwork'].front_default,
        model3dUrl: `https://cdn.jsdelivr.net/npm/pokémon-3d@latest/models/${pokemonId}.gltf`,
      };
    })
  );

  return {
    pokemon: pokemonWithDetails,
    total: totalCount,
    hasMore: offset + limit < totalCount,
  };
}

// Obtener Pokémon por generación
export async function getPokemonByGeneration(generation: number): Promise<PokemonBasic[]> {
  const generationRanges: Record<number, { offset: number; limit: number }> = {
    1: { offset: 0, limit: 151 },      // Kanto
    2: { offset: 151, limit: 100 },    // Johto
    3: { offset: 251, limit: 135 },    // Hoenn
    4: { offset: 386, limit: 107 },    // Sinnoh
    5: { offset: 493, limit: 156 },    // Unova
    6: { offset: 649, limit: 72 },     // Kalos
    7: { offset: 721, limit: 88 },     // Alola
    8: { offset: 809, limit: 96 },     // Galar
    9: { offset: 905, limit: 120 },    // Paldea (aprox)
  };

  const range = generationRanges[generation];
  if (!range) throw new Error('Generación no válida');

  const result = await getPokemonPaginated(range.offset, range.limit);
  return result.pokemon;
}