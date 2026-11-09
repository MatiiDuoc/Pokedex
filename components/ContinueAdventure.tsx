'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from '@/components/AccountProvider';

interface LastGuide {
  slug: string;
  title: string;
  region: string;
  accent: string;
  checklistTotal: number;
  updatedAt: number;
}

interface SuggestedGuide {
  slug: string;
  title: string;
  region: string;
  accent: string;
}

interface ContinueAdventureProps {
  suggestedGuides: SuggestedGuide[];
}

const STORAGE_KEY = 'pokedex:last-guide';

function readLastGuide(): LastGuide | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastGuide>;
    if (
      typeof parsed.slug !== 'string' ||
      typeof parsed.title !== 'string' ||
      typeof parsed.checklistTotal !== 'number'
    ) {
      return null;
    }
    return {
      slug: parsed.slug,
      title: parsed.title,
      region: typeof parsed.region === 'string' ? parsed.region : '',
      accent:
        typeof parsed.accent === 'string'
          ? parsed.accent
          : 'from-red-600 to-orange-500',
      checklistTotal: parsed.checklistTotal,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

export default function ContinueAdventure({
  suggestedGuides,
}: ContinueAdventureProps) {
  const { user, guides, authLoading, dataLoading } = useAccount();
  const [lastGuide, setLastGuide] = useState<LastGuide | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Leemos localStorage después de montar para evitar desajustes de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastGuide(readLastGuide());
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4">
        <div className="h-44 animate-pulse rounded-2xl bg-white shadow-sm" />
      </section>
    );
  }

  if (!lastGuide) {
    return (
      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-red-600">
                Empieza tu aventura
              </p>
              <h2 className="mt-1 text-2xl font-black text-gray-900">
                ¿Qué juego estás jugando?
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Abre una guía y guardaremos tu progreso por cuenta.
              </p>
            </div>
            <Link
              href="/guias"
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Elegir guía
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestedGuides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guias/${guide.slug}`}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
              >
                {guide.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const progress = guides[lastGuide.slug];
  const done = progress?.checklist.length ?? 0;
  const total = Math.max(1, lastGuide.checklistTotal);
  const percentage = Math.min(100, Math.round((done / total) * 100));

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${lastGuide.accent} p-6 text-white shadow-xl`}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-white/75">
              Continúa tu aventura
            </p>
            <h2 className="mt-1 truncate text-2xl font-black">{lastGuide.title}</h2>
            <p className="mt-1 text-sm text-white/80">
              {lastGuide.region} · {done} de {lastGuide.checklistTotal} objetivos
              completados
            </p>

            <div className="mt-4 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-bold text-white/75">{percentage}%</p>
          </div>

          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href={`/guias/${lastGuide.slug}`}
                  className="rounded-xl bg-white px-5 py-3 text-center text-sm font-black text-gray-900 shadow-md transition hover:bg-white/90"
                >
                  Continuar guía
                </Link>
                {dataLoading && (
                  <span className="text-center text-xs font-semibold text-white/70">
                    Sincronizando...
                  </span>
                )}
              </>
            ) : (
              <>
                <Link
                  href={`/login?next=${encodeURIComponent(`/guias/${lastGuide.slug}`)}`}
                  className="rounded-xl bg-white px-5 py-3 text-center text-sm font-black text-gray-900 shadow-md transition hover:bg-white/90"
                >
                  Iniciar sesión para guardar
                </Link>
                <Link
                  href={`/guias/${lastGuide.slug}`}
                  className="rounded-xl border border-white/30 px-5 py-2.5 text-center text-xs font-bold text-white/90 transition hover:bg-white/10"
                >
                  Leer guía sin cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
