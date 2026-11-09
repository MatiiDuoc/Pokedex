'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Maximize2, Minimize2, Pause, Play, RotateCw } from 'lucide-react';
import { TYPE_GRADIENTS, formatPokemonName } from '@/lib/pokemon';

const Pokemon3DViewer = dynamic(() => import('./Pokemon3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-indigo-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  ),
});

interface Modal3DProps {
  pokemon: {
    name: string;
    id: number;
    spriteUrl: string;
    model3dUrl?: string;
    types?: string[];
  };
  onClose: () => void;
}

export default function Modal3D({ pokemon, onClose }: Modal3DProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'image'>('3d');
  const [viewerKey, setViewerKey] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const gradient =
    TYPE_GRADIENTS[pokemon.types?.[0] ?? 'normal'] ??
    'from-indigo-200 to-purple-200';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar ficha"
        tabIndex={-1}
        className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pokemon-modal-title"
          className={`relative w-full rounded-2xl bg-white shadow-2xl transition-all ${
            isFullscreen ? 'max-w-[96vw]' : 'max-w-3xl'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="pokemon-modal-title" className="text-2xl font-bold text-gray-900">
              {formatPokemonName(pokemon.name)}
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Vista de la ficha">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  aria-pressed={viewMode === '3d'}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === '3d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  3D
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('image')}
                  aria-pressed={viewMode === 'image'}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === 'image' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Imagen
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen((value) => !value)}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                className="rounded-md p-1 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-md p-1 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} transition-all ${
                isFullscreen ? 'h-[70vh]' : 'h-96'
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-white/55" />
              {viewMode === '3d' ? (
                <Pokemon3DViewer
                  key={viewerKey}
                  pokemonId={pokemon.id}
                  name={formatPokemonName(pokemon.name)}
                  spriteUrl={pokemon.spriteUrl}
                  autoRotate={autoRotate}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
                    </div>
                  )}

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pokemon.spriteUrl}
                    alt={formatPokemonName(pokemon.name)}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                    style={{
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                      transition: 'transform 0.3s ease-in-out',
                    }}
                    className="h-64 w-64 object-contain drop-shadow-xl"
                  />

                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">ID Pokédex: #{pokemon.id}</p>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-gray-500">
              {viewMode === '3d'
                ? 'Arrastra para girar y usa la rueda para acercar. Modelos de Pokémon-3D-api; propiedad de Nintendo, Creatures Inc. y GAME FREAK.'
                : 'Vista de imagen oficial. Cambia a 3D para explorar el modelo.'}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/pokedex/${pokemon.id}`}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center font-semibold text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                Página completa
              </Link>
              {viewMode === '3d' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setViewerKey((value) => value + 1)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  >
                    <RotateCw className="h-4 w-4" /> Reiniciar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoRotate((value) => !value)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  >
                    {autoRotate ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {autoRotate ? 'Pausar' : 'Rotar'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setRotation((value) => value + 90)}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  >
                    Rotar
                  </button>
                  <button
                    type="button"
                    onClick={() => setScale((value) => (value >= 1.5 ? 1 : value + 0.25))}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  >
                    Zoom
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-semibold text-white transition-all hover:from-red-600 hover:to-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
