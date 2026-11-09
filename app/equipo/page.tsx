import type { Metadata } from 'next';
import TeamBuilder from '@/components/TeamBuilder';

export const metadata: Metadata = {
  title: 'Team Builder',
  description:
    'Analiza tu equipo Pokémon: cobertura de tipos, debilidades compartidas y huecos libres.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TeamPage() {
  return <TeamBuilder />;
}
