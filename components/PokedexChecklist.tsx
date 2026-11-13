'use client';

import Link from 'next/link';
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Check,
  ExternalLink,
  Eye,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import Pagination from './Pagination';
import versionNamesEs from '@/lib/version-names-es.json';
import {
  EMPTY_ADVANCED_FILTERS,
  countActiveAdvancedFilters,
  hasActiveAdvancedFilters,
  matchesAdvancedFilters,
  type AdvancedPokemonFilters,
} from '@/lib/advanced-filters';
import {
  SPECIES_CATEGORY_OPTIONS,
  type SpeciesCategory,
} from '@/lib/pokemon-categories';
import {
  TYPE_LABELS,
  formatDexNumber,
  formatPokemonName,
  getGenerationFromId,
  getLegendaryLabel,
  getStatLabel,
} from '@/lib/pokemon';
import { usePokemonFilters } from '@/lib/usePokemonFilters';
import type { VersionEncounters } from '@/services/pokemonEncounters';
import type { WikidexFallback } from '@/services/wikidexEncounters';
import type { PokemonIndexEntry } from '@/types/pokemon';

const VERSION_NAMES_ES = versionNamesEs as Record<string, string>;

interface PokedexChecklistProps {
  pokemon: PokemonIndexEntry[];
  caught: number[];
  seen: number[];
  loaded: boolean;
  versionGroup: string | null;
  gameTitle: string;
  readOnly?: boolean;
  onToggleCaught: (id: number) => void;
  onSetCaughtMany: (ids: number[], value: boolean) => void;
  onToggleSeen: (id: number) => void;
  onSetSeenMany: (ids: number[], value: boolean) => void;
}

