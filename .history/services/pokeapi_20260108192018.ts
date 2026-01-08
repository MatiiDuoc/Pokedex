// services/pokeapi.ts
export async function getPokemon() {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
  const data = await response.json();

  // Obtener detalles de cada Pokémon
  const pokemonWithDetails = await Promise.all(
    data.results.map(async (pokemon: any) => {
      const detailResponse = await fetch(pokemon.url);
      const details = await detailResponse.json();
      return {
        name: pokemon.name,
        url: pokemon.url,
        id: details.id,
        height: details.height,
        weight: details.weight,
        types: details.types.map((t: any) => t.type.name),
        stats: details.stats.map((s: any) => ({
          name: s.stat.name,
          value: s.base_stat
        })),
        spriteUrl: details.sprites.other['official-artwork'].front_default
      };
    })
  );

  return pokemonWithDetails;
}