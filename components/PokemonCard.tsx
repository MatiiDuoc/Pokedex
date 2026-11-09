'use client';

import { useEffect, useState } from 'react';
import Modal3D from './Modal3D';
import { useTeam } from '@/components/TeamProvider';
import type { PokemonBasic } from '@/types/pokemon';
import {
  TYPE_COLORS,
  formatPokemonName,
  getStatLabel,
  getTypeLabel,
} from '@/lib/pokemon';

interface PokemonCardProps {
  pokemon: PokemonBasic;
}

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { add, has, isFull } = useTeam();

  const isInTeam = has(pokemon.id);
  const mainStats = pokemon.stats.slice(0, 6);
  const totalStats = pokemon.stats.reduce((total, stat) => total + stat.value, 0);

  useEffect(() => {
    if (!justAdded) return;
    const timeout = window.setTimeout(() => setJustAdded(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [justAdded]);

  const handleAddToTeam = () => {
    const result = add(pokemon);
    if (result === 'added') setJustAdded(true);
  };

  const buttonLabel = justAdded
    ? '✓ Agregado'
    : isInTeam
      ? '✓ En equipo'
      : isFull
        ? 'Equipo lleno'
        : '⚡ Capturar';

  return (
    <>
      <article className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
        <div
          className={`absolute inset-0 opacity-10 ${
            TYPE_COLORS[pokemon.types[0]] ?? 'bg-gray-400'
          }`}
          aria-hidden="true"
        />

        <div className="relative p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                {formatPokemonName(pokemon.name)}
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-500">
                  #{pokemon.id.toString().padStart(3, '0')}
                </p>
                <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                  Gen {pokemon.generation}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white shadow-md ${
                    TYPE_COLORS[type] ?? 'bg-gray-400'
                  }`}
                >
                  {getTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-50 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pokemon.spriteUrl}
                alt={formatPokemonName(pokemon.name)}
                loading="lazy"
                className="relative h-48 w-48 object-contain drop-shadow-2xl transition-transform group-hover:scale-110"
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4">
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600">Altura</p>
              <p className="text-lg font-bold text-gray-900">
                {(pokemon.height / 10).toFixed(1)} m
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-600">Peso</p>
              <p className="text-lg font-bold text-gray-900">
                {(pokemon.weight / 10).toFixed(1)} kg
              </p>
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <h3 className="text-sm font-bold text-gray-700">Estadísticas base</h3>
            {mainStats.map((stat) => {
              const percentage = (stat.value / 255) * 100;
              return (
                <div key={stat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-600">
                      {getStatLabel(stat.name)}
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

          <div className="mb-4 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 p-3 text-center">
            <p className="text-xs font-semibold text-gray-600">Total de estadísticas</p>
            <p className="text-2xl font-black text-gray-900">{totalStats}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              🎮 Ver ficha
            </button>
            <button
              type="button"
              onClick={handleAddToTeam}
              disabled={isInTeam || isFull}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed ${
                justAdded || isInTeam
                  ? 'bg-green-500'
                  : isFull
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </article>

      {showModal && (
        <Modal3D pokemon={pokemon} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
