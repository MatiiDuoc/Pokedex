'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Pagination from './Pagination';
import {
  formatDexNumber,
  formatPokemonName,
  getGenerationFromId,
  getLegendaryLabel,
} from '@/lib/pokemon';
import type { PokemonIndexEntry } from '@/types/pokemon';

interface PokedexChecklistProps {
  pokemon: PokemonIndexEntry[];
  caught: number[];
  loaded: boolean;
  readOnly?: boolean;
  onToggle: (id: number) => void;
  onSetMany: (ids: number[], value: boolean) => void;
}

const ITEMS_PER_PAGE = 60;
type StatusFilter = 'all' | 'caught' | 'missing';

export default function PokedexChecklist({
  pokemon,
  caught,
  loaded,
  readOnly = false,
  onToggle,
  onSetMany,
}: PokedexChecklistProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [shiny, setShiny] = useState(false);
  const [page, setPage] = useState(1);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const caughtSet = useMemo(() => new Set(caught), [caught]);

  const filtered = useMemo(() => {
    return pokemon.filter((entry) => {
      const matchesQuery =
        deferredQuery === '' ||
        entry.name.toLowerCase().includes(deferredQuery) ||
        entry.id.toString().includes(deferredQuery);

      if (!matchesQuery) return false;
      if (status === 'caught') return caughtSet.has(entry.id);
      if (status === 'missing') return !caughtSet.has(entry.id);
      return true;
    });
  }, [pokemon, deferredQuery, status, caughtSet]);

  const caughtInGame = pokemon.filter((entry) => caughtSet.has(entry.id)).length;
  const percentage = pokemon.length === 0 ? 0 : (caughtInGame / pokemon.length) * 100;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );
  const visibleIds = visible.map((entry) => entry.id);

  return (
    <div>
      <div className="rounded-2xl bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Progreso de la Pokédex</h3>
            <p className="text-sm text-gray-600">
              {loaded ? `${caughtInGame} de ${pokemon.length} registrados` : 'Cargando progreso...'}
            </p>
          </div>
          <div className="text-3xl font-black text-red-600">
            {loaded ? `${Math.round(percentage)}%` : '—'}
          </div>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {readOnly && (
        <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">
          Inicia sesión para marcar Pokémon. La lista es de solo lectura para
          invitados, así nadie modifica el progreso de otra persona.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="dex-search" className="sr-only">
            Buscar Pokémon en la Pokédex
          </label>
          <input
            id="dex-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre o número..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
        <div>
          <label htmlFor="dex-status" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="dex-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            <option value="all">Todos</option>
            <option value="caught">Capturados</option>
            <option value="missing">Faltantes</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetMany(visibleIds, true)}
            disabled={readOnly || visibleIds.length === 0}
            className="flex-1 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Marcar página
          </button>
          <button
            type="button"
            onClick={() => onSetMany(visibleIds, false)}
            disabled={readOnly || visibleIds.length === 0}
            className="flex-1 rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Desmarcar
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600" aria-live="polite">
          {filtered.length} Pokémon en la lista
        </p>
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

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {visible.map((entry) => {
          const isCaught = caughtSet.has(entry.id);
          const legendaryLabel = getLegendaryLabel(entry.legendaryCategory);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onToggle(entry.id)}
              aria-pressed={isCaught}
              disabled={readOnly}
              className={`animate-fade-up relative rounded-xl border p-2 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed ${
                isCaught
                  ? 'border-green-300 bg-green-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-red-200 hover:shadow-sm'
              } ${readOnly ? 'opacity-80' : ''}`}
            >
              <span
                className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  isCaught ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
                aria-hidden="true"
              >
                {isCaught ? '✓' : '+'}
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
              <span className="mt-1 flex flex-wrap justify-center gap-1">
                {legendaryLabel && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${
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
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                    ✨
                  </span>
                )}
              </span>
            </button>
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
    </div>
  );
}
