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

  // Estadísticas principales para mostrar
  const mainStats = pokemon.stats.slice(0, 6); // HP, Attack, Defense, Sp.Atk, Sp.Def, Speed

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1">
        {/* Fondo degradado según tipo principal */}
        <div
          className={`absolute inset-0 opacity-10 ${
            typeColors[pokemon.types[0]] || 'bg-gray-400'
          }`}
        />

        {/* Contenido de la card */}
        <div className="relative p-6">
          {/* Header: ID y Nombre */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black capitalize text-gray-900">
                {pokemon.name}
              </h2>
              <p className="text-sm font-semibold text-gray-500">#{pokemon.id.toString().padStart(3, '0')}</p>
            </div>
            {/* Tipos */}
            <div className="flex flex-col gap-1">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white shadow-md ${
                    typeColors[type] || 'bg-gray-400'
                  }`}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Imagen del Pokémon */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 blur-2xl opacity-50" />
              <img
                src={pokemon.spriteUrl}
                alt={pokemon.name}
                className="relative h-48 w-48 object-contain drop-shadow-2xl transition-transform group-hover:scale-110"
              />
            </div>
          </div>

          {/* Información física */}
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4">
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600">Altura</p>
              <p className="text-lg font-bold text-gray-900">{(pokemon.height / 10).toFixed(1)} m</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600">Peso</p>
              <p className="text-lg font-bold text-gray-900">{(pokemon.weight / 10).toFixed(1)} kg</p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mb-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Estadísticas Base</h3>
            {mainStats.map((stat) => {
              const percentage = (stat.value / 255) * 100; // Max stat típico es ~255
              return (
                <div key={stat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold capitalize text-gray-600">
                      {stat.name.replace('-', ' ')}
                    </span>
                    <span className="font-bold text-gray-900">{stat.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stat.value >= 100
                          ? 'bg-green-500'
                          : stat.value >= 60
                          ? 'bg-blue-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total de stats */}
          <div className="mb-4 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 p-3 text-center">
            <p className="text-xs font-semibold text-gray-600">Total Stats</p>
            <p className="text-2xl font-black text-gray-900">
              {pokemon.stats.reduce((acc, stat) => acc + stat.value, 0)}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:from-blue-600 hover:to-blue-700 transition-all hover:shadow-lg"
            >
              🎮 Ver 3D
            </button>
            <button
              onClick={handleAddToTeam}
              disabled={isAdding}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg ${
                isAdding
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {isAdding ? '✓ Agregado' : '⚡ Capturar'}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal3D pokemon={pokemon} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}