const ITEMS_PER_PAGE = 60;
const STAT_OPTIONS = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;
const MIN_STAT_OPTIONS = [50, 75, 100, 120, 150, 180];
const MIN_TOTAL_OPTIONS = [300, 400, 500, 600, 680];
type StatusFilter = 'all' | 'seen' | 'caught' | 'uncaught' | 'missing';
export default function PokedexChecklist({
  pokemon,
  caught,
  seen,
  loaded,
  versionGroup,
  gameTitle,
  readOnly = false,
  onToggleCaught,
  onSetCaughtMany,
  onToggleSeen,
  onSetSeenMany,
}: PokedexChecklistProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [shiny, setShiny] = useState(false);
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [type, setType] = useState('');
  const [weakTo, setWeakTo] = useState('');
  const [resists, setResists] = useState('');
  const [strongAgainst, setStrongAgainst] = useState('');
  const [species, setSpecies] = useState<SpeciesCategory>('all');
  const [stat, setStat] = useState('');
  const [minStat, setMinStat] = useState('100');
  const [minTotal, setMinTotal] = useState('0');
  const [lookupId, setLookupId] = useState<number | null>(null);
  const [encounters, setEncounters] = useState<VersionEncounters[] | null>(
    null
  );
  const [alternative, setAlternative] = useState<WikidexFallback | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const caughtSet = useMemo(() => new Set(caught), [caught]);
  const seenSet = useMemo(() => new Set(seen), [seen]);

  const advancedFilters = useMemo<AdvancedPokemonFilters>(
    () => ({
      type,
      weakTo,
      resists,
      strongAgainst,
      species,
      stat,
      minStat: Number(minStat),
      minTotal: Number(minTotal),
    }),
    [type, weakTo, resists, strongAgainst, species, stat, minStat, minTotal]
  );
  const advancedFiltersEnabled = hasActiveAdvancedFilters(advancedFilters);
  const { data: filterData, loading: filtersLoading } = usePokemonFilters(
    showAdvanced || advancedFiltersEnabled
  );
  const filtersReady = !advancedFiltersEnabled || filterData !== null;
  const filterMap = useMemo(
    () => new Map((filterData ?? []).map((entry) => [entry.id, entry])),
    [filterData]
  );
  const activeFilterCount = countActiveAdvancedFilters(advancedFilters);

  const filtered = useMemo(() => {
    return pokemon.filter((entry) => {
      const matchesQuery =
        deferredQuery === '' ||
        entry.name.toLowerCase().includes(deferredQuery) ||
        entry.id.toString().includes(deferredQuery);

      if (!matchesQuery) return false;
      if (status === 'seen' && !seenSet.has(entry.id)) return false;
      if (status === 'caught' && !caughtSet.has(entry.id)) return false;
      if (status === 'uncaught' && !seenSet.has(entry.id)) return false;
      if (status === 'uncaught' && caughtSet.has(entry.id)) return false;
      if (status === 'missing' && seenSet.has(entry.id)) return false;

      return matchesAdvancedFilters(
        entry,
        filterMap.get(entry.id),
        advancedFilters,
        filtersReady
      );
    });
  }, [
    pokemon,
    deferredQuery,
    status,
    seenSet,
    caughtSet,
    filterMap,
    advancedFilters,
    filtersReady,
  ]);

  const seenInGame = pokemon.filter((entry) => seenSet.has(entry.id)).length;
  const caughtInGame = pokemon.filter((entry) => caughtSet.has(entry.id)).length;
  const pendingInGame = Math.max(0, seenInGame - caughtInGame);
  const seenPercentage =
    pokemon.length === 0 ? 0 : (seenInGame / pokemon.length) * 100;
  const caughtPercentage =
    pokemon.length === 0 ? 0 : (caughtInGame / pokemon.length) * 100;

  const lookupPokemon =
    lookupId !== null
      ? pokemon.find((entry) => entry.id === lookupId)
      : undefined;

  useEffect(() => {
    if (lookupId === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLookupId(null);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [lookupId]);

  const openEncounters = async (entry: PokemonIndexEntry) => {
    setLookupId(entry.id);
    setEncounters(null);
    setAlternative(null);
    setLookupError(null);

    if (!versionGroup) {
      setEncounters([]);
      setLookupLoading(false);
      return;
    }

    setLookupLoading(true);

    try {
      const response = await fetch(
        `/api/pokemon/${entry.id}/encounters?versionGroup=${encodeURIComponent(
          versionGroup
        )}`
      );
      if (!response.ok) throw new Error('No se pudieron cargar las zonas');
      const data = (await response.json()) as {
        encounters?: VersionEncounters[];
        alternative?: WikidexFallback | null;
      };
      setEncounters(data.encounters ?? []);
      setAlternative(data.alternative ?? null);
    } catch {
      setLookupError('No se pudieron cargar las zonas de encuentro.');
    } finally {
      setLookupLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );
  const visibleIds = visible.map((entry) => entry.id);

  const filters: Array<{ id: StatusFilter; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'seen', label: 'Vistos' },
    { id: 'caught', label: 'Capturados' },
    { id: 'uncaught', label: 'Pendientes' },
    { id: 'missing', label: 'Sin ver' },
  ];

  const resetAdvancedFilters = () => {
    const empty = EMPTY_ADVANCED_FILTERS;
    setType(empty.type);
    setWeakTo(empty.weakTo);
    setResists(empty.resists);
    setStrongAgainst(empty.strongAgainst);
    setSpecies(empty.species);
    setStat(empty.stat);
    setMinStat(empty.minStat.toString());
    setMinTotal(empty.minTotal.toString());
    setPage(1);
  };

  const selectClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400';

  return (
    <div>
      <div className="rounded-2xl bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Pokédex de la partida
            </h3>
            <p className="text-sm text-gray-600">
              Marca los Pokémon que has visto y los que ya has capturado.
            </p>
          </div>
          <div className="text-sm font-semibold text-gray-500">
            {loaded
              ? `${caughtInGame} capturados · ${pendingInGame} pendientes`
              : 'Cargando progreso...'}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-blue-50 p-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                  Vistos
                </p>
                <p className="mt-1 text-2xl font-black text-blue-950">
                  {loaded ? `${seenInGame}/${pokemon.length}` : '—'}
                </p>
              </div>
              <p className="text-sm font-black text-blue-700">
                {loaded ? `${Math.round(seenPercentage)}%` : '—'}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${seenPercentage}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-green-50 p-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-green-700">
                  Capturados
                </p>
                <p className="mt-1 text-2xl font-black text-green-950">
                  {loaded ? `${caughtInGame}/${pokemon.length}` : '—'}
                </p>
              </div>
              <p className="text-sm font-black text-green-700">
                {loaded ? `${Math.round(caughtPercentage)}%` : '—'}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-green-100">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${caughtPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <label htmlFor="game-pokedex-search" className="sr-only">
              Buscar en la Pokédex del juego
            </label>
            <input
              id="game-pokedex-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o número..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            aria-expanded={showAdvanced}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShiny((value) => !value)}
            aria-pressed={shiny}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
              shiny
                ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950 shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            {shiny ? 'Shinies' : 'Ver shinies'}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-indigo-700">
                Filtros avanzados
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetAdvancedFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-600 transition hover:text-red-700"
                >
                  <X className="h-3.5 w-3.5" /> Limpiar filtros
                </button>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="game-filter-type"
                  className="mb-1 block text-[11px] font-bold text-gray-600"
                >
                  Tipo
                </label>
                <select
                  id="game-filter-type"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setPage(1);
                  }}
                  className={selectClass}
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
                <label
                  htmlFor="game-filter-strong"
                  className="mb-1 block text-[11px] font-bold text-gray-600"
                >
                  Fuerte contra
                </label>
                <select
                  id="game-filter-strong"
                  value={strongAgainst}
                  onChange={(event) => {
                    setStrongAgainst(event.target.value);
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Cualquier tipo</option>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="game-filter-weak"
                  className="mb-1 block text-[11px] font-bold text-gray-600"
                >
                  Débil contra
                </label>
                <select
                  id="game-filter-weak"
                  value={weakTo}
                  onChange={(event) => {
                    setWeakTo(event.target.value);
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Cualquier tipo</option>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="game-filter-resists"
                  className="mb-1 block text-[11px] font-bold text-gray-600"
                >
                  Resiste a
                </label>
                <select
                  id="game-filter-resists"
                  value={resists}
                  onChange={(event) => {
                    setResists(event.target.value);
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Cualquier tipo</option>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="game-filter-species"
                  className="mb-1 block text-[11px] font-bold text-gray-600"
                >
                  Especie
                </label>
                <select
                  id="game-filter-species"
                  value={species}
                  onChange={(event) => {
                    setSpecies(event.target.value as SpeciesCategory);
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  {SPECIES_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="game-filter-stat"
                  className="mb-1 block text-[11px] font-bold text-gray-600"
                >
                  Estadística
                </label>
                <select
                  id="game-filter-stat"
                  value={stat}
                  onChange={(event) => {
                    setStat(event.target.value);
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="">Sin filtro</option>
                  {STAT_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {getStatLabel(value)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="game-filter-min-stat"
                  className="mb-1 block text-[11px] font-bold text-gray-600"
                >
                  Mínimo de la estadística
                </label>
                <select
                  id="game-filter-min-stat"
                  value={minStat}
                  onChange={(event) => {
                    setMinStat(event.target.value);
                    setPage(1);
                  }}
                  disabled={stat === ''}
                  className={selectClass}
                >
                  {MIN_STAT_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} o más
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="game-filter-total"
                  className="mb-1 block text-[11px] font-bold text-gray-600"
                >
                  Total de estadísticas
                </label>
                <select
                  id="game-filter-total"
                  value={minTotal}
                  onChange={(event) => {
                    setMinTotal(event.target.value);
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="0">Sin mínimo</option>
                  {MIN_TOTAL_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value} o más
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-gray-500">
              Fuerte contra = sus tipos hacen daño extra. Débil contra = recibe
              daño extra. Resiste a = recibe menos daño.
              {filtersLoading ? ' Cargando datos de tipos y stats...' : ''}
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setStatus(filter.id);
                setPage(1);
              }}
              aria-pressed={status === filter.id}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                status === filter.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSetSeenMany(visibleIds, true)}
            disabled={readOnly || visibleIds.length === 0}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Marcar vistos
          </button>
          <button
            type="button"
            onClick={() => onSetCaughtMany(visibleIds, true)}
            disabled={readOnly || visibleIds.length === 0}
            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Marcar capturados
          </button>
          <button
            type="button"
            onClick={() => onSetSeenMany(visibleIds, false)}
            disabled={readOnly || visibleIds.length === 0}
            className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Desmarcar
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600" aria-live="polite">
          {filtered.length} Pokémon en la lista
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {visible.map((entry) => {
          const isCaught = caughtSet.has(entry.id);
          const isSeen = seenSet.has(entry.id);
          const legendaryLabel = getLegendaryLabel(entry.legendaryCategory);

          return (
            <div
              key={entry.id}
              className={`animate-fade-up relative rounded-xl border p-2 text-center transition ${
                isCaught
                  ? 'border-green-300 bg-green-50 shadow-sm'
                  : isSeen
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white'
              } ${readOnly ? 'opacity-80' : ''}`}
            >
              <span
                className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  isCaught
                    ? 'bg-green-600 text-white'
                    : isSeen
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                }`}
                aria-hidden="true"
              >
                {isCaught ? (
                  <Check className="h-3 w-3" />
                ) : isSeen ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  '+'
                )}
              </span>

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
              <span className="mt-1 block text-[11px] font-semibold text-gray-500">
                {formatDexNumber(entry.id)}
              </span>
              <span className="block truncate text-xs font-bold text-gray-900">
                {formatPokemonName(entry.name)}
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold text-gray-400">
                Gen {getGenerationFromId(entry.id)}
              </span>

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

              <div className="mt-2 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => onToggleSeen(entry.id)}
                  disabled={readOnly || isCaught}
                  aria-pressed={isSeen}
                  title={
                    isCaught
                      ? 'Un Pokémon capturado ya cuenta como visto'
                      : isSeen
                        ? 'Quitar de vistos'
                        : 'Marcar como visto'
                  }
                  className={`inline-flex items-center justify-center gap-1 rounded-lg px-1.5 py-1 text-[9px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSeen
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Visto
                </button>
                <button
                  type="button"
                  onClick={() => onToggleCaught(entry.id)}
                  disabled={readOnly}
                  aria-pressed={isCaught}
                  className={`inline-flex items-center justify-center gap-1 rounded-lg px-1.5 py-1 text-[9px] font-bold transition ${
                    isCaught
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Check className="h-3 w-3" />
                  {isCaught ? 'Capturado' : 'Capturar'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => void openEncounters(entry)}
                className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-50 px-1.5 py-1 text-[9px] font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                <MapPin className="h-3 w-3" />
                Dónde encontrarlo
              </button>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="mt-4 flex h-40 items-center justify-center rounded-2xl bg-white shadow-sm">
          <p className="font-semibold text-gray-600">
            No hay Pokémon con esos filtros.
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

      {lookupPokemon && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setLookupId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Dónde encontrar a ${formatPokemonName(
              lookupPokemon.name
            )}`}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    shiny
                      ? lookupPokemon.shinyArtworkUrl
                      : lookupPokemon.artworkUrl
                  }
                  alt={formatPokemonName(lookupPokemon.name)}
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    Dónde encontrarlo
                  </p>
                  <h3 className="text-lg font-black text-gray-900">
                    {formatPokemonName(lookupPokemon.name)}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500">
                    {formatDexNumber(lookupPokemon.id)} · {gameTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLookupId(null)}
                aria-label="Cerrar"
                className="rounded-full bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {lookupLoading && (
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando zonas de encuentro...
              </p>
            )}

            {lookupError && (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {lookupError}
              </p>
            )}

            {!lookupLoading && !lookupError && encounters && (
              <div className="mt-4 space-y-3">
                {encounters.length === 0 ? (
                  alternative && alternative.versions.length > 0 ? (
                    <>
                      <p className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900">
                        <strong>Datos alternativos en español.</strong> PokeAPI
                        no tiene encuentros para este juego; la información
                        procede de WikiDex.
                      </p>

                      {alternative.versions.map((group) => (
                        <div
                          key={group.version}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                        >
                          <p className="flex items-center gap-2 text-sm font-black text-gray-800">
                            <MapPin className="h-4 w-4 text-red-500" />
                            {VERSION_NAMES_ES[group.version] ??
                              formatPokemonName(group.version)}
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {group.entries.map((entry, index) => (
                              <li
                                key={`${group.version}-${entry.method}-${index}`}
                                className="rounded-lg bg-white px-2.5 py-2"
                              >
                                <p className="text-[10px] font-black uppercase tracking-wide text-indigo-600">
                                  {entry.method}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-700">
                                  {entry.details ||
                                    'Disponible en este juego.'}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      <a
                        href={alternative.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Ver la ficha completa en WikiDex
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </>
                  ) : (
                    <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                      PokeAPI no registra encuentros salvajes para este juego.
                      Puede obtenerse por evolución, intercambio, regalo, evento
                      o crianza.
                    </p>
                  )
                ) : (
                  encounters.map((group) => (
                    <div
                      key={group.version}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <p className="flex items-center gap-2 text-sm font-black text-gray-800">
                        <MapPin className="h-4 w-4 text-red-500" />
                        {VERSION_NAMES_ES[group.version] ??
                          formatPokemonName(group.version)}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {group.locations.map((location) => (
                          <li
                            key={`${group.version}-${location.locationId}`}
                            className="rounded-lg bg-white px-2.5 py-2"
                          >
                            <p className="text-xs font-bold text-gray-900">
                              {location.location}
                            </p>
                            <p className="mt-0.5 text-[10px] text-gray-500">
                              {location.methods.join(', ')} · Nv.{' '}
                              {location.levels} · {location.chance}%
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>¿Buscas el shiny?</strong> Estas mismas zonas sirven para
              encontrarlo; la probabilidad depende del juego y algunos
              encuentros fijos o legendarios pueden estar bloqueados.
            </div>

            <Link
              href={`/pokedex/${lookupPokemon.id}#donde-encontrarlo`}
              onClick={() => setLookupId(null)}
              className="mt-3 inline-block text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Ver ficha completa y todos los juegos →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
