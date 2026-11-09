import type { Metadata } from 'next';
import GlobalSearch from '@/components/GlobalSearch';
import { games } from '@/data/games';
import { getPokemonIndex } from '@/services/pokedexIndex';

export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'Buscar Pokémon y guías',
  description:
    'Búsqueda global de Pokémon por nombre, número, tipo y generación, además de guías de juegos principales y spin-offs.',
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    generation?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [{ q, type, generation }, pokemon] = await Promise.all([
    searchParams,
    getPokemonIndex(),
  ]);

  return (
    <GlobalSearch
      pokemon={pokemon}
      games={games}
      initialQuery={q ?? ''}
      initialType={type ?? ''}
      initialGeneration={generation ?? ''}
    />
  );
}
