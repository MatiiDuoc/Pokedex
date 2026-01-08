'use client';

import { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import PokemonCard from './PokemonCard';
import Pagination from './Pagination';

interface Pokemon {
  name: string;
  id: number;
  height: number;
  weight: number;
  types: string[];
  stats: Array<{ name: string; value: number }>;
  spriteUrl: string;
  model3dUrl: string;
}

interface PokemonListProps {
  pokemonData: Pokemon[];
  totalPokemon: number;
}

export default function PokemonList({ pokemonData, totalPokemon }: PokemonListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    pokemonData.forEach((pokemon) => {
      pokemon.types.forEach((type) => types.add(type));
    });
    return Array.from(types).sort();
  }, [pokemonData]);

  const filteredPokemon = useMemo(() => {
    return pokemonData.filter((pokemon) => {
      const matchesName = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '' || pokemon.types.includes(selectedType);
      return matchesName && matchesType;
    });
  }, [pokemonData, searchTerm, selectedType]);

  // Paginación local de los resultados filtrados
  const paginatedPokemon = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPokemon.slice(startIndex, endIndex);
  }, [filteredPokemon, currentPage]);

  const totalPages = Math.ceil(filteredPokemon.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900">Pokédex Oficial</h1>
          <p className="mt-2 text-gray-600">
            {totalPokemon}+ Pokémon de todas las generaciones
          </p>
          <p className="mt-2 text-gray-700">
            Desarrollado por <strong>Matias Pizarro</strong>
          </p>
        </div>

        <SearchBar
          onSearch={(term, type) => {
            setSearchTerm(term);
            setSelectedType(type);
            setCurrentPage(1); // Reset a página 1 al buscar
          }}
          availableTypes={availableTypes}
        />

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
              itemsPerPage={itemsPerPage}
              totalItems={filteredPokemon.length}
            />
          </>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-lg">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">No se encontraron Pokémon</p>
              <p className="mt-1 text-gray-600">Intenta con otro nombre o tipo</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}