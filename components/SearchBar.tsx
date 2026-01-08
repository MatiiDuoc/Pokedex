'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (searchTerm: string, selectedType: string) => void;
  availableTypes: string[];
}

export default function SearchBar({ onSearch, availableTypes }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term, selectedType);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setSelectedType(type);
    onSearch(searchTerm, type);
  };

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </div>

      <div className="flex-1">
        <select
          value={selectedType}
          onChange={handleTypeChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          <option value="">Todos los tipos</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
