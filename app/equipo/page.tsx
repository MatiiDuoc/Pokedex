import type { Metadata } from 'next';
import TeamBuilder from '@/components/TeamBuilder';
import { getPokemonByIds } from '@/services/pokeapi';

export const revalidate = 86400;

const SUGGESTION_IDS = [
  3, 6, 9, 26, 65, 68, 94, 95, 123, 128, 130, 143, 149, 212, 248, 282, 445,
  448, 479, 612, 637, 700, 887,
];

export const metadata: Metadata = {
  title: 'Team Builder',
  description:
    'Analiza tu equipo Pokémon: cobertura de tipos, debilidades compartidas y sugerencias para cubrir huecos.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TeamPage() {
  const suggestions = await getPokemonByIds(SUGGESTION_IDS);

  return <TeamBuilder suggestions={suggestions} />;
}
