'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatDexNumber,
  formatPokemonName,
  getLegendaryLabel,
} from '@/lib/pokemon';
import type { LegendaryCategory } from '@/types/pokemon';

interface SearchPokemon {
  id: number;
  name: string;
  artworkUrl: string;
  shinyArtworkUrl: string;
  legendaryCategory: LegendaryCategory;
}

interface SearchGame {
  slug: string;
  title: string;
  region: string;
  generation: number;
  releaseYear: number;
  category: 'main' | 'spin-off';
  accent: string;
}

interface SearchResults {
  pokemon: SearchPokemon[];
  games: SearchGame[];
}

const EMPTY_RESULTS: SearchResults = { pokemon: [], games: [] };

type FlatItem =
  | { type: 'pokemon'; value: SearchPokemon }
  | { type: 'game'; value: SearchGame };

const SUGGESTIONS = [
  { label: 'Pikachu', href: '/buscar?q=Pikachu' },
  { label: 'Mewtwo', href: '/buscar?q=Mewtwo' },
  { label: 'Escarlata y Púrpura', href: '/buscar?q=Escarlata' },
  { label: 'Kanto', href: '/buscar?q=Kanto' },
];

export default function HomeSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = query.trim();
  const hasQuery = normalizedQuery.length >= 2;
  const isOpen = open && hasQuery;

  const flatItems: FlatItem[] = [
    ...results.pokemon.map((pokemon) => ({ type: 'pokemon' as const, value: pokemon })),
    ...results.games.map((game) => ({ type: 'game' as const, value: game })),
  ];

  useEffect(() => {
    if (!hasQuery) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error('Búsqueda no disponible');
        const data = (await response.json()) as SearchResults;
        setResults(data);
        setOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults(EMPTY_RESULTS);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [hasQuery, normalizedQuery]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const goToItem = (item: FlatItem) => {
    setOpen(false);
    if (item.type === 'game') {
      router.push(`/guias/${item.value.slug}`);
      return;
    }
    router.push(`/buscar?q=${encodeURIComponent(item.value.name)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        event.preventDefault();
        goToItem(flatItems[activeIndex]);
        return;
      }
      if (hasQuery) {
        router.push(`/buscar?q=${encodeURIComponent(normalizedQuery)}`);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl text-left">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (hasQuery) router.push(`/buscar?q=${encodeURIComponent(normalizedQuery)}`);
        }}
      >
        <label htmlFor="home-search-input" className="sr-only">
          Buscar Pokémon o guía
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="home-search-input"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="home-search-results"
            aria-activedescendant={
              activeIndex >= 0 ? `home-search-item-${activeIndex}` : undefined
            }
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(false);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (hasQuery) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Busca un Pokémon, un juego o una región..."
            className="w-full rounded-2xl border border-white/40 bg-white/95 py-4 pl-12 pr-28 text-base text-gray-900 shadow-xl placeholder-gray-400 backdrop-blur focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-200/60"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Buscar
          </button>
        </div>
      </form>

      {!hasQuery && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-white/70">Prueba:</span>
          {SUGGESTIONS.map((suggestion) => (
            <Link
              key={suggestion.label}
              href={suggestion.href}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold text-white/90 transition hover:bg-white/20"
            >
              {suggestion.label}
            </Link>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          id="home-search-results"
          role="listbox"
          className="absolute z-40 mt-2 max-h-[28rem] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl"
        >
          {loading && (
            <p className="px-3 py-2 text-xs font-semibold text-gray-400">
              Buscando...
            </p>
          )}

          {!loading && flatItems.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-500">
              No hay resultados para “{normalizedQuery}”.
            </p>
          )}

          {results.pokemon.length > 0 && (
            <div className="mb-1">
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Pokémon
              </p>
              {results.pokemon.map((pokemon, index) => {
                const flatIndex = index;
                const label = getLegendaryLabel(pokemon.legendaryCategory);
                return (
                  <button
                    key={`pokemon-${pokemon.id}`}
                    id={`home-search-item-${flatIndex}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === flatIndex}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() => goToItem({ type: 'pokemon', value: pokemon })}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                      activeIndex === flatIndex ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pokemon.artworkUrl}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-900">
                        {formatPokemonName(pokemon.name)}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {formatDexNumber(pokemon.id)}
                        {label ? ` · ${label}` : ''}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-gray-300">↗</span>
                  </button>
                );
              })}
            </div>
          )}

          {results.games.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Guías
              </p>
              {results.games.map((game, index) => {
                const flatIndex = results.pokemon.length + index;
                return (
                  <button
                    key={`game-${game.slug}`}
                    id={`home-search-item-${flatIndex}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === flatIndex}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() => goToItem({ type: 'game', value: game })}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                      activeIndex === flatIndex ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`h-10 w-10 flex-none rounded-lg bg-gradient-to-br ${game.accent}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-900">
                        {game.title}
                      </span>
                      <span className="block text-xs text-gray-500">
                        Gen {game.generation} · {game.region} · {game.releaseYear}
                        {game.category === 'spin-off' ? ' · Spin-off' : ''}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-gray-300">↗</span>
                  </button>
                );
              })}
            </div>
          )}

          {flatItems.length > 0 && (
            <Link
              href={`/buscar?q=${encodeURIComponent(normalizedQuery)}`}
              className="mt-1 block rounded-xl bg-gray-50 px-3 py-2.5 text-center text-xs font-bold text-red-600 transition hover:bg-red-50"
            >
              Ver todos los resultados para “{normalizedQuery}”
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
