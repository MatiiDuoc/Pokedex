'use client';

import { useState } from 'react';

interface Modal3DProps {
  pokemon: {
    name: string;
    id: number;
    spriteUrl: string;
    model3dUrl: string;
  };
  onClose: () => void;
}

export default function Modal3D({ pokemon, onClose }: Modal3DProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {/* Overlay oscuro de fondo */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
          {/* Header del modal */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-2xl font-bold capitalize text-gray-900">{pokemon.name} 3D</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido del modal */}
          <div className="p-6">
            <div className="relative h-96 rounded-xl bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col items-center justify-center overflow-hidden">
              {/* Spinner de carga */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-200 border-t-red-600"></div>
                </div>
              )}

              {/* Imagen 3D (fallback mientras no tenemos three.js configurado) */}
              <img
                src={pokemon.spriteUrl}
                alt={pokemon.name}
                onLoad={() => setIsLoading(false)}
                className="h-64 w-64 object-contain drop-shadow-xl transition-transform hover:scale-110"
              />

              {/* Información adicional */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">ID Pokédex: #{pokemon.id}</p>
                <p className="mt-2 text-xs text-gray-500">
                  (Modelo 3D interactivo en desarrollo con Three.js)
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-200 transition-colors">
                Rotar
              </button>
              <button className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-200 transition-colors">
                Zoom
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-semibold text-white hover:from-red-600 hover:to-red-700 transition-all"
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
