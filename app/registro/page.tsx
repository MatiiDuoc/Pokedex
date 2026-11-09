import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';
import { safeNextPath } from '@/lib/navigation';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description:
    'Crea una cuenta gratuita para guardar tu equipo y el progreso de todas tus guías Pokémon.',
};

interface RegisterPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12">
      <AuthForm mode="register" nextPath={safeNextPath(next)} />
    </div>
  );
}
