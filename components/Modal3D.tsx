'use client';

import { useEffect, useState } from 'react';
import { formatPokemonName } from '@/lib/pokemon';

interface Modal3DProps {
  pokemon: {
    name: string;
    id: number;
    spriteUrl: string;
    model3dUrl?: string;
  };
  onClose: () => void;
}

export default function Modal3D({ pokemon, onClose }: Modal3DProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

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
          className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 id="pokemon-modal-title" className="text-2xl font-bold text-gray-900">
              {formatPokemonName(pokemon.name)}
            </h2>
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

          <div className="p-6">
            <div className="relative flex h-96 flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
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

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">ID Pokédex: #{pokemon.id}</p>
                <p className="mt-2 text-xs text-gray-500">
                  Vista interactiva de la ficha. Los modelos 3D llegarán en una
                  próxima versión.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
