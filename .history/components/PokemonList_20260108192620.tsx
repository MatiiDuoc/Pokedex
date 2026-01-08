'use client';

import { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import PokemonCard from './PokemonCard';

interface Pokemon {
  name: string;
  id: number;
  height: number;
  weight: number;
  types: string[];
  stats: Array<{ name: string; value: number }>;
  spriteUrl: string;
}

interface PokemonListProps {
  pokemonData: Pokemon[];
}

export default function PokemonList({ pokemonData }: PokemonListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Obtener todos los tipos únicos para el dropdown
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    pokemonData.forEach((pokemon) => {
      pokemon.types.forEach((type) => types.add(type));
    });
    return Array.from(types).sort();
  }, [pokemonData]);

  // Filtrar Pokémon por nombre Y tipo
  const filteredPokemon = useMemo(() => {
    return pokemonData.filter((pokemon) => {
      const matchesName = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '' || pokemon.types.includes(selectedType);
      return matchesName && matchesType;
    });
  }, [pokemonData, searchTerm, selectedType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900">Pokédex Oficial</h1>
          <p className="mt-2 text-gray-600">Descubre todos los Pokémon</p>
          <p className="mt-2 text-gray-700 strong">Desarrollado por Matias Pizarro</p>
        </div>

        <SearchBar
          onSearch={(term, type) => {
            setSearchTerm(term);
            setSelectedType(type);
          }}
          availableTypes={availableTypes}
        />

        {filteredPokemon.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredPokemon.map((pokemon) => (
              <PokemonCard key={pokemon.name} pokemon={pokemon} />
            ))}
          </section>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-lg">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">No se encontraron Pokémon</p>
              <p className="mt-1 text-gray-600">Intenta con otro nombre o tipo</p>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-600">
          Mostrando {filteredPokemon.length} de {pokemonData.length} Pokémon
        </p>
      </div>
    </div>
  );
}
