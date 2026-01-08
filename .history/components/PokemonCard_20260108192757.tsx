'use client';

import { useState } from 'react';
import Modal3D from './Modal3D';

interface PokemonCardProps {
  pokemon: {
    name: string;
    id: number;
    height: number;
    weight: number;
    types: string[];
    stats: Array<{ name: string; value: number }>;
    spriteUrl: string;
    model3dUrl: string;
  };
}

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  const [showModal, setShowModal] = useState(false);

  const typeColors: { [key: string]: string } = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-400',
    ice: 'bg-cyan-400',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-amber-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-600',
    rock: 'bg-gray-600',
    ghost: 'bg-purple-700',
    dragon: 'bg-indigo-600',
    dark: 'bg-gray-800',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-400'
  };

  return (
    <>
      <div
        className="group flex flex-col rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-200/50 overflow-hidden"
      >
      <div className="relative h-40 bg-gradient-to-br from-red-400/30 via-yellow-400/30 to-red-500/30 flex items-center justify-center">
        <img
          src={pokemon.spriteUrl}
          alt={pokemon.name}
          className="h-32 w-32 object-contain drop-shadow-lg"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-red-600 bg-red-100 px-3 py-1 rounded-full">#{pokemon.id}</span>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">Gen I</span>
        </div>
        <h2 className="text-2xl font-bold capitalize text-gray-900">{pokemon.name}</h2>

        <div className="mt-3 flex gap-2 flex-wrap">
          {pokemon.types.map((type: string) => (
            <span
              key={type}
              className={`text-xs font-bold uppercase text-white px-3 py-1 rounded-full ${
                typeColors[type] || 'bg-gray-400'
              }`}
            >
              {type}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold">Altura</p>
            <p className="font-bold text-gray-900">{(pokemon.height * 0.1).toFixed(1)} m</p>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg">
            <p className="text-xs text-gray-600 font-semibold">Peso</p>
            <p className="font-bold text-gray-900">{(pokemon.weight * 0.1).toFixed(1)} kg</p>
          </div>
        </div>

        <div className="mt-4 bg-gradient-to-r from-gray-100 to-gray-50 p-3 rounded-lg">
          <p className="text-xs font-bold uppercase text-gray-700 mb-2">Estadísticas</p>
          <div className="space-y-1">
            {pokemon.stats.slice(0, 3).map((stat: any) => (
              <div key={stat.name} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 capitalize w-12">{stat.name.slice(0, 3)}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-red-600"
                    style={{ width: `${(stat.value / 150) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-6 text-right">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="mt-4 w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all active:scale-95"
        >
          Ver Detalles
        </button>
      </div>
    </div>

      {showModal && (
        <Modal3D
          pokemon={pokemon}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
