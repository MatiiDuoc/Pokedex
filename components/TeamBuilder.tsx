'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Check,
  GripVertical,
  Plus,
  ShieldAlert,
  Sparkles,
  Swords,
  Trash2,
  Users,
} from 'lucide-react';
import { useAccount } from '@/components/AccountProvider';
import { useTeam } from '@/components/TeamProvider';
import {
  TYPE_COLORS,
  formatPokemonName,
  getTypeLabel,
} from '@/lib/pokemon';
import { getTeamSuggestions } from '@/lib/team-suggestions';
import {
  getOffensiveCoverage,
  getTeamWeaknesses,
  getTypeName,
} from '@/lib/type-chart';
import type { PokemonBasic } from '@/types/pokemon';

interface TeamBuilderProps {
  suggestions: PokemonBasic[];
}

export default function TeamBuilder({ suggestions }: TeamBuilderProps) {
  const { authLoading, user } = useAccount();
  const { team, maxSize, hydrated, remove, move, add, has, isFull } = useTeam();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl bg-white p-8 text-center shadow-xl">
          <Users className="mx-auto h-12 w-12 text-red-600" />
          <h1 className="mt-4 text-2xl font-black text-gray-900">
            Team Builder
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión para guardar tu equipo y analizar su cobertura de tipos.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login?next=/equipo"
              className="rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/pokedex"
              className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
            >
              Explorar Pokédex
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const weaknesses = getTeamWeaknesses(team.map((pokemon) => pokemon.types));
  const coverage = getOffensiveCoverage(team.map((pokemon) => pokemon.types));
  const recommended = getTeamSuggestions(
    team.map((pokemon) => pokemon.types),
    suggestions,
    team.map((pokemon) => pokemon.id),
    6
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-red-600">
            Team Builder
          </p>
          <h1 className="mt-1 text-4xl font-black text-gray-900">Mi equipo</h1>
          <p className="mt-1 text-sm text-gray-600">
            {team.length} de {maxSize} Pokémon · cobertura, debilidades y huecos.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/pokedex"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Añadir Pokémon
          </Link>
          <Link
            href="/cuenta"
            className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
          >
            Mi cuenta
          </Link>
        </div>
      </div>

      {!hydrated ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: maxSize }).map((_, index) => {
            const pokemon = team[index];

            if (!pokemon) {
              return (
                <Link
                  key={`empty-${index}`}
                  href="/pokedex"
                  className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white text-gray-400 transition hover:border-red-300 hover:text-red-500"
                >
                  <Plus className="h-8 w-8" />
                  <span className="mt-2 text-sm font-bold">Hueco libre</span>
                  <span className="text-xs">Añadir desde la Pokédex</span>
                </Link>
              );
            }

            return (
              <article
                key={pokemon.id}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedIndex !== null) move(draggedIndex, index);
                  setDraggedIndex(null);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                className={`animate-pop-in relative cursor-grab rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition active:cursor-grabbing ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="absolute left-2 top-2 h-4 w-4 text-gray-300" />
                <button
                  type="button"
                  onClick={() => remove(pokemon.id)}
                  aria-label={`Quitar a ${formatPokemonName(pokemon.name)}`}
                  className="absolute right-2 top-2 rounded-full bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pokemon.spriteUrl}
                  alt={formatPokemonName(pokemon.name)}
                  loading="lazy"
                  className="mx-auto h-24 w-24 object-contain"
                />
                <h2 className="mt-1 text-sm font-black text-gray-900">
                  {formatPokemonName(pokemon.name)}
                </h2>
                <p className="text-[11px] font-semibold text-gray-400">
                  #{pokemon.id.toString().padStart(4, '0')}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {pokemon.types.map((type) => (
                    <span
                      key={type}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
                        TYPE_COLORS[type] ?? 'bg-gray-400'
                      }`}
                    >
                      {getTypeLabel(type)}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
            <Swords className="h-5 w-5 text-red-600" /> Cobertura ofensiva
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Tipos que puede usar tu equipo.
          </p>
          {coverage.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              Añade Pokémon para ver la cobertura.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {coverage.map((type) => (
                <span
                  key={type}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${
                    TYPE_COLORS[type] ?? 'bg-gray-400'
                  }`}
                >
                  {getTypeName(type)}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
            <ShieldAlert className="h-5 w-5 text-amber-600" /> Debilidades compartidas
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Tipos que amenazan a varios miembros del equipo.
          </p>
          {weaknesses.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              Sin debilidades registradas.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {weaknesses.map((weakness) => (
                <span
                  key={weakness.type}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white ${
                    TYPE_COLORS[weakness.type] ?? 'bg-gray-400'
                  }`}
                >
                  {getTypeName(weakness.type)}
                  <span className="rounded-full bg-black/25 px-1.5 text-[10px]">
                    x{weakness.count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
          <Sparkles className="h-5 w-5 text-purple-600" /> Sugerencias para cubrir
          debilidades
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Pokémon del pool que resisten o son inmunes a los tipos que más dañan a
          tu equipo.
        </p>

        {recommended.length === 0 ? (
          <p className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
            Tu equipo está equilibrado o no hay sugerencias disponibles.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((candidate) => {
              const alreadyInTeam = has(candidate.id);
              const disabled = alreadyInTeam || isFull;
              return (
                <div
                  key={candidate.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                >
                  <Link href={`/pokedex/${candidate.id}`} className="flex-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={candidate.spriteUrl}
                      alt={formatPokemonName(candidate.name)}
                      loading="lazy"
                      className="h-14 w-14 object-contain"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/pokedex/${candidate.id}`}
                      className="block truncate text-sm font-bold text-gray-900 hover:text-red-600"
                    >
                      {formatPokemonName(candidate.name)}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {candidate.types.map((type) => (
                        <span
                          key={type}
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${
                            TYPE_COLORS[type] ?? 'bg-gray-400'
                          }`}
                        >
                          {getTypeLabel(type)}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-purple-700">
                      Cubre {candidate.score} debilidad
                      {candidate.score === 1 ? '' : 'es'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => add(candidate)}
                    disabled={disabled}
                    aria-label={`Añadir a ${formatPokemonName(candidate.name)}`}
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {alreadyInTeam ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-black text-blue-900">
          <Sparkles className="h-4 w-4" /> Consejo
        </h2>
        <p className="mt-1 text-sm text-blue-900/90">
          Un equipo equilibrado suele cubrir al menos 8-10 tipos ofensivos y no
          acumula más de 2-3 miembros débiles al mismo tipo.
        </p>
      </section>
    </div>
  );
}
