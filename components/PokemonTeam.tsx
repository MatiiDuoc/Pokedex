'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useTeam } from '@/components/TeamProvider';
import { useAccount } from '@/components/AccountProvider';
import {
  formatPokemonName,
  getLegendaryCategory,
  getLegendaryLabel,
  getTypeLabel,
} from '@/lib/pokemon';

export default function PokemonTeam() {
  const { team, maxSize, remove, clear, requiresLogin, hydrated } = useTeam();
  const { user, logout, syncError, registrationOpen } = useAccount();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={`Abrir mi equipo (${team.length}/${maxSize})`}
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-30 hidden h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-2xl transition-all hover:scale-110 hover:from-red-600 hover:to-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300 lg:flex"
      >
        <div className="relative">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          {team.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-gray-900">
              {team.length}
            </span>
          )}
        </div>
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mi equipo Pokémon"
        className={`fixed right-0 top-0 z-40 h-full w-full max-w-sm transform bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-200 bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Mi Equipo</h2>
                <p className="text-sm text-red-100">
                  {team.length}/{maxSize} Pokémon
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar equipo"
                className="rounded-md p-1 text-white transition-colors hover:text-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {syncError && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                {syncError}
              </p>
            )}

            {!hydrated && (
              <p className="mb-3 text-xs font-semibold text-gray-400">
                Cargando tu equipo...
              </p>
            )}

            {requiresLogin ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                    <Lock className="h-10 w-10 text-blue-600" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    Inicia sesión para guardar tu equipo
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Cada cuenta tiene su propio equipo y progreso.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href="/login?next=/"
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      Iniciar sesión
                    </Link>
                    {registrationOpen && (
                      <Link
                        href="/registro"
                        className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
                      >
                        Crear cuenta
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : team.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">Tu equipo está vacío</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Pulsa &quot;Capturar&quot; en cualquier Pokémon para añadirlo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {team.map((pokemon) => {
                  const legendaryLabel = getLegendaryLabel(
                    getLegendaryCategory(pokemon.id)
                  );
                  return (
                  <div
                    key={pokemon.id}
                    className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => remove(pokemon.id)}
                      aria-label={`Quitar a ${formatPokemonName(pokemon.name)} del equipo`}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pokemon.spriteUrl}
                        alt={formatPokemonName(pokemon.name)}
                        loading="lazy"
                        className="h-20 w-20 object-contain"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {formatPokemonName(pokemon.name)}
                        </h3>
                        <p className="text-sm text-gray-600">#{pokemon.id}</p>
                        {legendaryLabel && (
                          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            {legendaryLabel}
                          </span>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {pokemon.types.map((type) => (
                            <span
                              key={type}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700"
                            >
                              {getTypeLabel(type)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-gray-200 p-4">
            {user && (
              <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                <span className="truncate">
                  Sesión: <strong className="text-gray-700">{user.displayName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="font-bold text-red-600 hover:text-red-700"
                >
                  Cerrar sesión
                </button>
              </div>
            )}

            {team.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="w-full rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                Limpiar equipo
              </button>
            )}

            {requiresLogin && (
              <Link
                href="/login?next=/"
                className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar equipo"
          tabIndex={-1}
          className="fixed inset-0 z-30 cursor-default bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
