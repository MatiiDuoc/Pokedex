import type { Metadata } from 'next';
import Link from 'next/link';
import Pokemon3DGallery from '@/components/Pokemon3DGallery';
import { getPokemonByIds } from '@/services/pokeapi';

export const revalidate = 86400;

const GALLERY_IDS = [
  25, 6, 9, 3, 150, 151, 249, 250, 384, 445, 448, 282, 94, 133, 143, 149,
  637, 778, 887, 1007, 1008, 1024, 1025, 658,
];

export const metadata: Metadata = {
  title: 'Galería 3D de Pokémon',
  description:
    'Explora modelos 3D interactivos de Pokémon, con animaciones y versión shiny cuando está disponible.',
  alternates: {
    canonical: '/pokedex/3d',
  },
};

export default async function Pokemon3DGalleryPage() {
  const pokemon = await getPokemonByIds(GALLERY_IDS);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <nav aria-label="Migas de pan" className="text-sm text-gray-500">
          <Link href="/pokedex" className="font-semibold hover:text-red-600">
            Pokédex
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-semibold text-gray-800">Galería 3D</span>
        </nav>
      </div>
      <Pokemon3DGallery pokemon={pokemon} />
    </div>
  );
}
