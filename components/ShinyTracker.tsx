'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Loader2,
  Minus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { useAccount } from '@/components/AccountProvider';
import {
  SHINY_METHOD_OPTIONS,
  formatShinyProbability,
  getShinyMethodLabel,
  getShinyOdds,
  getShinyProbability,
} from '@/lib/shiny';
import {
  formatDexNumber,
  formatPokemonName,
} from '@/lib/pokemon';
import type { ShinyHunt, ShinyMethod } from '@/types/shiny';

interface GameOption {
  slug: string;
  title: string;
  generation: number;
}

interface SearchPokemon {
  id: number;
  name: string;
  artworkUrl: string;
  shinyArtworkUrl: string;
}

interface ShinyTrackerProps {
  games: GameOption[];
}

function getArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function getShinyArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
}

function createHuntId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `hunt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ShinyTracker({ games }: ShinyTrackerProps) {
  const {
    user,
    authLoading,
    dataLoading,
    saving,
    shinyHunts,
    saveShinyHunts,
  } = useAccount();

  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchPokemon[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPokemon, setSelectedPokemon] =
    useState<SearchPokemon | null>(null);
  const [selectedGame, setSelectedGame] = useState(games[0]?.slug ?? '');
  const [method, setMethod] = useState<ShinyMethod>('random');
  const [hasShinyCharm, setHasShinyCharm] = useState(false);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!showForm || trimmed.length < 1 || selectedPokemon) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error('Búsqueda no disponible');
          return response.json() as Promise<{ pokemon?: SearchPokemon[] }>;
        })
        .then((data) => setResults((data.pokemon ?? []).slice(0, 6)))
        .catch((error) => {
          if ((error as Error).name !== 'AbortError') setResults([]);
        })
        .finally(() => setSearchLoading(false));
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, selectedPokemon, showForm]);

  const gameMap = useMemo(
    () => new Map(games.map((game) => [game.slug, game])),
    [games]
  );
  const prefilled = useRef(false);

  useEffect(() => {
    if (!user || prefilled.current) return;
    const params = new URLSearchParams(window.location.search);
    const rawId = params.get('pokemon');
    if (!rawId || !/^\d+$/.test(rawId)) return;

    const gameSlug = params.get('game');
    const nextGame = gameSlug && gameMap.has(gameSlug) ? gameSlug : null;

    prefilled.current = true;
    fetch(`/api/pokemon/${rawId}`)
      .then((response) => {
        if (!response.ok) throw new Error('Pokémon no encontrado');
        return response.json() as Promise<{
          id: number;
          name: string;
          artworkUrl: string;
          shinyArtworkUrl: string;
        }>;
      })
      .then((pokemon) => {
        setSelectedPokemon(pokemon);
        setQuery(formatPokemonName(pokemon.name));
        if (nextGame) setSelectedGame(nextGame);
        setShowForm(true);
      })
      .catch(() => {
        prefilled.current = false;
      });
  }, [gameMap, user]);

  const completed = shinyHunts.filter((hunt) => hunt.completedAt !== null).length;
  const totalEncounters = shinyHunts.reduce(
    (total, hunt) => total + hunt.encounters,
    0
  );

  const updateHunt = (id: string, patch: Partial<ShinyHunt>) => {
    saveShinyHunts(
      shinyHunts.map((hunt) => (hunt.id === id ? { ...hunt, ...patch } : hunt))
    );
  };

  const handleAdd = () => {
    if (!selectedPokemon) {
      setFormError('Elige un Pokémon de la lista.');
      return;
    }
    const game = gameMap.get(selectedGame);
    if (!game) {
      setFormError('Elige un juego.');
      return;
    }

    const hunt: ShinyHunt = {
      id: createHuntId(),
      pokemonId: selectedPokemon.id,
      pokemonName: selectedPokemon.name,
      gameSlug: game.slug,
      gameTitle: game.title,
      method,
      encounters: 0,
      hasShinyCharm,
      notes: notes.trim().slice(0, 1000),
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    saveShinyHunts([hunt, ...shinyHunts]);
    setShowForm(false);
    setQuery('');
    setResults([]);
    setSelectedPokemon(null);
    setNotes('');
    setFormError(null);
    setMethod('random');
    setHasShinyCharm(false);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4 py-12">
        <div className="w-full rounded-2xl bg-white p-8 text-center shadow-xl">
          <Sparkles className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-black text-gray-900">
            Shiny Tracker
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión para guardar tus cacerías, contadores y probabilidades.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login?next=/shiny"
              className="rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/pokedex"
              className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
            >
              Explorar Pokédex
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-600">
              <Sparkles className="h-3.5 w-3.5" /> Shiny Tracker
            </p>
            <h1 className="mt-1 text-4xl font-black text-gray-900">
              Mis cacerías shiny
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {shinyHunts.length}{' '}
              {shinyHunts.length === 1 ? 'cacería' : 'cacerías'} · {completed}{' '}
              {completed === 1 ? 'completada' : 'completadas'} ·{' '}
              {totalEncounters.toLocaleString('es-ES')} encuentros registrados
              {saving ? ' · Guardando…' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setFormError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-amber-950 transition hover:bg-amber-400"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cerrar' : 'Nueva cacería'}
          </button>
        </div>

        {showForm && (
          <section className="mt-6 rounded-2xl bg-white p-5 shadow-md">
            <h2 className="text-lg font-black text-gray-900">
              Nueva cacería
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="relative">
                <label
                  htmlFor="shiny-pokemon"
                  className="mb-1 block text-xs font-bold text-gray-600"
                >
                  Pokémon
                </label>
                <Search className="pointer-events-none absolute left-3 top-[2.4rem] h-4 w-4 text-gray-400" />
                <input
                  id="shiny-pokemon"
                  type="search"
                  value={
                    selectedPokemon
                      ? formatPokemonName(selectedPokemon.name)
                      : query
                  }
                  onChange={(event) => {
                    setSelectedPokemon(null);
                    setQuery(event.target.value);
                    setFormError(null);
                  }}
                  placeholder="Buscar por nombre o número..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />

                {!selectedPokemon && query.trim() && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    {searchLoading ? (
                      <p className="flex items-center gap-2 px-3 py-3 text-xs font-semibold text-gray-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Buscando...
                      </p>
                    ) : results.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-gray-500">
                        Sin coincidencias.
                      </p>
                    ) : (
                      results.map((pokemon) => (
                        <button
                          key={pokemon.id}
                          type="button"
                          onClick={() => {
                            setSelectedPokemon(pokemon);
                            setResults([]);
                          }}
                          className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-amber-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pokemon.artworkUrl}
                            alt={formatPokemonName(pokemon.name)}
                            className="h-9 w-9 object-contain"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-gray-900">
                              {formatPokemonName(pokemon.name)}
                            </span>
                            <span className="block text-[10px] text-gray-500">
                              {formatDexNumber(pokemon.id)}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="shiny-game"
                  className="mb-1 block text-xs font-bold text-gray-600"
                >
                  Juego
                </label>
                <select
                  id="shiny-game"
                  value={selectedGame}
                  onChange={(event) => setSelectedGame(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  {games.map((game) => (
                    <option key={game.slug} value={game.slug}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="shiny-method"
                  className="mb-1 block text-xs font-bold text-gray-600"
                >
                  Método
                </label>
                <select
                  id="shiny-method"
                  value={method}
                  onChange={(event) =>
                    setMethod(event.target.value as ShinyMethod)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  {SHINY_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 pb-2.5 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={hasShinyCharm}
                    onChange={(event) =>
                      setHasShinyCharm(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  Tengo Amuleto Shiny
                </label>
              </div>
            </div>

            <div className="mt-3">
              <label
                htmlFor="shiny-notes"
                className="mb-1 block text-xs font-bold text-gray-600"
              >
                Notas (opcional)
              </label>
              <textarea
                id="shiny-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Ruta, hora del día, clima, número de reinicios..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>

            {formError && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {formError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-400">
                {SHINY_METHOD_OPTIONS.find((option) => option.value === method)
                  ?.description ?? ''}
              </p>
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-amber-950 transition hover:bg-amber-400"
              >
                Empezar cacería
              </button>
            </div>
          </section>
        )}

        {shinyHunts.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
            <Trophy className="mx-auto h-10 w-10 text-amber-400" />
            <h2 className="mt-3 text-xl font-black text-gray-900">
              Todavía no hay cacerías
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Crea una cacería para llevar el contador y ver la probabilidad
              acumulada.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {shinyHunts.map((hunt) => {
              const game = gameMap.get(hunt.gameSlug);
              const odds = getShinyOdds(
                hunt.method,
                game?.generation ?? 9,
                hunt.hasShinyCharm
              );
              const probability = getShinyProbability(
                hunt.encounters,
                odds.denominator
              );

              return (
                <article
                  key={hunt.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${
                    hunt.completedAt
                      ? 'border-green-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getShinyArtworkUrl(hunt.pokemonId)}
                      alt={`${formatPokemonName(hunt.pokemonName)} shiny`}
                      loading="lazy"
                      onError={(event) => {
                        const image = event.currentTarget;
                        image.onerror = null;
                        image.src = getArtworkUrl(hunt.pokemonId);
                      }}
                      className="h-16 w-16 flex-none object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500">
                            {formatDexNumber(hunt.pokemonId)}
                          </p>
                          <h2 className="truncate text-lg font-black text-gray-900">
                            {formatPokemonName(hunt.pokemonName)}
                          </h2>
                          <p className="text-xs font-semibold text-gray-500">
                            {hunt.gameTitle} · {getShinyMethodLabel(hunt.method)}
                            {hunt.hasShinyCharm ? ' · Amuleto Shiny' : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateHunt(hunt.id, { completedAt: hunt.completedAt ? null : new Date().toISOString() })
                          }
                          title={
                            hunt.completedAt
                              ? 'Reabrir cacería'
                              : 'Marcar como completada'
                          }
                          className={`rounded-full p-2 transition ${
                            hunt.completedAt
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-700'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateHunt(hunt.id, {
                            encounters: Math.max(0, hunt.encounters - 1),
                          })
                        }
                        disabled={hunt.encounters === 0}
                        className="rounded-lg bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Restar un encuentro"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <p className="min-w-[5.5rem] text-center text-2xl font-black tabular-nums text-gray-900">
                        {hunt.encounters.toLocaleString('es-ES')}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          updateHunt(hunt.id, {
                            encounters: hunt.encounters + 1,
                          })
                        }
                        className="rounded-lg bg-amber-500 p-2 text-amber-950 transition hover:bg-amber-400"
                        aria-label="Sumar un encuentro"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateHunt(hunt.id, {
                            encounters: hunt.encounters + 10,
                          })
                        }
                        className="rounded-lg bg-gray-100 px-2 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-200"
                      >
                        +10
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        saveShinyHunts(
                          shinyHunts.filter((entry) => entry.id !== hunt.id)
                        );
                      }}
                      aria-label={`Eliminar cacería de ${formatPokemonName(
                        hunt.pokemonName
                      )}`}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                      <span>
                        1/{odds.denominator.toLocaleString('es-ES')}
                      </span>
                      <span className="font-black text-amber-600">
                        {formatShinyProbability(probability)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                        style={{
                          width: `${Math.min(100, probability * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {odds.note} Probabilidad acumulada orientativa.
                    </p>
                  </div>

                  <textarea
                    defaultValue={hunt.notes}
                    onBlur={(event) =>
                      updateHunt(hunt.id, {
                        notes: event.target.value.trim().slice(0, 1000),
                      })
                    }
                    rows={2}
                    maxLength={1000}
                    placeholder="Notas de la cacería..."
                    className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
