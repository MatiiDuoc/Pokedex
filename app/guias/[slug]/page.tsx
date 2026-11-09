import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GameGuideView from '@/components/GameGuideView';
import { games, getGameBySlug } from '@/data/games';
import { getPokemonIndexRange } from '@/services/pokedexIndex';

export const revalidate = 604800;

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    return { title: 'Guía no encontrada' };
  }

  return {
    title: `${game.title}: guía completa | Pokédex + Guías`,
    description: `Guía de ${game.title}: pasos, ${game.challengeLabel.toLowerCase()}, Alto Mando, legendarios, exclusivas y Pokédex ${game.dexRange[0]}-${game.dexRange[1]}.`,
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) notFound();

  const pokemon = await getPokemonIndexRange(game.dexRange[0], game.dexRange[1]);

  return <GameGuideView game={game} pokemon={pokemon} />;
}
