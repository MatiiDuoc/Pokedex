import Link from 'next/link';
import GameSelector from '@/components/GameSelector';
import { getVersionGroupInfo } from '@/data/versionGroups';
import type { GameGuide } from '@/types/game';

interface HomeGuidesProps {
  featuredGuides: GameGuide[];
  selectorGames: Array<{
    slug: string;
    title: string;
    region: string;
    generation: number;
    category: 'main' | 'spin-off';
  }>;
}

export default function HomeGuides({
  featuredGuides,
  selectorGames,
}: HomeGuidesProps) {
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-red-600">
            Guías paso a paso
          </p>
          <h2 className="mt-1 text-3xl font-black text-gray-900">
            ¿Qué estás jugando?
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Elige un juego y abre su guía completa: ruta, jefes, legendarios,
            exclusivas y checklist.
          </p>
        </div>
        <Link
          href="/guias"
          className="text-sm font-bold text-red-600 transition hover:text-red-700"
        >
          Ver las {selectorGames.length} guías →
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <GameSelector games={selectorGames} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featuredGuides.map((game) => (
          <Link
            key={game.slug}
            href={`/guias/${game.slug}`}
            className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className={`h-1.5 bg-gradient-to-r ${game.accent}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-500">
                    Gen {game.generation} · {game.region}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-gray-900 group-hover:text-red-600">
                    {game.shortTitle}
                  </h3>
                </div>
                {game.category === 'spin-off' && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                    Spin-off
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs font-semibold text-gray-500">
                {game.platform} · {game.releaseYear}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {game.pokedexMode === 'none'
                  ? 'Sin Pokédex tradicional'
                  : getVersionGroupInfo(game.slug)?.pokedexLabel ?? 'Pokédex'}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-red-600">
                Abrir guía <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
