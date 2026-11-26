import type { Metadata } from 'next';
import LoginExperience from '@/components/LoginExperience';
import { games } from '@/data/games';
import { safeNextPath } from '@/lib/navigation';
import { NATIONAL_DEX_SIZE } from '@/services/pokedexIndex';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description:
    'Accede a tu cuenta para guardar tu equipo, tus checklists y el progreso de tus guías Pokémon.',
  robots: {
    index: false,
    follow: false,
  },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <LoginExperience
      nextPath={safeNextPath(next)}
      totalPokemon={NATIONAL_DEX_SIZE}
      totalGuides={games.length}
    />
  );
}
