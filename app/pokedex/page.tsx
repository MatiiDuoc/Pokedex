import type { Metadata } from 'next';
import PokedexExplorer from '@/components/PokedexExplorer';
import { getPokemonIndex } from '@/services/pokedexIndex';

export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'Pokédex completa | Pokédex + Guías',
  description:
    'Consulta las 1025 especies del Pokédex Nacional con búsqueda por nombre, número y generación.',
};

export default async function PokedexPage() {
  const pokemon = await getPokemonIndex();

  return <PokedexExplorer pokemon={pokemon} />;
}
