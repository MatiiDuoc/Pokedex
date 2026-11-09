'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Pagination from './Pagination';
import {
  LEGENDARY_FILTERS,
  TYPE_LABELS,
  formatDexNumber,
  formatPokemonName,
  getGenerationFromId,
  getLegendaryLabel,
  type LegendaryCategory,
} from '@/lib/pokemon';
import { useTypeFilter } from '@/lib/useTypeFilter';
import type { PokemonIndexEntry } from '@/types/pokemon';

interface PokedexExplorerProps {
  pokemon: PokemonIndexEntry[];
}

const ITEMS_PER_PAGE = 60;

export default function PokedexExplorer({ pokemon }: PokedexExplorerProps) {
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('');
  const [type, setType] = useState('');
  const [legendary, setLegendary] = useState<LegendaryCategory | ''>('');
  const [shiny, setShiny] = useState(false);
  const [page, setPage] = useState(1);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { names: typeNames, loading: typeLoading } = useTypeFilter(type);

  const filtered = useMemo(() => {
    return pokemon.filter((entry) => {
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
    });
  }, [pokemon, deferredQuery, generation, type, typeNames, legendary]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const legendaryPokemon = useMemo(
    () => pokemon.filter((entry) => entry.legendaryCategory !== 'none'),
    [pokemon]
  );

  const resetPage = () => setPage(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-gray-900">Pokédex completa</h1>
          <p className="mt-2 text-gray-600">
            Las {pokemon.length} especies del Pokédex Nacional, incluyendo
            legendarios, míticos, ultraentes y sus versiones shiny.
          </p>
        </div>

        <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Legendarios, míticos y ultraentes
              </h2>
              <p className="text-sm text-gray-600">
                {legendaryPokemon.length} especies especiales incluidas en el
                Pokédex Nacional. Pulsa una para buscarla.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLegendary('legendary');
                resetPage();
              }}
              className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-200"
            >
              Ver solo legendarios
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {legendaryPokemon.map((entry) => {
              const label = getLegendaryLabel(entry.legendaryCategory);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setQuery(entry.name);
                    resetPage();
                  }}
                  className="w-24 flex-none rounded-xl border border-gray-100 bg-gray-50 p-2 text-center transition hover:border-amber-200 hover:bg-amber-50"
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
                    className="mx-auto h-16 w-16 object-contain"
                  />
                  <span className="mt-1 block truncate text-[11px] font-bold text-gray-900">
                    {formatPokemonName(entry.name)}
                  </span>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${
                      entry.legendaryCategory === 'mythical'
                        ? 'bg-fuchsia-600'
                        : entry.legendaryCategory === 'ultra-beast'
                          ? 'bg-cyan-600'
                          : 'bg-amber-500'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="national-search" className="sr-only">
              Buscar Pokémon
            </label>
            <input
              id="national-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              placeholder="Buscar por nombre o número..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label htmlFor="national-generation" className="sr-only">
              Filtrar por generación
            </label>
            <select
              id="national-generation"
              value={generation}
              onChange={(event) => {
                setGeneration(event.target.value);
                resetPage();
              }}
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
            <label htmlFor="national-type" className="sr-only">
              Filtrar por tipo
            </label>
            <select
              id="national-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                resetPage();
              }}
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
            <label htmlFor="national-legendary" className="sr-only">
              Filtrar por categoría especial
            </label>
            <select
              id="national-legendary"
              value={legendary}
              onChange={(event) => {
                setLegendary(event.target.value as LegendaryCategory | '');
                resetPage();
              }}
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

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600" aria-live="polite">
            {typeLoading
              ? 'Cargando filtro de tipo...'
              : `${filtered.length} Pokémon encontrados`}
          </div>
          <button
            type="button"
            onClick={() => setShiny((value) => !value)}
            aria-pressed={shiny}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              shiny
                ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950 shadow-md'
                : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
            }`}
          >
            ✨ {shiny ? 'Modo shiny activo' : 'Ver shinies'}
          </button>
        </div>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((entry) => {
            const legendaryLabel = getLegendaryLabel(entry.legendaryCategory);
            return (
              <article
                key={entry.id}
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
                  className="mx-auto h-24 w-24 object-contain"
                />
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  {formatDexNumber(entry.id)}
                </p>
                <h2 className="text-sm font-bold text-gray-900">
                  {formatPokemonName(entry.name)}
                </h2>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    Gen {getGenerationFromId(entry.id)}
                  </span>
                  {legendaryLabel && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
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
                  {shiny && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      ✨ Shiny
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {visible.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-lg">
            <p className="text-lg font-semibold text-gray-700">
              No se encontraron Pokémon con ese filtro.
            </p>
          </div>
        )}

        {visible.length > 0 && (
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filtered.length}
          />
        )}
      </div>
    </div>
  );
}
