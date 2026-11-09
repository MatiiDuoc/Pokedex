'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  formatDexNumber,
  formatPokemonName,
  getLegendaryLabel,
} from '@/lib/pokemon';
import type { LegendaryCategory } from '@/types/pokemon';

export interface LegendaryPreview {
  id: number;
  name: string;
  artworkUrl: string;
  shinyArtworkUrl: string;
  legendaryCategory: LegendaryCategory;
}

interface HomeLegendaryStripProps {
  pokemon: LegendaryPreview[];
}

export default function HomeLegendaryStrip({
  pokemon,
}: HomeLegendaryStripProps) {
  const [shiny, setShiny] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-600">
              Especiales
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">
              Legendarios, míticos y ultraentes
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Todos incluidos en la Pokédex, con su versión shiny.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShiny((value) => !value)}
              aria-pressed={shiny}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                shiny
                  ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950 shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✨ {shiny ? 'Shiny activo' : 'Ver shinies'}
            </button>
            <Link
              href="/pokedex"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Ver todos
            </Link>
          </div>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {pokemon.map((entry) => {
            const label = getLegendaryLabel(entry.legendaryCategory);
            return (
              <Link
                key={entry.id}
                href={`/buscar?q=${encodeURIComponent(entry.name)}`}
                className="w-28 flex-none rounded-xl border border-gray-100 bg-gray-50 p-2 text-center transition hover:border-amber-200 hover:bg-amber-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shiny ? entry.shinyArtworkUrl : entry.artworkUrl}
                  alt={`${formatPokemonName(entry.name)}${shiny ? ' shiny' : ''}`}
                  loading="lazy"
                  onError={(event) => {
                    const image = event.currentTarget;
                    image.onerror = null;
                    image.src = entry.artworkUrl;
                  }}
                  className="mx-auto h-20 w-20 object-contain"
                />
                <span className="mt-1 block truncate text-xs font-bold text-gray-900">
                  {formatPokemonName(entry.name)}
                </span>
                <span className="block text-[10px] font-semibold text-gray-400">
                  {formatDexNumber(entry.id)}
                </span>
                <span
                  className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${
                    entry.legendaryCategory === 'mythical'
                      ? 'bg-fuchsia-600'
                      : entry.legendaryCategory === 'ultra-beast'
                        ? 'bg-cyan-600'
                        : 'bg-amber-500'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
