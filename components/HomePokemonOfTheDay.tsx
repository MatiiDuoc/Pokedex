'use client';

import { useState } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import PokemonCard from '@/components/PokemonCard';
import type { PokemonBasic } from '@/types/pokemon';

interface HomePokemonOfTheDayProps {
  pokemon: PokemonBasic;
  dateLabel: string;
}

export default function HomePokemonOfTheDay({
  pokemon,
  dateLabel,
}: HomePokemonOfTheDayProps) {
  const [shiny, setShiny] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid items-center gap-6 p-5 lg:grid-cols-[1fr_0.55fr] lg:p-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-600">
              <CalendarDays className="h-4 w-4" />
              Pokémon del día
            </p>
            <h2 className="mt-1 text-3xl font-black text-gray-900">
              {dateLabel}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Una especie distinta cada día. Puedes ver su ficha, abrir el visor
              3D, cambiar a shiny o capturarla para tu equipo.
            </p>
            <button
              type="button"
              onClick={() => setShiny((value) => !value)}
              aria-pressed={shiny}
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                shiny
                  ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {shiny ? 'Shiny activo' : 'Ver shiny'}
            </button>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <PokemonCard pokemon={pokemon} shiny={shiny} />
          </div>
        </div>
      </div>
    </section>
  );
}
