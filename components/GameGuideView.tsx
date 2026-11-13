'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  NotebookPen,
} from 'lucide-react';
import GameTeamBuilder from './GameTeamBuilder';
import GymBadge from './GymBadge';
import PokedexChecklist from './PokedexChecklist';
import RegionRouteMap from './RegionRouteMap';
import TrainerAvatar from './TrainerAvatar';
import { useAccount } from '@/components/AccountProvider';
import { getGymBadgeVisual } from '@/lib/gym-badges';
import { getGymTypeVisual } from '@/lib/gym-visuals';
import { hasTrainerSprite } from '@/lib/trainer-sprites';
import { useGameProgress } from '@/lib/progress';
import {
  SPANISH_TYPE_TO_KEY,
  TYPE_COLORS,
  formatPokemonName,
  getTypeColorByLabel,
  getTypeLabel,
} from '@/lib/pokemon';
import { TYPE_CHART, isPokemonType } from '@/lib/type-chart';
import { usePokemonFilters } from '@/lib/usePokemonFilters';
import type { GameGym, GameGuide } from '@/types/game';
import {
  GUIDE_TABS,
  type GuideTabId,
  type LastGuideData,
} from '@/types/last-guide';
import type { PokemonIndexEntry } from '@/types/pokemon';

interface GameGuideViewProps {
  game: GameGuide;
  pokemon: PokemonIndexEntry[];
  pokedexLabel: string;
  versionGroup: string | null;
}

type TabId =
  | 'resumen'
  | 'pasos'
  | 'desafios'
  | 'equipo'
  | 'pokedex'
  | 'consejos';

