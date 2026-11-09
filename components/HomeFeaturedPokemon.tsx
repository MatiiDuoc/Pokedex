'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import PokemonCard from '@/components/PokemonCard';
import type { PokemonBasic } from '@/types/pokemon';

interface HomeFeaturedPokemonProps {
  pokemon: PokemonBasic[];
}

export default function HomeFeaturedPokemon({
  pokemon,
}: HomeFeaturedPokemonProps) {
  const [shiny, setShiny] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-red-600">
            Pokédex
          </p>
          <h2 className="mt-1 text-3xl font-black text-gray-900">
            Pokémon destacados
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Una selección de todas las generaciones. La Pokédex completa tiene
            las 1025 especies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShiny((value) => !value)}
            aria-pressed={shiny}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
              shiny
                ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950 shadow-md'
                : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            {shiny ? 'Shiny activo' : 'Ver shinies'}
          </button>
          <Link
            href="/pokedex"
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Ver las 1025
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pokemon.map((entry) => (
          <PokemonCard key={entry.id} pokemon={entry} shiny={shiny} />
        ))}
      </div>
    </section>
  );
}
