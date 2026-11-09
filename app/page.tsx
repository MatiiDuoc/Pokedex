import PokemonList from '@/components/PokemonList';
import { getPokemonPaginated } from '@/services/pokeapi';

// ISR: los datos de PokeAPI cambian muy poco; regeneramos cada 24 horas.
export const revalidate = 86400;

export default async function Home() {
  const { pokemon, total } = await getPokemonPaginated(0, 500);

  return (
    <PokemonList
      pokemonData={pokemon}
      totalPokemon={total}
      loadedCount={pokemon.length}
    />
  );
}
