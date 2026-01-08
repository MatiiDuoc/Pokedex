import PokemonList from '@/components/PokemonList';
import { getPokemon } from '@/services/pokeapi';

export default async function Home() {
  const pokemonData = await getPokemon();

  return <PokemonList pokemonData={pokemonData} />;
}
  