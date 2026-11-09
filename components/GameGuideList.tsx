'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { getVersionGroupInfo } from '@/data/versionGroups';
import type { GameGuide } from '@/types/game';

interface GameGuideListProps {
  games: GameGuide[];
}

type CategoryFilter = 'all' | 'main' | 'spin-off';

export default function GameGuideList({ games }: GameGuideListProps) {
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('');
  const [region, setRegion] = useState('');
  const [platform, setPlatform] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const regions = useMemo(
    () => Array.from(new Set(games.map((game) => game.region))).sort(),
    [games]
  );
  const platforms = useMemo(
    () => Array.from(new Set(games.map((game) => game.platform))).sort(),
    [games]
  );
  const generations = useMemo(
    () => Array.from(new Set(games.map((game) => game.generation))).sort((a, b) => a - b),
    [games]
  );

  const filtered = useMemo(() => {
    return games
      .filter((game) => {
        const matchesQuery =
          deferredQuery === '' ||
          game.title.toLowerCase().includes(deferredQuery) ||
          game.shortTitle.toLowerCase().includes(deferredQuery) ||
          game.region.toLowerCase().includes(deferredQuery);

        const matchesGeneration =
          generation === '' || game.generation === Number(generation);
        const matchesRegion = region === '' || game.region === region;
        const matchesPlatform = platform === '' || game.platform === platform;
        const matchesCategory =
          category === 'all' || (game.category ?? 'main') === category;

        return (
          matchesQuery &&
          matchesGeneration &&
          matchesRegion &&
          matchesPlatform &&
          matchesCategory
        );
      })
      .sort((a, b) => a.releaseYear - b.releaseYear);
  }, [games, deferredQuery, generation, region, platform, category]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-red-600">
            Centro de guías
          </p>
          <h1 className="mt-2 text-4xl font-black text-gray-900 sm:text-5xl">
            Todos los juegos Pokémon
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-gray-600">
            Guías paso a paso para completar la historia, vencer gimnasios y ligas,
            capturar legendarios y llenar la Pokédex. Incluye juegos principales,
            remakes, DLC y spin-offs.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {games.length} guías · Generaciones I-IX · Principales y spin-offs
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label htmlFor="guide-search" className="sr-only">
              Buscar guía
            </label>
            <input
              id="guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por juego o región..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label htmlFor="guide-generation" className="sr-only">
              Filtrar por generación
            </label>
            <select
              id="guide-generation"
              value={generation}
              onChange={(event) => setGeneration(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todas las generaciones</option>
              {generations.map((value) => (
                <option key={value} value={value}>
                  Generación {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="guide-region" className="sr-only">
              Filtrar por región
            </label>
            <select
              id="guide-region"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todas las regiones</option>
              {regions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="guide-platform" className="sr-only">
              Filtrar por plataforma
            </label>
            <select
              id="guide-platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todas las plataformas</option>
              {platforms.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="guide-category" className="sr-only">
              Filtrar por tipo de juego
            </label>
            <select
              id="guide-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="all">Principales y spin-offs</option>
              <option value="main">Solo principales</option>
              <option value="spin-off">Solo spin-offs</option>
            </select>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
          <span aria-live="polite">
            {filtered.length} guía{filtered.length === 1 ? '' : 's'} encontrada
            {filtered.length === 1 ? '' : 's'}
          </span>
          {(query || generation || region || platform || category !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setGeneration('');
                setRegion('');
                setPlatform('');
                setCategory('all');
              }}
              className="font-semibold text-red-600 hover:text-red-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-lg">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">No hay guías con ese filtro</p>
              <p className="mt-1 text-gray-600">Prueba con otra región o generación.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((game) => (
              <Link
                key={game.slug}
                href={`/guias/${game.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
              >
                <div className={`h-2 bg-gradient-to-r ${game.accent}`} />
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                      Gen {game.generation} · {game.region}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {game.releaseYear}
                    </span>
                  </div>
                  {game.category === 'spin-off' && (
                    <span className="mb-2 inline-block rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                      Spin-off
                    </span>
                  )}

                  <h2 className="text-xl font-black text-gray-900 group-hover:text-red-600">
                    {game.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{game.platform}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <dt className="text-xs font-semibold text-gray-500">Pokédex</dt>
                      <dd className="font-bold text-gray-900">
                        {game.pokedexMode === 'none'
                          ? 'Sin Pokédex'
                          : getVersionGroupInfo(game.slug)?.pokedexLabel ??
                            `${game.dexRange[0]}-${game.dexRange[1]}`}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <dt className="text-xs font-semibold text-gray-500">
                        {game.challengeLabel}
                      </dt>
                      <dd className="font-bold text-gray-900">{game.gyms.length}</dd>
                    </div>
                  </dl>

                  <p className="mt-4 line-clamp-2 text-sm text-gray-600">
                    Iniciales: {game.starters.join(', ')}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-red-600">
                    Abrir guía
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
