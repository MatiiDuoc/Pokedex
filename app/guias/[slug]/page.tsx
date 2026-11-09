import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GameGuideView from '@/components/GameGuideView';
import { games, getGameBySlug } from '@/data/games';
import { getVersionGroupInfo } from '@/data/versionGroups';
import { getGamePokedex } from '@/services/gamePokedex';

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
    description: `Guía de ${game.title}: pasos, ${game.challengeLabel.toLowerCase()}, jefes, legendarios, exclusivas y checklist de completado.`,
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) notFound();

  const versionGroup = getVersionGroupInfo(game.slug);
  const hasPokedex = (game.pokedexMode ?? 'regional') !== 'none';
  const pokemon = hasPokedex
    ? await getGamePokedex(versionGroup?.versionGroup ?? null, game.dexRange)
    : [];

  return (
    <GameGuideView
      game={game}
      pokemon={pokemon}
      pokedexLabel={versionGroup?.pokedexLabel ?? game.dexScope}
    />
  );
}
