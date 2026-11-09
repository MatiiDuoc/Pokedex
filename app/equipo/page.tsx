import type { Metadata } from 'next';
import TeamBuilder from '@/components/TeamBuilder';
import { getPokemonByIds } from '@/services/pokeapi';

export const revalidate = 86400;

const SUGGESTION_IDS = [
  3, 6, 9, 18, 26, 51, 59, 65, 68, 87, 89, 92, 94, 95, 123, 128, 130, 131,
  135, 143, 149, 154, 181, 196, 197, 208, 212, 214, 227, 230, 248, 254, 257,
  260, 282, 286, 306, 330, 334, 359, 373, 376, 445, 448, 460, 471, 472, 473,
  478, 479, 612, 637, 700, 778, 887, 908, 911, 914, 923, 934, 937, 959, 983,
  998, 1000,
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
