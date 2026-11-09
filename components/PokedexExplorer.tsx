'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Pagination from './Pagination';
import {
  formatDexNumber,
  formatPokemonName,
  getGenerationFromId,
} from '@/lib/pokemon';
import type { PokemonIndexEntry } from '@/types/pokemon';

interface PokedexExplorerProps {
  pokemon: PokemonIndexEntry[];
}

const ITEMS_PER_PAGE = 60;

export default function PokedexExplorer({ pokemon }: PokedexExplorerProps) {
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('');
  const [page, setPage] = useState(1);

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    return pokemon.filter((entry) => {
      const matchesQuery =
        deferredQuery === '' ||
        entry.name.toLowerCase().includes(deferredQuery) ||
        entry.id.toString().includes(deferredQuery);
      const matchesGeneration =
        generation === '' || getGenerationFromId(entry.id) === Number(generation);

      return matchesQuery && matchesGeneration;
    });
  }, [pokemon, deferredQuery, generation]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const resetPage = () => setPage(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-gray-900">Pokédex completa</h1>
          <p className="mt-2 text-gray-600">
            Las {pokemon.length} especies del Pokédex Nacional, con búsqueda por nombre o número.
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="mb-4 text-sm text-gray-600" aria-live="polite">
          {filtered.length} Pokémon encontrados
        </div>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.artworkUrl}
                alt={formatPokemonName(entry.name)}
                loading="lazy"
                className="mx-auto h-24 w-24 object-contain"
              />
              <p className="mt-1 text-xs font-semibold text-gray-500">
                {formatDexNumber(entry.id)}
              </p>
              <h2 className="text-sm font-bold text-gray-900">
                {formatPokemonName(entry.name)}
              </h2>
              <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                Gen {getGenerationFromId(entry.id)}
              </span>
            </article>
          ))}
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
