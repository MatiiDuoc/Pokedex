import PokemonList from '@/components/PokemonList';
import PokemonTeam from '@/components/PokemonTeam';
import { getPokemonPaginated } from '@/services/pokeapi';

// Habilitar ISR (Incremental Static Regeneration)
// Regenera la página cada 24 horas para mantener los datos actualizados
export const revalidate = 86400; // 24 horas en segundos

export default async function Home() {
  // Cargar los primeros 500 Pokémon para carga inicial rápida
  // Incluye todas las generaciones principales (Gen 1-4 completas + gran parte de Gen 5)
  // const { pokemon, total } = await getPokemonPaginated(0, 1025);
  const { pokemon, total } = await getPokemonPaginated(0, 500);

  return (
    <>
      <PokemonList pokemonData={pokemon} totalPokemon={total} />
      <PokemonTeam />
    </>
  );
}