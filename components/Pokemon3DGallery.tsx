'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { Box, ExternalLink, Search, Sparkles } from 'lucide-react';
import Modal3D from '@/components/Modal3D';
import {
  LEGENDARY_FILTERS,
  TYPE_COLORS,
  formatPokemonName,
  getGenerationFromId,
  getLegendaryLabel,
  getTypeLabel,
  type LegendaryCategory,
} from '@/lib/pokemon';
import type { PokemonBasic } from '@/types/pokemon';

interface Pokemon3DGalleryProps {
  pokemon: PokemonBasic[];
}

export default function Pokemon3DGallery({ pokemon }: Pokemon3DGalleryProps) {
  const [shiny, setShiny] = useState(false);
  const [selected, setSelected] = useState<PokemonBasic | null>(null);
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('');
  const [type, setType] = useState('');
  const [legendary, setLegendary] = useState<LegendaryCategory | ''>('');

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    return pokemon.filter((entry) => {
      const matchesQuery =
        deferredQuery === '' ||
        entry.name.toLowerCase().includes(deferredQuery) ||
        entry.id.toString().includes(deferredQuery);
      const matchesGeneration =
        generation === '' || getGenerationFromId(entry.id) === Number(generation);
      const matchesType = type === '' || entry.types.includes(type);
      const matchesLegendary =
        legendary === '' || entry.legendaryCategory === legendary;

      return matchesQuery && matchesGeneration && matchesType && matchesLegendary;
    });
  }, [pokemon, deferredQuery, generation, type, legendary]);

  const preload = (id: number) => {
    void import('./Pokemon3DViewer').then((module) =>
      module.preloadPokemonModel(id)
    );
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 text-white shadow-2xl sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-white/75">
                <Box className="h-3.5 w-3.5" />
                Galería 3D
              </p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                Explora Pokémon en 3D
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Modelos interactivos con rotación, animaciones y versión shiny
                cuando está disponible. La primera carga puede tardar; después
                queda cacheada.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShiny((value) => !value)}
              aria-pressed={shiny}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                shiny
                  ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950'
                  : 'border border-white/25 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {shiny ? 'Shiny activo' : 'Ver shinies'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <label htmlFor="gallery-search" className="sr-only">
              Buscar Pokémon en la galería
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="gallery-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o número..."
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <div>
            <label htmlFor="gallery-generation" className="sr-only">
              Generación
            </label>
            <select
              id="gallery-generation"
              value={generation}
              onChange={(event) => setGeneration(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
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
            <label htmlFor="gallery-type" className="sr-only">
              Tipo
            </label>
            <select
              id="gallery-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TYPE_COLORS).map(([value]) => (
                <option key={value} value={value}>
                  {getTypeLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gallery-legendary" className="sr-only">
              Categoría especial
            </label>
            <select
              id="gallery-legendary"
              value={legendary}
              onChange={(event) =>
                setLegendary(event.target.value as LegendaryCategory | '')
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              {LEGENDARY_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.value === '' ? 'Todas las categorías' : filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-500" aria-live="polite">
          {filtered.length} modelo{filtered.length === 1 ? '' : 's'} en la galería
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((entry) => {
            const legendaryLabel = getLegendaryLabel(entry.legendaryCategory);
            const artwork = shiny ? entry.shinyArtworkUrl : entry.spriteUrl;

            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artwork}
                    alt={`${formatPokemonName(entry.name)}${shiny ? ' shiny' : ''}`}
                    loading="lazy"
                    onError={(event) => {
                      const image = event.currentTarget;
                      image.onerror = null;
                      image.src = entry.spriteUrl;
                    }}
                    className="h-36 w-36 object-contain drop-shadow-xl"
                  />
                  {shiny && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                      <Sparkles className="h-3 w-3" /> Shiny
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-gray-900">
                      {formatPokemonName(entry.name)}
                    </h2>
                    <p className="text-xs font-semibold text-gray-400">
                      #{entry.id.toString().padStart(4, '0')}
                    </p>
                  </div>
                  {legendaryLabel && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {legendaryLabel}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.types.map((type) => (
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

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(entry)}
                    onMouseEnter={() => preload(entry.id)}
                    onFocus={() => preload(entry.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                  >
                    <Box className="h-4 w-4" /> Ver en 3D
                  </button>
                  <Link
                    href={`/pokedex/${entry.id}`}
                    aria-label={`Abrir ficha de ${formatPokemonName(entry.name)}`}
                    className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-2.5 text-gray-700 transition hover:bg-gray-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            No hay modelos 3D con esos filtros.
          </p>
        )}

        <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Los modelos 3D son propiedad de Nintendo, Creatures Inc. y GAME FREAK.
          Se cargan desde Pokémon-3D-api. Si un modelo no está disponible, el
          visor muestra la imagen oficial.
        </p>
      </div>

      {selected && (
        <Modal3D
          pokemon={{
            name: selected.name,
            id: selected.id,
            spriteUrl: shiny ? selected.shinyArtworkUrl : selected.spriteUrl,
            types: selected.types,
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
