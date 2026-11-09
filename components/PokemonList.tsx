'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import SearchBar from './SearchBar';
import PokemonCard from './PokemonCard';
import Pagination from './Pagination';
import type { PokemonBasic } from '@/types/pokemon';

interface PokemonListProps {
  pokemonData: PokemonBasic[];
  totalPokemon: number;
  loadedCount: number;
}

const ITEMS_PER_PAGE = 20;

export default function PokemonList({
  pokemonData,
  totalPokemon,
  loadedCount,
}: PokemonListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    pokemonData.forEach((pokemon) => {
      pokemon.types.forEach((type) => types.add(type));
    });
    return Array.from(types).sort();
  }, [pokemonData]);

  const availableGenerations = useMemo(() => {
    const generations = new Set<number>();
    pokemonData.forEach((pokemon) => generations.add(pokemon.generation));
    return Array.from(generations).sort((a, b) => a - b);
  }, [pokemonData]);

  const filteredPokemon = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

    return pokemonData.filter((pokemon) => {
      const matchesName =
        normalizedSearch === '' || pokemon.name.toLowerCase().includes(normalizedSearch);
      const matchesType = selectedType === '' || pokemon.types.includes(selectedType);
      const matchesGeneration =
        selectedGeneration === '' || pokemon.generation === Number(selectedGeneration);

      return matchesName && matchesType && matchesGeneration;
    });
  }, [pokemonData, deferredSearchTerm, selectedType, selectedGeneration]);

  const paginatedPokemon = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPokemon.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPokemon, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredPokemon.length / ITEMS_PER_PAGE));

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (term: string, type: string, generation: string) => {
    setSearchTerm(term);
    setSelectedType(type);
    setSelectedGeneration(generation);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-gray-900 sm:text-5xl">
            Pokédex Nacional
          </h1>
          <p className="mt-3 text-gray-600">
            {totalPokemon} especies de las 9 generaciones
            {loadedCount < totalPokemon && (
              <span className="block text-sm text-gray-500">
                Mostrando {loadedCount} especies en esta vista rápida. Las guías incluyen listas completas por juego.
              </span>
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/guias"
              className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-red-600 hover:to-red-700"
            >
              Ver guías de todos los juegos
            </Link>
            <Link
              href="/pokedex"
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50"
            >
              Pokédex completa (1025)
            </Link>
          </div>
        </div>

        <SearchBar
          onSearch={handleSearch}
          availableTypes={availableTypes}
          generations={availableGenerations}
        />

        <div className="mb-4 text-sm text-gray-600" aria-live="polite">
          {filteredPokemon.length} resultado{filteredPokemon.length === 1 ? '' : 's'}
        </div>

        {paginatedPokemon.length > 0 ? (
          <>
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {paginatedPokemon.map((pokemon) => (
                <PokemonCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </section>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={filteredPokemon.length}
            />
          </>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-lg">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">No se encontraron Pokémon</p>
              <p className="mt-1 text-gray-600">Prueba con otro nombre, tipo o generación.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
