import type { Metadata } from 'next';
import ShinyTracker from '@/components/ShinyTracker';
import { games } from '@/data/games';

export const metadata: Metadata = {
  title: 'Shiny Tracker',
  description:
    'Planifica y registra tus cacerías shiny: contador, método, probabilidad y notas por Pokémon y juego.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ShinyPage() {
  return (
    <ShinyTracker
      games={games.map((game) => ({
        slug: game.slug,
        title: game.shortTitle,
        generation: game.generation,
      }))}
    />
  );
}
