'use client';

import { useState, useEffect } from 'react';
import PokemonCard from './PokemonCard';

interface Pokemon {
  name: string;
  id: number;
  height: number;
  weight: number;
  types: string[];
  stats: Array<{ name: string; value: number }>;
  spriteUrl: string;
  model3dUrl: string;
}

export default function PokemonTeam() {
  const [team, setTeam] = useState<Pokemon[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const MAX_TEAM_SIZE = 6;

  // Cargar equipo desde localStorage
  useEffect(() => {
    const savedTeam = localStorage.getItem('pokemonTeam');
    if (savedTeam) {
      setTeam(JSON.parse(savedTeam));
    }
  }, []);

  // Guardar equipo en localStorage
  useEffect(() => {
    localStorage.setItem('pokemonTeam', JSON.stringify(team));
  }, [team]);

  const addToTeam = (pokemon: Pokemon) => {
    if (team.length < MAX_TEAM_SIZE && !team.find((p) => p.id === pokemon.id)) {
      setTeam([...team, pokemon]);
    }
  };

  const removeFromTeam = (pokemonId: number) => {
    setTeam(team.filter((p) => p.id !== pokemonId));
  };

  const clearTeam = () => {
    setTeam([]);
  };

  // Exponer funciones globalmente para que otros componentes puedan usarlas
  useEffect(() => {
    (window as any).addPokemonToTeam = addToTeam;
  }, [team]);

  return (
    <>
      {/* Botón flotante del equipo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-2xl hover:from-red-600 hover:to-red-700 transition-all hover:scale-110"
      >
        <div className="relative">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
          {team.length > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-gray-900">
              {team.length}
            </span>
          )}
        </div>
      </button>

      {/* Panel lateral del equipo */}
      <div
        className={`fixed right-0 top-0 z-40 h-full w-96 transform bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Mi Equipo</h2>
                <p className="text-sm text-red-100">
                  {team.length}/{MAX_TEAM_SIZE} Pokémon
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-red-100 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">
            {team.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    Tu equipo está vacío
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Haz clic en "Agregar al Equipo" en cualquier Pokémon
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {team.map((pokemon) => (
                  <div
                    key={pokemon.id}
                    className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => removeFromTeam(pokemon.id)}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <div className="flex items-center gap-4">
                      <img
                        src={pokemon.spriteUrl}
                        alt={pokemon.name}
                        className="h-20 w-20 object-contain"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold capitalize text-gray-900">
                          {pokemon.name}
                        </h3>
                        <p className="text-sm text-gray-600">#{pokemon.id}</p>
                        <div className="mt-1 flex gap-1">
                          {pokemon.types.map((type) => (
                            <span
                              key={type}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold capitalize text-gray-700"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {team.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={clearTeam}
                className="w-full rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-200 transition-colors"
              >
                Limpiar Equipo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}