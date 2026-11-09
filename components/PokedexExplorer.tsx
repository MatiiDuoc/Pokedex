'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  Box,
  GitCompare,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import Pagination from './Pagination';
import {
  LEGENDARY_FILTERS,
  TYPE_LABELS,
  formatDexNumber,
  formatPokemonName,
  getGenerationFromId,
  getLegendaryLabel,
  getStatLabel,
  type LegendaryCategory,
} from '@/lib/pokemon';
import { usePokemonFilters } from '@/lib/usePokemonFilters';
import type { PokemonIndexEntry } from '@/types/pokemon';

const ADVANCED_ABILITIES = [
  'levitate',
  'intimidate',
  'protean',
  'multiscale',
  'huge-power',
  'speed-boost',
  'technician',
  'adaptability',
  'mold-breaker',
  'magic-guard',
  'wonder-guard',
  'sturdy',
  'regenerator',
  'natural-cure',
  'drought',
  'drizzle',
  'sand-stream',
  'snow-warning',
  'prankster',
  'unaware',
];

const STAT_OPTIONS = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;

const MIN_STAT_OPTIONS = [50, 75, 100, 120, 150, 180];

interface PokedexExplorerProps {
  pokemon: PokemonIndexEntry[];
}

const ITEMS_PER_PAGE = 60;

export default function PokedexExplorer({ pokemon }: PokedexExplorerProps) {
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('');
  const [type, setType] = useState('');
  const [legendary, setLegendary] = useState<LegendaryCategory | ''>('');
  const [ability, setAbility] = useState('');
  const [stat, setStat] = useState('');
  const [minStat, setMinStat] = useState('100');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shiny, setShiny] = useState(false);
  const [page, setPage] = useState(1);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filtersEnabled = type !== '' || ability !== '' || stat !== '';
  const { data: filterData, loading: filtersLoading } =
    usePokemonFilters(filtersEnabled);

  const filterMap = useMemo(
    () => new Map((filterData ?? []).map((entry) => [entry.id, entry])),
    [filterData]
  );

  const filtered = useMemo(() => {
    const dataReady = !filtersEnabled || filterData !== null;

    return pokemon.filter((entry) => {
      const matchesQuery =
        deferredQuery === '' ||
        entry.name.toLowerCase().includes(deferredQuery) ||
        entry.id.toString().includes(deferredQuery);
      const matchesGeneration =
        generation === '' || getGenerationFromId(entry.id) === Number(generation);
      const entryFilters = filterMap.get(entry.id);
      const matchesType =
        !dataReady ||
        type === '' ||
        (entryFilters?.types.includes(type) ?? false);
      const matchesAbility =
        !dataReady ||
        ability === '' ||
        (entryFilters?.abilities.includes(ability) ?? false);
      const statValue =
        stat === '' ? 0 : entryFilters?.stats[stat as keyof typeof entryFilters.stats] ?? 0;
      const matchesStat =
        !dataReady || stat === '' || statValue >= Number(minStat);
      const matchesLegendary =
        legendary === '' || entry.legendaryCategory === legendary;

      return (
        matchesQuery &&
        matchesGeneration &&
        matchesType &&
        matchesAbility &&
        matchesStat &&
        matchesLegendary
      );
    });
  }, [
    pokemon,
    deferredQuery,
    generation,
    type,
    ability,
    stat,
    minStat,
    filterData,
    filterMap,
    filtersEnabled,
    legendary,
  ]);

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
                <Link
                  key={entry.id}
                  href={`/pokedex/${entry.id}`}
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
                </Link>
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

        {showAdvanced && (
          <div className="mb-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3">
            <div>
              <label
                htmlFor="advanced-ability"
                className="mb-1 block text-xs font-bold text-gray-600"
              >
                Habilidad
              </label>
              <select
                id="advanced-ability"
                value={ability}
                onChange={(event) => {
                  setAbility(event.target.value);
                  resetPage();
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Cualquier habilidad</option>
                {ADVANCED_ABILITIES.map((value) => (
                  <option key={value} value={value}>
                    {formatPokemonName(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="advanced-stat"
                className="mb-1 block text-xs font-bold text-gray-600"
              >
                Estadística mínima
              </label>
              <select
                id="advanced-stat"
                value={stat}
                onChange={(event) => {
                  setStat(event.target.value);
                  resetPage();
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">Sin filtro de estadística</option>
                {STAT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {getStatLabel(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="advanced-min-stat"
                className="mb-1 block text-xs font-bold text-gray-600"
              >
                Valor mínimo
              </label>
              <select
                id="advanced-min-stat"
                value={minStat}
                onChange={(event) => {
                  setMinStat(event.target.value);
                  resetPage();
                }}
                disabled={stat === ''}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                {MIN_STAT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} o más
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 md:col-span-3">
              Los datos de tipos, estadísticas y habilidades se cargan una sola
              vez desde el índice local de PokeAPI.
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros avanzados
              {(ability || stat) && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700">
                  {[ability, stat].filter(Boolean).length}
                </span>
              )}
            </button>
            {(type || ability || stat) && (
              <button
                type="button"
                onClick={() => {
                  setType('');
                  setAbility('');
                  setStat('');
                  resetPage();
                }}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" /> Limpiar avanzados
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600" aria-live="polite">
            {filtersLoading
              ? 'Cargando filtros...'
              : `${filtered.length} Pokémon encontrados`}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/comparar"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <GitCompare className="h-4 w-4" /> Comparar
            </Link>
            <Link
              href="/pokedex/3d"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Box className="h-4 w-4" /> Galería 3D
            </Link>
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
          </div>
        </div>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((entry) => {
            const legendaryLabel = getLegendaryLabel(entry.legendaryCategory);
            return (
              <Link
                key={entry.id}
                href={`/pokedex/${entry.id}`}
                className="animate-fade-up rounded-xl bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
              </Link>
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
