'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  LEGENDARY_FILTERS,
  TYPE_LABELS,
  formatDexNumber,
  formatPokemonName,
  getGenerationFromId,
  getLegendaryLabel,
  type LegendaryCategory,
} from '@/lib/pokemon';
import { getVersionGroupInfo } from '@/data/versionGroups';
import { useTypeFilter } from '@/lib/useTypeFilter';
import type { GameGuide } from '@/types/game';
import type { PokemonIndexEntry } from '@/types/pokemon';

interface GlobalSearchProps {
  pokemon: PokemonIndexEntry[];
  games: GameGuide[];
  initialQuery: string;
  initialType: string;
  initialGeneration: string;
}

export default function GlobalSearch({
  pokemon,
  games,
  initialQuery,
  initialType,
  initialGeneration,
}: GlobalSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [generation, setGeneration] = useState(initialGeneration);
  const [legendary, setLegendary] = useState<LegendaryCategory | ''>('');
  const [category, setCategory] = useState('all');
  const [shiny, setShiny] = useState(false);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { names: typeNames, loading: typeLoading } = useTypeFilter(type);

  const filteredPokemon = useMemo(() => {
    return pokemon
      .filter((entry) => {
        const matchesQuery =
          deferredQuery === '' ||
          entry.name.toLowerCase().includes(deferredQuery) ||
          entry.id.toString().includes(deferredQuery);
        const matchesGeneration =
          generation === '' || getGenerationFromId(entry.id) === Number(generation);
        const matchesType =
          type === '' || typeNames === null || typeNames.has(entry.name);
        const matchesLegendary =
          legendary === '' || entry.legendaryCategory === legendary;

        return matchesQuery && matchesGeneration && matchesType && matchesLegendary;
      })
      .slice(0, 60);
  }, [pokemon, deferredQuery, generation, type, typeNames, legendary]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesQuery =
        deferredQuery === '' ||
        game.title.toLowerCase().includes(deferredQuery) ||
        game.shortTitle.toLowerCase().includes(deferredQuery) ||
        game.region.toLowerCase().includes(deferredQuery);
      const matchesCategory =
        category === 'all' || (game.category ?? 'main') === category;

      return matchesQuery && matchesCategory;
    });
  }, [games, deferredQuery, category]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-red-600">
            Búsqueda global
          </p>
          <h1 className="mt-2 text-4xl font-black text-gray-900">
            Busca cualquier Pokémon o guía
          </h1>
          <p className="mt-2 text-gray-600">
            Filtra por nombre, número, tipo o generación y salta directamente al
            juego que estés jugando.
          </p>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="search-query" className="sr-only">
              Buscar
            </label>
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pikachu, Kanto, Legends Z-A..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label htmlFor="search-type" className="sr-only">
              Tipo
            </label>
            <select
              id="search-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="search-generation" className="sr-only">
              Generación
            </label>
            <select
              id="search-generation"
              value={generation}
              onChange={(event) => setGeneration(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todas las generaciones</option>
              {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Generación {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="search-legendary" className="sr-only">
              Categoría especial
            </label>
            <select
              id="search-legendary"
              value={legendary}
              onChange={(event) =>
                setLegendary(event.target.value as LegendaryCategory | '')
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              {LEGENDARY_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.value === '' ? 'Todas las categorías' : filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-gray-600">Guías:</span>
          {[
            { value: 'all', label: 'Todas' },
            { value: 'main', label: 'Principales' },
            { value: 'spin-off', label: 'Spin-offs' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCategory(option.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${
                category === option.value
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {typeLoading && (
          <p className="mb-3 text-sm font-semibold text-gray-500">
            Cargando filtro de tipo...
          </p>
        )}

        <section className="mb-10">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-black text-gray-900">
              Guías ({filteredGames.length})
            </h2>
            <Link href="/guias" className="text-sm font-bold text-red-600 hover:text-red-700">
              Ver todas
            </Link>
          </div>
          {filteredGames.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGames.map((game) => (
                <Link
                  key={game.slug}
                  href={`/guias/${game.slug}`}
                  className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{game.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Gen {game.generation} · {game.region} · {game.releaseYear}
                      </p>
                    </div>
                    {game.category === 'spin-off' && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        Spin-off
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    {game.pokedexMode === 'none'
                      ? 'Sin Pokédex tradicional'
                      : getVersionGroupInfo(game.slug)?.pokedexLabel ?? 'Pokédex'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-6 text-sm text-gray-600 shadow-sm">
              No hay guías que coincidan con la búsqueda.
            </p>
          )}
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-black text-gray-900">
              Pokémon ({filteredPokemon.length}
              {filteredPokemon.length === 60 ? '+' : ''})
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShiny((value) => !value)}
                aria-pressed={shiny}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                  shiny
                    ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950 shadow-md'
                    : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {shiny ? 'Modo shiny activo' : 'Ver shinies'}
              </button>
              <Link
                href="/pokedex"
                className="text-sm font-bold text-red-600 hover:text-red-700"
              >
                Pokédex completa
              </Link>
            </div>
          </div>

          {filteredPokemon.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredPokemon.map((entry) => {
                const legendaryLabel = getLegendaryLabel(entry.legendaryCategory);
                return (
                  <Link
                    key={entry.id}
                    href={`/pokedex/${entry.id}`}
                    className="rounded-xl bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shiny ? entry.shinyArtworkUrl : entry.artworkUrl}
                      alt={`${formatPokemonName(entry.name)}${shiny ? ' shiny' : ''}`}
                      loading="lazy"
                      onError={(event) => {
                        const image = event.currentTarget;
                        image.onerror = null;
                        image.src = entry.artworkUrl;
                      }}
                      className="mx-auto h-20 w-20 object-contain"
                    />
                    <p className="mt-1 text-[11px] font-semibold text-gray-500">
                      {formatDexNumber(entry.id)}
                    </p>
                    <h3 className="truncate text-xs font-bold text-gray-900">
                      {formatPokemonName(entry.name)}
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Gen {getGenerationFromId(entry.id)}
                    </p>
                    {legendaryLabel && (
                      <span
                        className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${
                          entry.legendaryCategory === 'mythical'
                            ? 'bg-fuchsia-600'
                            : entry.legendaryCategory === 'ultra-beast'
                              ? 'bg-cyan-600'
                              : 'bg-amber-500'
                        }`}
                      >
                        {legendaryLabel}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-6 text-sm text-gray-600 shadow-sm">
              No hay Pokémon que coincidan con los filtros.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
