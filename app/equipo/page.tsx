import type { Metadata } from 'next';
import TeamBuilder from '@/components/TeamBuilder';
import { games } from '@/data/games';
import { getPokemonIndex } from '@/services/pokedexIndex';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Team Builder',
  description:
    'Analiza tu equipo Pokémon: cobertura de tipos, debilidades compartidas, preparación para gimnasios y sugerencias para cubrir huecos.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TeamPage() {
  const pokemon = await getPokemonIndex();

  return (
    <TeamBuilder
      pokemon={pokemon}
      games={games.map((game) => ({
        slug: game.slug,
        title: game.shortTitle,
        gyms: game.gyms.map((gym) => ({
          leader: gym.leader,
          type: gym.type,
          location: gym.location,
        })),
      }))}
    />
  );
}
