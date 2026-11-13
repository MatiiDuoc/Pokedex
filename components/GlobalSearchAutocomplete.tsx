'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Search } from 'lucide-react';
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

export default function GlobalSearchAutocomplete() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = query.trim();
  const hasQuery = normalizedQuery.length >= 1;
  const isOpen = open && hasQuery;

  const flatItems: FlatItem[] = [
    ...results.pokemon.map((pokemon) => ({
      type: 'pokemon' as const,
      value: pokemon,
    })),
    ...results.games.map((game) => ({
      type: 'game' as const,
      value: game,
    })),
  ];

  const featured = results.pokemon[0];
  const otherPokemon = results.pokemon.slice(1);

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
    }, 150);

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
    router.push(`/pokedex/${item.value.id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        Math.min(index + 1, flatItems.length - 1)
      );
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
    <div ref={containerRef} className="relative">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (hasQuery) {
            router.push(`/buscar?q=${encodeURIComponent(normalizedQuery)}`);
          }
        }}
      >
        <label htmlFor="global-search" className="sr-only">
          Buscar Pokémon o guía
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id="global-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="global-search-suggestions"
          aria-activedescendant={
            activeIndex >= 0 ? `global-search-item-${activeIndex}` : undefined
          }
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (hasQuery) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar Pokémon, juego o región..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-500 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </form>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(42rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {loading && (
            <p className="px-4 py-3 text-xs font-semibold text-gray-400">
              Buscando...
            </p>
          )}

          {!loading && flatItems.length === 0 && (
            <p className="px-4 py-4 text-sm text-gray-500">
              No hay resultados para “{normalizedQuery}”.
            </p>
          )}

          {!loading && featured && (
            <button
              type="button"
              id="global-search-item-0"
              role="option"
              aria-selected={activeIndex === 0}
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => {
                setOpen(false);
                router.push(
                  `/pokedex/${featured.id}#donde-encontrarlo`
                );
              }}
              className={`flex w-full items-center gap-4 border-b border-gray-100 p-3 text-left transition ${
                activeIndex === 0 ? 'bg-red-50' : 'hover:bg-gray-50'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.artworkUrl}
                alt={formatPokemonName(featured.name)}
                loading="eager"
                className="h-20 w-20 flex-none object-contain"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-black uppercase tracking-widest text-red-600">
                  Mejor coincidencia
                </span>
                <span className="block truncate text-lg font-black text-gray-900">
                  {formatPokemonName(featured.name)}
                </span>
                <span className="block text-xs font-semibold text-gray-500">
                  {formatDexNumber(featured.id)}
                  {getLegendaryLabel(featured.legendaryCategory)
                    ? ` · ${getLegendaryLabel(featured.legendaryCategory)}`
                    : ''}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-600">
                  Ver ficha y dónde encontrarlo
                  <ArrowRight className="h-3 w-3" />
                </span>
              </span>
            </button>
          )}

          {!loading && otherPokemon.length > 0 && (
            <div className="border-b border-gray-100 p-2">
              <p className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Más Pokémon
              </p>
              {otherPokemon.map((pokemon, index) => {
                const flatIndex = index + 1;
                return (
                  <button
                    key={`pokemon-${pokemon.id}`}
                    id={`global-search-item-${flatIndex}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === flatIndex}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() =>
                      goToItem({ type: 'pokemon', value: pokemon })
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition ${
                      activeIndex === flatIndex
                        ? 'bg-red-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pokemon.artworkUrl}
                      alt=""
                      loading="lazy"
                      className="h-9 w-9 object-contain"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-900">
                        {formatPokemonName(pokemon.name)}
                      </span>
                      <span className="block text-[10px] text-gray-500">
                        {formatDexNumber(pokemon.id)}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                  </button>
                );
              })}
            </div>
          )}

          {!loading && results.games.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Guías
              </p>
              {results.games.map((game, index) => {
                const flatIndex = results.pokemon.length + index;
                return (
                  <button
                    key={`game-${game.slug}`}
                    id={`global-search-item-${flatIndex}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === flatIndex}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() => goToItem({ type: 'game', value: game })}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition ${
                      activeIndex === flatIndex
                        ? 'bg-red-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`h-9 w-9 flex-none rounded-lg bg-gradient-to-br ${game.accent}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-900">
                        {game.title}
                      </span>
                      <span className="block text-[10px] text-gray-500">
                        Gen {game.generation} · {game.region} ·{' '}
                        {game.releaseYear}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                  </button>
                );
              })}
            </div>
          )}

          {!loading && flatItems.length > 0 && (
            <Link
              href={`/buscar?q=${encodeURIComponent(normalizedQuery)}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 border-t border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
            >
              <MapPin className="h-3.5 w-3.5" />
              Ver todos los resultados
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
