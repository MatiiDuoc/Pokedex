'use client';

import { useState } from 'react';
import { getTypeLabel } from '@/lib/pokemon';

interface SearchBarProps {
  onSearch: (searchTerm: string, selectedType: string, generation: string) => void;
  availableTypes: string[];
  generations: number[];
}

export default function SearchBar({
  onSearch,
  availableTypes,
  generations,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    onSearch(term, selectedType, selectedGeneration);
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value;
    setSelectedType(type);
    onSearch(searchTerm, type, selectedGeneration);
  };

  const handleGenerationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const generation = event.target.value;
    setSelectedGeneration(generation);
    onSearch(searchTerm, selectedType, generation);
  };

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label htmlFor="pokemon-search" className="sr-only">
          Buscar Pokémon por nombre
        </label>
        <input
          id="pokemon-search"
          type="search"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </div>

      <div>
        <label htmlFor="pokemon-type" className="sr-only">
          Filtrar por tipo
        </label>
        <select
          id="pokemon-type"
          value={selectedType}
          onChange={handleTypeChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          <option value="">Todos los tipos</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {getTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pokemon-generation" className="sr-only">
          Filtrar por generación
        </label>
        <select
          id="pokemon-generation"
          value={selectedGeneration}
          onChange={handleGenerationChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          <option value="">Todas las generaciones</option>
          {generations.map((generation) => (
            <option key={generation} value={generation}>
              Generación {generation}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
