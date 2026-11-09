'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Check, LogIn, Sparkles } from 'lucide-react';
import Modal3D from '@/components/Modal3D';
import { useTeam } from '@/components/TeamProvider';
import {
  TYPE_COLORS,
  TYPE_GRADIENTS,
  formatPokemonName,
  getLegendaryLabel,
  getTypeLabel,
} from '@/lib/pokemon';
import type { LegendaryCategory } from '@/types/pokemon';

interface PokemonDetailHeroProps {
  id: number;
  name: string;
  types: string[];
  artworkUrl: string;
  shinyArtworkUrl: string;
  height: number;
  weight: number;
  generation: number;
  legendaryCategory: LegendaryCategory;
}

export default function PokemonDetailHero({
  id,
  name,
  types,
  artworkUrl,
  shinyArtworkUrl,
  height,
  weight,
  generation,
  legendaryCategory,
}: PokemonDetailHeroProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { add, has, isFull, requiresLogin, hydrated } = useTeam();
  const [shiny, setShiny] = useState(false);
  const [show3d, setShow3d] = useState(false);

  const isInTeam = has(id);
  const legendaryLabel = getLegendaryLabel(legendaryCategory);
  const artwork = shiny ? shinyArtworkUrl : artworkUrl;
  const gradient =
    TYPE_GRADIENTS[types[0] ?? 'normal'] ?? 'from-red-500 to-orange-500';

  const preload3d = () => {
    void import('./Pokemon3DViewer').then((module) =>
      module.preloadPokemonModel(id)
    );
  };

  const handleCapture = () => {
    if (requiresLogin) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    add({
      id,
      name,
      height,
      weight,
      types,
      stats: [],
      spriteUrl: artworkUrl,
      shinySpriteUrl: shinyArtworkUrl,
      shinyArtworkUrl,
      model3dUrl: '',
      generation,
      legendaryCategory,
      url: '',
    });
  };

  const captureLabel = !hydrated
    ? 'Cargando...'
    : requiresLogin
      ? 'Inicia sesión'
      : isInTeam
        ? 'En tu equipo'
        : isFull
          ? 'Equipo lleno'
          : 'Capturar';

  return (
    <>
      <section
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-2xl sm:p-8`}
      >
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-black/10 blur-2xl" />

        <div className="relative grid items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex justify-center">
            <div className="absolute inset-8 rounded-full bg-white/20 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artwork}
              alt={`${formatPokemonName(name)}${shiny ? ' shiny' : ''}`}
              fetchPriority="high"
              onError={(event) => {
                const image = event.currentTarget;
                image.onerror = null;
                image.src = artworkUrl;
              }}
              className="relative h-64 w-64 object-contain drop-shadow-2xl sm:h-80 sm:w-80"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest">
              <span className="rounded-full bg-white/20 px-3 py-1">
                #{id.toString().padStart(4, '0')}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1">
                Gen {generation}
              </span>
              {legendaryLabel && (
                <span className="rounded-full bg-black/25 px-3 py-1">
                  {legendaryLabel}
                </span>
              )}
              {shiny && (
                <span className="rounded-full bg-yellow-300 px-3 py-1 text-amber-950">
                  ✨ Shiny
                </span>
              )}
            </div>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              {formatPokemonName(name)}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              {types.map((type) => (
                <span
                  key={type}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white shadow-sm ${
                    TYPE_COLORS[type] ?? 'bg-gray-400'
                  }`}
                >
                  {getTypeLabel(type)}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-white/85">
              <span className="rounded-full bg-white/15 px-3 py-1">
                Altura: {(height / 10).toFixed(1)} m
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1">
                Peso: {(weight / 10).toFixed(1)} kg
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCapture}
                disabled={!hydrated || isInTeam || isFull}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black shadow-lg transition disabled:cursor-not-allowed ${
                  isInTeam
                    ? 'bg-green-500 text-white'
                    : requiresLogin
                      ? 'bg-white text-gray-900 hover:bg-white/90'
                      : 'bg-white text-gray-900 hover:bg-white/90'
                }`}
              >
                {requiresLogin ? (
                  <LogIn className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {captureLabel}
              </button>

              <button
                type="button"
                onClick={() => setShiny((value) => !value)}
                aria-pressed={shiny}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black shadow-lg transition ${
                  shiny
                    ? 'bg-yellow-300 text-amber-950'
                    : 'border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {shiny ? 'Ver normal' : 'Ver shiny'}
              </button>

              <button
                type="button"
                onClick={() => setShow3d(true)}
                onMouseEnter={preload3d}
                onFocus={preload3d}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                <Box className="h-4 w-4" />
                Ver en 3D
              </button>
            </div>
          </div>
        </div>
      </section>

      {show3d && (
        <Modal3D
          pokemon={{ name, id, spriteUrl: artwork, types }}
          onClose={() => setShow3d(false)}
        />
      )}
    </>
  );
}
