'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import PokedexChecklist from './PokedexChecklist';
import RegionRouteMap from './RegionRouteMap';
import { useAccount } from '@/components/AccountProvider';
import { getGymTypeVisual } from '@/lib/gym-visuals';
import { useGameProgress } from '@/lib/progress';
import { getTypeColorByLabel } from '@/lib/pokemon';
import type { GameGuide } from '@/types/game';
import type { PokemonIndexEntry } from '@/types/pokemon';

interface GameGuideViewProps {
  game: GameGuide;
  pokemon: PokemonIndexEntry[];
  pokedexLabel: string;
}

type TabId = 'resumen' | 'pasos' | 'desafios' | 'pokedex' | 'consejos';

export default function GameGuideView({
  game,
  pokemon,
  pokedexLabel,
}: GameGuideViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const { syncError } = useAccount();
  const {
    progress,
    loaded,
    requiresLogin,
    toggleCaught,
    setCaught,
    toggleChecklist,
    reset,
    isChecked,
  } = useGameProgress(game.slug);

  const hasPokedex = (game.pokedexMode ?? 'regional') !== 'none';
  const loginHref = `/login?next=${encodeURIComponent(`/guias/${game.slug}`)}`;
  const progressReadOnly = requiresLogin || !loaded;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'pokedex:last-guide',
        JSON.stringify({
          slug: game.slug,
          title: game.title,
          region: game.region,
          accent: game.accent,
          checklistTotal: game.completionChecklist.length,
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
  ]);

  const checklistDone = game.completionChecklist.filter((item) =>
    progress.checklist.includes(item)
  ).length;
  const stepsDone = game.walkthrough.filter((_, index) =>
    progress.checklist.includes(`step:${index}`)
  ).length;
  const dexDone = pokemon.filter((entry) => progress.caught.includes(entry.id)).length;

  const totalTracked =
    game.completionChecklist.length + game.walkthrough.length + pokemon.length;
  const doneTracked = checklistDone + stepsDone + dexDone;
  const overall = totalTracked === 0 ? 0 : Math.round((doneTracked / totalTracked) * 100);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'pasos', label: 'Paso a paso' },
    { id: 'desafios', label: game.challengeLabel },
    ...(hasPokedex
      ? [{ id: 'pokedex' as const, label: 'Pokédex' }]
      : []),
    { id: 'consejos', label: 'Consejos' },
  ];

  const handleReset = () => {
    const confirmed = window.confirm(
      '¿Reiniciar todo el progreso de esta guía? Esta acción no se puede deshacer.'
    );
    if (confirmed) reset();
  };

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
              Progreso total
            </p>
            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-black text-gray-900">{loaded ? `${overall}%` : '—'}</p>
              <p className="text-xs text-gray-500">
                {doneTracked}/{totalTracked}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                style={{ width: `${overall}%` }}
              />
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

        <div className="sticky top-16 z-20 mt-5 -mx-4 border-y border-gray-200 bg-white/95 px-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto py-2" role="tablist" aria-label="Secciones de la guía">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleReset}
              className="ml-auto whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Reiniciar progreso
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
                <h2 className="text-xl font-black text-gray-900">Ruta paso a paso</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Marca cada paso cuando lo completes. Tu progreso se guarda en
                  este navegador.
                </p>
              </div>

              <ol className="space-y-4">
                {game.walkthrough.map((step, index) => {
                  const key = `step:${index}`;
                  const checked = isChecked(key);

                  return (
                    <li
                      key={step.title}
                      className={`rounded-2xl border bg-white p-5 shadow-sm ${
                        checked ? 'border-green-200' : 'border-gray-200'
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
                            <h3 className="text-lg font-bold text-gray-900">
                              {step.title}
                            </h3>
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
                        </div>
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
                locations={game.gyms.map((challenge) => challenge.location)}
                accent={game.accent}
                region={game.region}
              />

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-gray-900">
                  {game.challengeLabel}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Orden recomendado y consejos rápidos para cada desafío.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {game.gyms.map((challenge, index) => {
                  const visual = getGymTypeVisual(challenge.type);

                  return (
                  <article
                    key={`${challenge.leader}-${index}`}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {visual && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={visual.artworkUrl}
                            alt={visual.name}
                            loading="lazy"
                            className="h-12 w-12 flex-none object-contain"
                          />
                        )}
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gray-900 text-sm font-black text-white">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {challenge.leader}
                          </h3>
                          <p className="text-xs font-semibold text-gray-500">
                            {challenge.location}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                        <Award className="h-3 w-3" />
                        {challenge.badge}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${getTypeColorByLabel(challenge.type)}`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-bold text-gray-700">
                        {challenge.type}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-600">{challenge.tip}</p>
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
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="mt-1 text-sm text-gray-600">{member.type}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 p-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/80">
                      Campeón / jefe final
                    </p>
                    <p className="mt-1 text-xl font-black">{game.champion}</p>
                  </div>
                </div>
              )}

              {game.eliteFour.length === 0 && (
                <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/80">
                    Jefe final
                  </p>
                  <p className="mt-1 text-xl font-black">{game.champion}</p>
                </div>
              )}
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
                  Las marcas se guardan en el almacenamiento local de este
                  navegador. Si cambias de dispositivo o borras los datos del
                  sitio, el progreso se perderá. En una próxima versión se podrá
                  sincronizar con una cuenta.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
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
