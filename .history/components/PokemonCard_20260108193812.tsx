'use client';

import { useState } from 'react';
import Modal3D from './Modal3D';

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

interface PokemonCardProps {
  pokemon: Pokemon;
}

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const typeColors: { [key: string]: string } = {
    // ...existing code...
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-400',
    ice: 'bg-cyan-400',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-500',
    rock: 'bg-yellow-700',
    ghost: 'bg-purple-700',
    dragon: 'bg-indigo-700',
    dark: 'bg-gray-700',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300',
  };

  const handleAddToTeam = () => {
    setIsAdding(true);
    if ((window as any).addPokemonToTeam) {
      (window as any).addPokemonToTeam(pokemon);
      setTimeout(() => setIsAdding(false), 1000);
    }
  };

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl">
        {/* ...existing card content... */}
        
        {/* Botones de acción */}
        <div className="flex gap-2 p-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            Ver en 3D
          </button>
          <button
            onClick={handleAddToTeam}
            disabled={isAdding}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
              isAdding
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {isAdding ? '✓ Agregado' : 'Agregar'}
          </button>
        </div>
      </div>

      {showModal && (
        <Modal3D pokemon={pokemon} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}