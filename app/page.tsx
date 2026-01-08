import PokemonList from '@/components/PokemonList';
import PokemonTeam from '@/components/PokemonTeam';
import { getPokemonPaginated } from '@/services/pokeapi';

export default async function Home() {
  // Cargar los primeros 100 Pokémon por defecto
  const { pokemon, total } = await getPokemonPaginated(0, 100);

  return (
    <>
      <PokemonList pokemonData={pokemon} totalPokemon={total} />
      <PokemonTeam />
    </>
  );
}