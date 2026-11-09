'use client';

import Link from 'next/link';
import { useTeam } from '@/components/TeamProvider';
import { useAccount } from '@/components/AccountProvider';
import {
  formatPokemonName,
  getTypeLabel,
  TYPE_COLORS,
} from '@/lib/pokemon';

export default function HomeTeamCard() {
  const { team, maxSize, hydrated, requiresLogin } = useTeam();
  const { user } = useAccount();

  const uniqueTypes = Array.from(
    new Set(team.flatMap((pokemon) => pokemon.types))
  );

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Tu equipo
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">
              Equipo Pokémon
            </h2>
          </div>
          <Link
            href="/cuenta"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
          >
            Gestionar cuenta
          </Link>
        </div>

        {!hydrated ? (
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-gray-100" />
        ) : requiresLogin ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Inicia sesión para guardar tu equipo de {maxSize} Pokémon y tus
              checklists.
            </p>
            <Link
              href="/login?next=/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : team.length === 0 ? (
          <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            Tu equipo está vacío. Usa el botón “Capturar” en cualquier Pokémon
            destacado o en la Pokédex completa.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {team.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="rounded-xl bg-gray-50 p-2 text-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pokemon.spriteUrl}
                    alt={formatPokemonName(pokemon.name)}
                    loading="lazy"
                    className="mx-auto h-16 w-16 object-contain"
                  />
                  <p className="truncate text-[11px] font-bold text-gray-900">
                    {formatPokemonName(pokemon.name)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500">
                Cobertura de tipos:
              </span>
              {uniqueTypes.map((type) => (
                <span
                  key={type}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    TYPE_COLORS[type] ?? 'bg-gray-400'
                  }`}
                >
                  {getTypeLabel(type)}
                </span>
              ))}
            </div>
          </>
        )}

        {user && (
          <p className="mt-3 text-xs text-gray-400">
            Equipo guardado en la cuenta de {user.displayName}.
          </p>
        )}
      </div>
    </section>
  );
}
