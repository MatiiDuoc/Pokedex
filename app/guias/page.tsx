import type { Metadata } from 'next';
import GameGuideList from '@/components/GameGuideList';
import { games } from '@/data/games';

export const metadata: Metadata = {
  title: 'Guías de todos los juegos Pokémon | Pokédex + Guías',
  description:
    'Guías paso a paso, gimnasios, Alto Mando, legendarios y Pokédex de todos los juegos principales de Pokémon.',
};

export default function GuidesPage() {
  return <GameGuideList games={games} />;
}
