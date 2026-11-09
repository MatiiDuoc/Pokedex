import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';
import { safeNextPath } from '@/lib/navigation';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description:
    'Accede a tu cuenta para guardar tu equipo, tus checklists y el progreso de tus guías Pokémon.',
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12">
      <AuthForm mode="login" nextPath={safeNextPath(next)} />
    </div>
  );
}
