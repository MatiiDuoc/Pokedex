import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import PokemonTeam from '@/components/PokemonTeam';
import { TeamProvider } from '@/components/TeamProvider';
import { getSiteUrl } from '@/lib/site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Pokédex + Guías | Completa todos los juegos Pokémon',
    template: '%s | Pokédex + Guías',
  },
  description:
    'Pokédex completa y guías paso a paso para completar todos los juegos principales de Pokémon: gimnasios, ligas, legendarios y checklist de cada región.',
  keywords: [
    'Pokédex',
    'guías Pokémon',
    'completar Pokémon',
    'legendarios',
    'gimnasios',
    'Pokédex Nacional',
  ],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Pokédex + Guías',
    title: 'Pokédex + Guías | Completa todos los juegos Pokémon',
    description:
      'Guías paso a paso, checklist de Pokédex y consejos para todos los juegos principales de Pokémon.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TeamProvider>
          <SiteHeader />
          <main>{children}</main>
          <footer className="border-t border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
            <p>
              Proyecto fan sin afiliación con Nintendo, Game Freak o The Pokémon
              Company.
            </p>
            <p className="mt-1">
              Datos de Pokémon: PokeAPI. Guías elaboradas a partir de la
              información pública de los juegos.
            </p>
          </footer>
          <PokemonTeam />
        </TeamProvider>
      </body>
    </html>
  );
}
