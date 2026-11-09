import type { Metadata } from 'next';
import AccountDashboard from '@/components/AccountDashboard';

export const metadata: Metadata = {
  title: 'Mi cuenta',
  description: 'Gestiona tu cuenta, tu progreso y tu equipo Pokémon.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return <AccountDashboard />;
}