export default function GameGuideView({
  game,
  pokemon,
  pokedexLabel,
  versionGroup,
}: GameGuideViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const appliedDeepLink = useRef(false);
  const appliedTabLink = useRef(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const { syncError, saving, user } = useAccount();
  const {
    progress,
    loaded,
    requiresLogin,
    toggleCaught,
    setCaught,
    toggleChecklist,
    setChecklist,
    setNote,
    reset,
    isChecked,
  } = useGameProgress(game.slug);

  const hasPokedex = (game.pokedexMode ?? 'regional') !== 'none';
  const badgeCaseTitle =
    game.slug === 'sun-moon' || game.slug === 'ultra-sun-ultra-moon'
      ? 'Caja de cristales Z'
      : game.slug === 'legends-arceus'
        ? 'Nobles derrotados'
        : game.slug === 'legends-z-a'
          ? 'Rangos Z-A'
          : (game.category ?? 'main') === 'spin-off'
            ? 'Progreso de desafíos'
            : 'Caja de insignias';
  const loginHref = `/login?next=${encodeURIComponent(`/guias/${game.slug}`)}`;
  const progressReadOnly = requiresLogin || !loaded;
  const { data: filterData } = usePokemonFilters(hasPokedex && loaded);

  const selectTab = useCallback((tab: TabId, step?: number) => {
    setActiveTab(tab);

    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (tab === 'resumen') url.searchParams.delete('tab');
    else url.searchParams.set('tab', tab);

    if (step !== undefined) url.searchParams.set('paso', String(step));
    else url.searchParams.delete('paso');

    window.history.replaceState(
      null,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, []);

  useEffect(() => {
    const container = tabsScrollRef.current;
    if (!container) return;

    const active = container.querySelector<HTMLButtonElement>(
      '[role="tab"][aria-selected="true"]'
    );
    if (!active) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    if (
      activeRect.left < containerRect.left ||
      activeRect.right > containerRect.right
    ) {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      container.scrollTo({
        left:
          container.scrollLeft +
          activeRect.left -
          containerRect.left -
          8,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (appliedTabLink.current) return;
    appliedTabLink.current = true;

    const rawTab = new URLSearchParams(window.location.search).get('tab');
    if (!rawTab || !GUIDE_TABS.includes(rawTab as GuideTabId)) return;

    window.setTimeout(() => setActiveTab(rawTab as TabId), 0);
  }, []);

  useEffect(() => {
    const nextStep = game.walkthrough.findIndex(
      (_, index) => !progress.checklist.includes(`step:${index}`)
    );
    const completedSteps = game.walkthrough.filter((_, index) =>
      progress.checklist.includes(`step:${index}`)
    ).length;

    try {
      window.localStorage.setItem(
        'pokedex:last-guide',
        JSON.stringify({
          slug: game.slug,
          title: game.title,
          region: game.region,
          accent: game.accent,
          tab: activeTab,
          checklistTotal: game.completionChecklist.length,
          stepsTotal: game.walkthrough.length,
          challengesTotal: game.gyms.length,
          stepsDone: completedSteps,
          nextStep,
          nextStepTitle: nextStep >= 0 ? game.walkthrough[nextStep].title : null,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // localStorage puede estar bloqueado.
    }
  }, [
    game.slug,
    game.title,
    game.region,
    game.accent,
    game.completionChecklist.length,
    game.gyms.length,
    game.walkthrough,
    progress.checklist,
    activeTab,
  ]);

  useEffect(() => {
    if (!user || !loaded) return;

    const nextStep = game.walkthrough.findIndex(
      (_, index) => !progress.checklist.includes(`step:${index}`)
    );

    const payload: LastGuideData = {
      slug: game.slug,
      title: game.title,
      region: game.region,
      accent: game.accent,
      tab: activeTab,
      checklistTotal: game.completionChecklist.length,
      stepsTotal: game.walkthrough.length,
      challengesTotal: game.gyms.length,
      nextStep,
      nextStepTitle: nextStep >= 0 ? game.walkthrough[nextStep].title : null,
      updatedAt: Date.now(),
    };

    const timer = window.setTimeout(() => {
      void fetch('/api/account/last-guide', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      }).catch(() => {
        // La copia local sigue disponible si falla la red.
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    user,
    loaded,
    game.slug,
    game.title,
    game.region,
    game.accent,
    game.completionChecklist.length,
    game.walkthrough,
    game.gyms.length,
    activeTab,
    progress.checklist,
  ]);

  const checklistDone = game.completionChecklist.filter((item) =>
    progress.checklist.includes(item)
  ).length;
  const stepsDone = game.walkthrough.filter((_, index) =>
    progress.checklist.includes(`step:${index}`)
  ).length;
  const dexDone = pokemon.filter((entry) => progress.caught.includes(entry.id)).length;
  const gymsDone = game.gyms.filter((_, index) =>
    progress.checklist.includes(`challenge:${index}`)
  ).length;
  const completedGymIndices = game.gyms.flatMap((_, index) =>
    progress.checklist.includes(`challenge:${index}`) ? [index] : []
  );

  const adventureTotal =
    game.completionChecklist.length + game.walkthrough.length + game.gyms.length;
  const adventureDone = checklistDone + stepsDone + gymsDone;
  const adventurePercentage =
    adventureTotal === 0
      ? 0
      : Math.round((adventureDone / adventureTotal) * 100);
  const nextStepIndex = game.walkthrough.findIndex(
    (_, index) => !progress.checklist.includes(`step:${index}`)
  );
  const nextStep = nextStepIndex >= 0 ? game.walkthrough[nextStepIndex] : null;
  const nextStepNote = nextStep
    ? (progress.notes?.[`step:${nextStepIndex}`] ?? '')
    : '';
  const stepsPercentage =
    game.walkthrough.length === 0
      ? 0
      : Math.round((stepsDone / game.walkthrough.length) * 100);
  const nextChallengeIndex = game.gyms.findIndex(
    (_, index) => !progress.checklist.includes(`challenge:${index}`)
  );
  const nextChallenge =
    nextChallengeIndex >= 0 ? game.gyms[nextChallengeIndex] : null;

  const filterTypeMap = useMemo(
    () => new Map((filterData ?? []).map((entry) => [entry.id, entry.types])),
    [filterData]
  );

  const nextChallengePicks = useMemo(() => {
    if (!nextChallenge) return [];

    const gymTypes = nextChallenge.type
      .split('/')
      .map((part) => SPANISH_TYPE_TO_KEY[part.trim().toLowerCase()])
      .filter(isPokemonType);

    if (gymTypes.length === 0) return [];

    const caught = new Set(progress.caught);

    return pokemon
      .filter(
        (entry) =>
          !caught.has(entry.id) && entry.legendaryCategory === 'none'
      )
      .map((entry) => {
        const types = filterTypeMap.get(entry.id) ?? [];
        const typedTypes = types.filter(isPokemonType);
        const offensive = typedTypes.filter((type) =>
          gymTypes.some(
            (gymType) => (TYPE_CHART[type][gymType] ?? 1) > 1
          )
        ).length;
        const defensive = typedTypes.filter((type) =>
          gymTypes.some(
            (gymType) => (TYPE_CHART[gymType][type] ?? 1) < 1
          )
        ).length;

        return {
          entry,
          types,
          score: offensive * 2 + defensive,
        };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.id - b.entry.id)
      .slice(0, 4);
  }, [nextChallenge, filterTypeMap, pokemon, progress.caught]);

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= game.walkthrough.length) return;

      selectTab('pasos', index);
      window.setTimeout(() => {
        const element = document.getElementById(`paso-${index}`);
        if (!element) return;

        const reduceMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches;
        const top =
          element.getBoundingClientRect().top +
          window.scrollY -
          getGuideScrollOffset();

        window.scrollTo({
          top,
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
        element.focus({ preventScroll: true });
      }, 80);
    },
    [game.walkthrough.length, selectTab]
  );

  const goToGym = useCallback((index: number) => {
    if (index < 0 || index >= game.gyms.length) return;

    selectTab('desafios');
    window.setTimeout(() => {
      const element = document.getElementById(`gym-${index}`);
      if (!element) return;

      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const top =
        element.getBoundingClientRect().top +
        window.scrollY -
        getGuideScrollOffset();

      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      element.focus({ preventScroll: true });
    }, 60);
  }, [game.gyms.length, selectTab]);

  const handleCompleteAndContinue = (index: number) => {
    if (progressReadOnly) return;

    const key = `step:${index}`;
    if (!isChecked(key)) toggleChecklist(key);

    let next = -1;

    for (let cursor = index + 1; cursor < game.walkthrough.length; cursor += 1) {
      if (!isChecked(`step:${cursor}`)) {
        next = cursor;
        break;
      }
    }

    if (next === -1) {
      for (let cursor = 0; cursor < index; cursor += 1) {
        if (!isChecked(`step:${cursor}`)) {
          next = cursor;
          break;
        }
      }
    }

    if (next >= 0) goToStep(next);
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'pasos', label: 'Paso a paso' },
    { id: 'desafios', label: game.challengeLabel },
    ...(hasPokedex
      ? [
          { id: 'equipo' as const, label: 'Mi equipo' },
          { id: 'pokedex' as const, label: 'Pokédex' },
        ]
      : []),
    { id: 'consejos', label: 'Consejos' },
  ];

  const handleReset = () => {
    const confirmed = window.confirm(
      '¿Reiniciar todo el progreso de esta guía? Esta acción no se puede deshacer.'
    );
    if (confirmed) reset();
  };

  useEffect(() => {
    if (!loaded || appliedDeepLink.current) return;
    appliedDeepLink.current = true;

    const params = new URLSearchParams(window.location.search);
    const rawStep = params.get('paso');
    if (rawStep === null) return;

    const index = Number.parseInt(rawStep, 10);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= game.walkthrough.length
    ) {
      return;
    }

    window.setTimeout(() => goToStep(index), 0);
  }, [loaded, game.walkthrough.length, goToStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/guias"
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 transition hover:text-red-600"
        >
          <span aria-hidden="true">←</span> Volver a todas las guías
        </Link>

        <header className={`mt-4 overflow-hidden rounded-3xl bg-gradient-to-r ${game.accent} p-6 text-white shadow-xl sm:p-8`}>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/90">
            <span className="rounded-full bg-white/20 px-2.5 py-1">
              Generación {game.generation}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-1">{game.region}</span>
            {game.category === 'spin-off' && (
              <span className="rounded-full bg-white/20 px-2.5 py-1">Spin-off</span>
            )}
            <span className="rounded-full bg-white/20 px-2.5 py-1">{game.platform}</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1">{game.releaseYear}</span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
            {game.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-white/90 sm:text-base">
            {hasPokedex
              ? `${pokedexLabel}: ${pokemon.length} especies. `
              : 'Guía de spin-off centrada en la historia, los jefes y los objetivos de completado. '}
            Esta guía reúne la ruta principal, los desafíos, los legendarios,
            las exclusivas de versión y una checklist completa para que no te
            dejes nada.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {game.versions.map((version) => (
              <span
                key={version}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold"
              >
                {version}
              </span>
            ))}
          </div>
        </header>

        {syncError && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
          >
            {syncError}
          </p>
        )}

        {requiresLogin && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">
              Inicia sesión para marcar tu progreso. Las guías se pueden leer sin
              cuenta, pero las marcas se guardan por usuario.
            </p>
            <Link
              href={loginHref}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        {!loaded && !requiresLogin && (
          <p className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500">
            Cargando tu progreso...
          </p>
        )}

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Progreso de aventura
            </p>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-black text-gray-900">
                {loaded ? `${adventurePercentage}%` : '—'}
              </p>
              <p className="text-xs text-gray-500">
                {adventureDone}/{adventureTotal}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                style={{ width: `${adventurePercentage}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Pasos, insignias y objetivos
              </p>
              {user && loaded && (
                <span
                  className={`text-[10px] font-bold ${
                    saving ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  {saving ? 'Guardando…' : 'Guardado'}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Checklist
            </p>
            <p className="mt-1 text-3xl font-black text-gray-900">
              {loaded ? `${checklistDone}/${game.completionChecklist.length}` : '—'}
            </p>
            <p className="mt-2 text-xs text-gray-500">Objetivos de completado</p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {hasPokedex ? 'Pokédex' : 'Pasos'}
            </p>
            <p className="mt-1 text-3xl font-black text-gray-900">
              {loaded
                ? hasPokedex
                  ? `${dexDone}/${pokemon.length}`
                  : `${stepsDone}/${game.walkthrough.length}`
                : '—'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {hasPokedex ? 'Especies marcadas' : 'Pasos completados'}
            </p>
          </div>
        </section>

        {loaded && game.walkthrough.length > 0 && activeTab !== 'pasos' && (
          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-600">
                  <Compass className="h-4 w-4" />
                  {nextStep ? 'Tu siguiente paso' : 'Ruta completada'}
                </p>
                {nextStep ? (
                  <>
                    <h2 className="mt-1 text-xl font-black text-gray-900">
                      {nextStepIndex + 1}. {nextStep.title}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-gray-600">
                      {nextStep.goal}
                    </p>
                    {nextStepNote && (
                      <p className="mt-2 line-clamp-3 whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                        Nota: {nextStepNote}
                      </p>
                    )}
                    {nextChallenge && (
                      <NextChallengePicks
                        challenge={nextChallenge}
                        picks={nextChallengePicks}
                        gameSlug={game.slug}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="mt-1 text-xl font-black text-gray-900">
                      ¡Has completado todos los pasos!
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Repasa la checklist y el Pokédex para terminar los
                      objetivos restantes.
                    </p>
                  </>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                      style={{ width: `${stepsPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500">
                    {stepsDone}/{game.walkthrough.length} pasos
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {nextStep ? (
                  <>
                    <button
                      type="button"
                      onClick={() => goToStep(nextStepIndex)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
                    >
                      Ver paso
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {!progressReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleCompleteAndContinue(nextStepIndex)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar y seguir
                      </button>
                    )}
                    {requiresLogin && (
                      <Link
                        href={loginHref}
                        className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        Iniciar sesión para guardar
                      </Link>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectTab('resumen')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
                  >
                    Ver checklist
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        <div
          id="guide-tabs"
          className="sticky top-[61px] z-30 mt-5 -mx-4 border-y border-gray-200 bg-white/95 px-4 backdrop-blur lg:top-[107px]"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-2 py-2">
            <div
              ref={tabsScrollRef}
              className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
              role="tablist"
              aria-label="Secciones de la guía"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => selectTab(tab.id)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex-none whitespace-nowrap rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:border-0 sm:px-3 sm:text-sm"
            >
              Reiniciar<span className="hidden lg:inline"> progreso</span>
            </button>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'resumen' && (
            <section
              id="panel-resumen"
              role="tabpanel"
              aria-labelledby="tab-resumen"
              className="space-y-5"
            >
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-lg font-bold text-amber-900">Antes de empezar</h2>
                <p className="mt-1 text-sm text-amber-900/90">{game.dexNote}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard label="Región" value={game.region} />
                <InfoCard label="Plataforma" value={game.platform} />
                <InfoCard label="Lanzamiento" value={String(game.releaseYear)} />
                <InfoCard
                  label={hasPokedex ? 'Pokédex' : 'Categoría'}
                  value={
                    hasPokedex
                      ? `${pokemon.length} especies`
                      : game.category === 'spin-off'
                        ? 'Spin-off'
                        : 'No aplica'
                  }
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900">Iniciales</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {game.starters.map((starter) => (
                      <span
                        key={starter}
                        className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-800"
                      >
                        {starter}
                      </span>
                    ))}
                  </div>
                </div>

                {[...game.boxLegendaries, ...game.mythicals].length > 0 && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">
                      Legendarios y míticos
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...game.boxLegendaries, ...game.mythicals].map((legendary) => (
                        <span
                          key={legendary}
                          className="rounded-full bg-purple-50 px-3 py-1.5 text-sm font-semibold text-purple-800"
                        >
                          {legendary}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {game.versionExclusives.length > 0 && (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900">
                    Exclusivas de versión
                  </h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {game.versionExclusives.map((group) => (
                      <div key={group.version} className="rounded-xl bg-gray-50 p-4">
                        <h3 className="text-sm font-black uppercase tracking-wide text-red-600">
                          {group.version}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {group.pokemon.map((entry) => (
                            <span
                              key={`${group.version}-${entry}`}
                              className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm"
                            >
                              {entry}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-gray-900">
                    Checklist de completado
                  </h2>
                  <span className="text-sm font-bold text-gray-500">
                    {checklistDone}/{game.completionChecklist.length}
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {game.completionChecklist.map((item) => {
                    const checked = isChecked(item);
                    return (
                      <li key={item}>
                        <button
                          type="button"
                          onClick={() => toggleChecklist(item)}
                          aria-pressed={checked}
                          disabled={progressReadOnly}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-70 ${
                            checked
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-red-200'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm font-bold ${
                              checked
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            aria-hidden="true"
                          >
                            {checked ? '✓' : ''}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              checked ? 'text-green-900 line-through' : 'text-gray-800'
                            }`}
                          >
                            {item}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          {activeTab === 'pasos' && (
            <section
              id="panel-pasos"
              role="tabpanel"
              aria-labelledby="tab-pasos"
            >
              <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-red-600">
                      <Compass className="h-4 w-4" />
                      Modo aventura
                    </p>
                    <h2 className="mt-1 text-xl font-black text-gray-900">
                      {nextStep ? `Ahora: ${nextStep.title}` : 'Ruta completada'}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-600">
                      {nextStep
                        ? nextStep.goal
                        : 'Has completado todos los pasos. Revisa la checklist y el Pokédex para terminar el 100%.'}
                    </p>
                    {nextStepNote && (
                      <p className="mt-2 whitespace-pre-line rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                        Nota: {nextStepNote}
                      </p>
                    )}
                    {nextChallenge && (
                      <NextChallengePicks
                        challenge={nextChallenge}
                        picks={nextChallengePicks}
                        gameSlug={game.slug}
                      />
                    )}
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      {requiresLogin
                        ? 'Inicia sesión para guardar tu avance.'
                        : 'Tu progreso se guarda en tu cuenta.'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-2 text-center">
                    <p className="text-2xl font-black text-gray-900">
                      {stepsDone}/{game.walkthrough.length}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      pasos
                    </p>
                  </div>
                </div>

                <div
                  className="mt-4 flex flex-wrap gap-1.5"
                  aria-label="Ir directamente a un paso"
                >
                  {game.walkthrough.map((step, index) => {
                    const stepChecked = isChecked(`step:${index}`);
                    const isNext = index === nextStepIndex;

                    return (
                      <button
                        key={`jump-${step.title}`}
                        type="button"
                        onClick={() => goToStep(index)}
                        aria-current={isNext ? 'step' : undefined}
                        aria-label={`Ir al paso ${index + 1}: ${step.title}`}
                        title={step.title}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-black transition ${
                          stepChecked
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : isNext
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {stepChecked ? '✓' : index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <ol className="space-y-4">
                {game.walkthrough.map((step, index) => {
                  const key = `step:${index}`;
                  const checked = isChecked(key);

                  return (
                    <li
                      key={step.title}
                      id={`paso-${index}`}
                      tabIndex={-1}
                      aria-current={
                        index === nextStepIndex ? 'step' : undefined
                      }
                      className={`scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm outline-none transition ${
                        checked
                          ? 'border-green-200'
                          : index === nextStepIndex
                            ? 'border-red-300 ring-2 ring-red-100'
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-black ${
                            checked
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-900 text-white'
                          }`}
                        >
                          {checked ? '✓' : index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {step.title}
                              </h3>
                              {!checked && index === nextStepIndex && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-700">
                                  Siguiente
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!checked &&
                                !progressReadOnly &&
                                index === nextStepIndex && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteAndContinue(index)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Hecho y seguir
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleChecklist(key)}
                                aria-pressed={checked}
                                disabled={progressReadOnly}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                                  checked
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {checked ? 'Completado' : 'Marcar paso'}
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{step.goal}</p>
                          <ul className="mt-3 space-y-1.5">
                            {step.tips.map((tip) => (
                              <li key={tip} className="flex gap-2 text-sm text-gray-700">
                                <span className="text-red-500" aria-hidden="true">
                                  ▸
                                </span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>

                          {loaded && (
                            <details
                              open={Boolean(progress.notes?.[key])}
                              className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                            >
                              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-bold text-gray-600">
                                <NotebookPen className="h-3.5 w-3.5 text-amber-600" />
                                {progress.notes?.[key]
                                  ? 'Mi nota de este paso'
                                  : 'Añadir nota personal'}
                              </summary>
                              <textarea
                                defaultValue={progress.notes?.[key] ?? ''}
                                onBlur={(event) =>
                                  setNote(key, event.currentTarget.value)
                                }
                                disabled={progressReadOnly}
                                maxLength={1000}
                                rows={3}
                                placeholder="Ej.: comprar Pociones, guardar antes del legendario, volver por la MO..."
                                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                              />
                              <p className="mt-1 text-[10px] font-semibold text-gray-400">
                                {requiresLogin
                                  ? 'Inicia sesión para guardar tus notas.'
                                  : 'Se guarda en tu cuenta al salir del campo.'}
                              </p>
                            </details>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                        <button
                          type="button"
                          onClick={() => goToStep(index - 1)}
                          disabled={index === 0}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Paso anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => goToStep(index + 1)}
                          disabled={index === game.walkthrough.length - 1}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Siguiente paso
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {activeTab === 'desafios' && (
            <section
              id="panel-desafios"
              role="tabpanel"
              aria-labelledby="tab-desafios"
              className="space-y-5"
            >
              <RegionRouteMap
                gyms={game.gyms}
                steps={game.walkthrough.map((step, index) => ({
                  index,
                  title: step.title,
                  goal: step.goal,
                  done: isChecked(`step:${index}`),
                }))}
                completed={completedGymIndices}
                accent={game.accent}
                region={game.region}
                canEdit={!progressReadOnly}
                nextStepIndex={
                  nextStepIndex >= 0 ? nextStepIndex : undefined
                }
                nextStepTitle={nextStep?.title ?? null}
                onGoToGym={goToGym}
                onGoToStep={goToStep}
                onToggleGym={(index) =>
                  toggleChecklist(`challenge:${index}`)
                }
                onToggleStep={(index) =>
                  toggleChecklist(`step:${index}`)
                }
              />

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-gray-900">
                  {game.challengeLabel}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Orden recomendado y consejos rápidos para cada desafío.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                      style={{
                        width: `${
                          game.gyms.length === 0
                            ? 0
                            : Math.round((gymsDone / game.gyms.length) * 100)
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500">
                    {gymsDone}/{game.gyms.length} completados
                  </span>
                </div>

                <div className="mt-5 border-t border-gray-200 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
                      {badgeCaseTitle}
                    </h3>
                    <span className="text-xs font-bold text-gray-500">
                      {gymsDone}/{game.gyms.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Los visuales se colorean al conseguirlos. Pulsa uno para ir
                    a su combate.
                  </p>

                  <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-8">
                    {game.gyms.map((challenge, index) => {
                      const challengeDone = progress.checklist.includes(
                        `challenge:${index}`
                      );
                      const badgeVisual = getGymBadgeVisual(
                        game.slug,
                        index,
                        challenge
                      );

                      return (
                        <button
                          key={`badge-${challenge.leader}-${index}`}
                          type="button"
                          title={`${challenge.leader} · ${challenge.badge}`}
                          onClick={() => goToGym(index)}
                          aria-label={`${challenge.badge}: ${
                            challengeDone ? 'conseguida' : 'pendiente'
                          }. Ir al combate contra ${challenge.leader}`}
                          className={`group flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition ${
                            challengeDone
                              ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                              : 'border-dashed border-gray-200 bg-gray-50 hover:border-red-200 hover:bg-white'
                          }`}
                        >
                          <GymBadge
                            visual={badgeVisual}
                            obtained={challengeDone}
                            size="md"
                            showLock={!challengeDone}
                          />
                          <span className="w-full text-[10px] font-bold leading-tight text-gray-700">
                            {challenge.leader}
                          </span>
                          <span
                            className={`w-full truncate text-[9px] font-semibold ${
                              challengeDone
                                ? 'text-amber-700'
                                : 'text-gray-400'
                            }`}
                          >
                            {challengeDone
                              ? 'Conseguida'
                              : challenge.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {game.gyms.map((challenge, index) => {
                  const visual = getGymTypeVisual(challenge.type);
                  const hasTrainer = hasTrainerSprite(challenge.leader);
                  const badgeVisual = getGymBadgeVisual(
                    game.slug,
                    index,
                    challenge
                  );
                  const challengeDone = progress.checklist.includes(
                    `challenge:${index}`
                  );
                  const relatedStepIndex = findRelatedStepIndex(
                    game,
                    challenge
                  );
                  const relatedStepDone =
                    relatedStepIndex >= 0 &&
                    isChecked(`step:${relatedStepIndex}`);

                  return (
                  <article
                    key={`${challenge.leader}-${index}`}
                    id={`gym-${index}`}
                    tabIndex={-1}
                    className={`scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm outline-none ${
                      challengeDone ? 'border-amber-200' : 'border-transparent'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <div className="flex min-w-[13rem] flex-1 items-center gap-3">
                        {hasTrainer ? (
                          <TrainerAvatar
                            name={challenge.leader}
                            size="md"
                            className="min-w-14"
                          />
                        ) : (
                          visual && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={visual.artworkUrl}
                              alt={visual.name}
                              loading="lazy"
                              className="h-12 w-12 flex-none object-contain"
                            />
                          )
                        )}
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-900 text-[10px] font-black text-white">
                              {index + 1}
                            </span>
                            <h3
                              className="truncate text-lg font-bold text-gray-900"
                              title={challenge.leader}
                            >
                              {challenge.leader}
                            </h3>
                          </div>
                          <p className="truncate text-xs font-semibold text-gray-500">
                            {challenge.location}
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto flex flex-none items-center gap-1.5">
                        <GymBadge
                          visual={badgeVisual}
                          obtained={challengeDone}
                          size="sm"
                        />
                        <span
                          title={challenge.badge}
                          className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700"
                        >
                          {challenge.badge}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {hasTrainer && visual && (
                        <span
                          className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gray-100"
                          aria-hidden="true"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={visual.artworkUrl}
                            alt=""
                            loading="lazy"
                            className="h-6 w-6 object-contain"
                          />
                        </span>
                      )}
                      <span
                        className={`h-3 w-3 rounded-full ${getTypeColorByLabel(challenge.type)}`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-bold text-gray-700">
                        {challenge.type}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-600">{challenge.tip}</p>

                    {relatedStepIndex >= 0 && (
                      <p className="mt-2 text-[11px] font-semibold text-gray-500">
                        Guía:{' '}
                        <button
                          type="button"
                          onClick={() => goToStep(relatedStepIndex)}
                          className="font-bold text-red-600 hover:underline"
                        >
                          Paso {relatedStepIndex + 1}:{' '}
                          {game.walkthrough[relatedStepIndex].title}
                          {relatedStepDone ? ' ✓' : ''}
                        </button>
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          challengeDone ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {challengeDone ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Conseguida
                          </>
                        ) : (
                          'Pendiente'
                        )}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {!challengeDone &&
                          relatedStepIndex >= 0 &&
                          !relatedStepDone && (
                            <button
                              type="button"
                              onClick={() =>
                                setChecklist(
                                  [
                                    `challenge:${index}`,
                                    `step:${relatedStepIndex}`,
                                  ],
                                  true
                                )
                              }
                              disabled={progressReadOnly}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Insignia + paso
                            </button>
                          )}
                        {challengeDone &&
                          relatedStepIndex >= 0 &&
                          !relatedStepDone && (
                            <button
                              type="button"
                              onClick={() =>
                                setChecklist(
                                  [`step:${relatedStepIndex}`],
                                  true
                                )
                              }
                              disabled={progressReadOnly}
                              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Marcar paso
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() =>
                            toggleChecklist(`challenge:${index}`)
                          }
                          disabled={progressReadOnly}
                          aria-pressed={challengeDone}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                            challengeDone
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {challengeDone
                            ? 'Desmarcar'
                            : 'Marcar insignia'}
                        </button>
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>

              {game.eliteFour.length > 0 && (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-black text-gray-900">
                    {game.eliteFourLabel}
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {game.eliteFour.map((member) => (
                      <div
                        key={member.name}
                        className="rounded-xl bg-gray-50 p-4 text-center"
                      >
                        <TrainerAvatar
                          name={member.name}
                          size="lg"
                          className="mx-auto mb-2"
                        />
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="mt-1 text-sm text-gray-600">{member.type}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 p-4 text-white">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-white/80">
                        Campeón / jefe final
                      </p>
                      <p className="mt-1 text-xl font-black">{game.champion}</p>
                    </div>
                    <TrainerAvatar
                      name={game.champion}
                      size="lg"
                      className="flex-none"
                    />
                  </div>
                </div>
              )}

              {game.eliteFour.length === 0 && (
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-5 text-white">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/80">
                      Jefe final
                    </p>
                    <p className="mt-1 text-xl font-black">{game.champion}</p>
                  </div>
                  <TrainerAvatar
                    name={game.champion}
                    size="lg"
                    className="flex-none"
                  />
                </div>
              )}
            </section>
          )}

          {activeTab === 'equipo' && (
            <section
              id="panel-equipo"
              role="tabpanel"
              aria-labelledby="tab-equipo"
            >
              <GameTeamBuilder
                game={game}
                pokemon={pokemon}
                versionGroup={versionGroup}
              />
            </section>
          )}

          {activeTab === 'pokedex' && (
            <section
              id="panel-pokedex"
              role="tabpanel"
              aria-labelledby="tab-pokedex"
            >
              <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-gray-900">
                  {pokedexLabel}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {pokemon.length} especies del Pokédex regional oficial, incluyendo
                  DLC cuando corresponde.
                </p>
                <p className="mt-2 text-sm text-amber-800">{game.dexNote}</p>
              </div>

              {!loaded && !requiresLogin ? (
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
                  <p className="mt-3 text-sm font-semibold text-gray-500">
                    Cargando tu Pokédex...
                  </p>
                </div>
              ) : pokemon.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
                  <p className="font-bold text-amber-900">
                    No se pudo cargar la Pokédex de este juego.
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    PokeAPI no respondió. Recarga la página en unos minutos; el
                    resto de la guía sigue disponible.
                  </p>
                </div>
              ) : (
                <PokedexChecklist
                  pokemon={pokemon}
                  caught={progress.caught}
                  loaded={loaded}
                  readOnly={progressReadOnly}
                  onToggle={toggleCaught}
                  onSetMany={setCaught}
                />
              )}
            </section>
          )}

          {activeTab === 'consejos' && (
            <section
              id="panel-consejos"
              role="tabpanel"
              aria-labelledby="tab-consejos"
            >
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-gray-900">
                  Consejos para completar {game.shortTitle}
                </h2>
                <ul className="mt-4 space-y-3">
                  {game.tips.map((tip, index) => (
                    <li key={tip} className="flex gap-3 rounded-xl bg-gray-50 p-3">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-red-600 text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <h2 className="font-bold text-blue-900">Sobre el progreso</h2>
                <p className="mt-1 text-sm text-blue-900/90">
                  Las marcas, las insignias conseguidas y tus notas se guardan
                  en tu cuenta, así que puedes continuar desde otro dispositivo
                  al iniciar sesión.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function getGuideScrollOffset(): number {
  if (typeof window === 'undefined') return 120;

  const headerHeight =
    document.querySelector('header')?.getBoundingClientRect().height ?? 61;
  const tabsHeight =
    document.getElementById('guide-tabs')?.getBoundingClientRect().height ?? 54;

  return Math.ceil(headerHeight + tabsHeight + 12);
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function findRelatedStepIndex(
  game: GameGuide,
  challenge: GameGym
): number {
  const needles = [challenge.location, challenge.leader, challenge.badge]
    .map(normalizeSearchText)
    .filter((value) => value.length >= 4);

  if (needles.length === 0) return -1;

  const matches = new Set<number>();

  game.walkthrough.forEach((step, index) => {
    const haystack = normalizeSearchText(
      `${step.title} ${step.goal} ${step.tips.join(' ')}`
    );

    if (needles.some((needle) => haystack.includes(needle))) {
      matches.add(index);
    }
  });

  return matches.size === 1 ? Array.from(matches)[0] : -1;
}

interface CatchPick {
  entry: PokemonIndexEntry;
  types: string[];
}

function NextChallengePicks({
  challenge,
  picks,
  gameSlug,
}: {
  challenge: GameGym;
  picks: CatchPick[];
  gameSlug: string;
}) {
  if (picks.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        Capturas recomendadas · {challenge.leader} ({challenge.type})
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {picks.map(({ entry, types }) => (
          <Link
            key={entry.id}
            href={`/pokedex/${entry.id}?game=${encodeURIComponent(gameSlug)}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.spriteUrl}
              alt=""
              loading="lazy"
              className="h-6 w-6 object-contain"
            />
            {formatPokemonName(entry.name)}
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {types.map((type) => (
                <span
                  key={type}
                  title={getTypeLabel(type)}
                  className={`h-2 w-2 rounded-full ${
                    TYPE_COLORS[type] ?? 'bg-gray-400'
                  }`}
                />
              ))}
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-gray-400">
        Pokémon del Pokédex de este juego que encajan contra el próximo desafío.
      </p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-black text-gray-900">{value}</p>
    </div>
  );
}
