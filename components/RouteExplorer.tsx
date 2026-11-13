'use client';

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  formatDexNumber,
  formatPokemonName,
} from '@/lib/pokemon';
import type {
  RouteData,
  RouteEncounter,
} from '@/types/route-encounters';
import type { PokemonIndexEntry } from '@/types/pokemon';

interface RouteExplorerProps {
  versionGroup: string;
  gameTitle: string;
  pokemon: PokemonIndexEntry[];
  caught: number[];
  seen: number[];
  readOnly: boolean;
  onToggleCaught: (id: number) => void;
  onToggleSeen: (id: number) => void;
}

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

function matchesQuery(
  entry: PokemonIndexEntry,
  query: string
): boolean {
  if (query === '') return true;
  return (
    entry.name.toLowerCase().includes(query) ||
    formatPokemonName(entry.name).toLowerCase().includes(query) ||
    entry.id.toString().includes(query)
  );
}

function matchesVersion(
  encounter: RouteEncounter,
  version: string
): boolean {
  return version === 'all' || encounter.version === version;
}

function matchesMethod(
  encounter: RouteEncounter,
  method: string
): boolean {
  return method === 'all' || encounter.methods.includes(method);
}

function getEncounterLines(
  encounters: RouteEncounter[],
  versions: Map<string, string>,
  selectedVersion: string
): string[] {
  const showVersion = selectedVersion === 'all';
  return encounters.map((encounter) => {
    const versionName = versions.get(encounter.version) ?? encounter.version;
    const prefix = showVersion ? `${versionName} · ` : '';
    return `${prefix}${encounter.methods.join(', ')} · Nv. ${
      encounter.levels
    } · ${encounter.chance}%`;
  });
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function RouteExplorer({
  versionGroup,
  gameTitle,
  pokemon,
  caught,
  seen,
  readOnly,
  onToggleCaught,
  onToggleSeen,
}: RouteExplorerProps) {
  const [data, setData] = useState<RouteData | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState('all');
  const [method, setMethod] = useState('all');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [shiny, setShiny] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const caughtSet = useMemo(() => new Set(caught), [caught]);
  const seenSet = useMemo(() => new Set(seen), [seen]);
  const pokemonMap = useMemo(
    () => new Map(pokemon.map((entry) => [entry.id, entry])),
    [pokemon]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/encounters/${encodeURIComponent(versionGroup)}.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (response.status === 404) {
          setState('missing');
          return null;
        }
        if (!response.ok) throw new Error('No se pudieron cargar las rutas');
        return response.json() as Promise<RouteData>;
      })
      .then((payload) => {
        if (!payload) return;
        setData(payload);
        setVersion(payload.versions[0]?.id ?? 'all');
        setExpanded(
          new Set(payload.locations[0] ? [payload.locations[0].id] : [])
        );
        setState('ready');
      })
      .catch((error) => {
        if ((error as Error).name === 'AbortError') return;
        setState('error');
      });

    return () => controller.abort();
  }, [versionGroup]);

  const methods = useMemo(() => {
    const values = new Set<string>();
    for (const location of data?.locations ?? []) {
      for (const entry of location.pokemon) {
        for (const encounter of entry.encounters) {
          for (const value of encounter.methods) values.add(value);
        }
      }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'es'));
  }, [data]);

  const versions = useMemo(
    () => new Map((data?.versions ?? []).map((entry) => [entry.id, entry.name])),
    [data]
  );

  const filteredLocations = useMemo(() => {
    if (!data) return [];

    return data.locations
      .map((location) => {
        const entries = location.pokemon
          .map((routeEntry) => {
            const entry = pokemonMap.get(routeEntry.id);
            if (!entry) return null;
            if (!matchesQuery(entry, deferredQuery)) return null;
            if (onlyMissing && caughtSet.has(entry.id)) return null;

            const encounters = routeEntry.encounters.filter(
              (encounter) =>
                matchesVersion(encounter, version) &&
                matchesMethod(encounter, method)
            );
            if (encounters.length === 0) return null;

            return { entry, encounters };
          })
          .filter(
            (
              value
            ): value is {
              entry: PokemonIndexEntry;
              encounters: RouteEncounter[];
            } => value !== null
          );

        return { ...location, entries };
      })
      .filter((location) => location.entries.length > 0);
  }, [
    caughtSet,
    data,
    deferredQuery,
    method,
    onlyMissing,
    pokemonMap,
    version,
  ]);

  const visibleSpecies = useMemo(() => {
    const ids = new Set<number>();
    for (const location of filteredLocations) {
      for (const entry of location.entries) ids.add(entry.entry.id);
    }
    return ids;
  }, [filteredLocations]);

  const caughtVisible = useMemo(() => {
    let total = 0;
    for (const id of visibleSpecies) {
      if (caughtSet.has(id)) total += 1;
    }
    return total;
  }, [caughtSet, visibleSpecies]);

  const toggleLocation = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-10 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-red-500" />
        <span className="ml-2 text-sm font-semibold text-gray-600">
          Cargando rutas de {gameTitle}...
        </span>
      </div>
    );
  }

  if (state === 'missing' || state === 'error') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-black text-amber-900">
          Rutas no disponibles para este juego
        </h2>
        <p className="mt-1 text-sm text-amber-900/90">
          {state === 'missing'
            ? 'PokeAPI todavía no publica encuentros por ruta para este juego. Puedes consultar cada Pokémon en la pestaña Pokédex, sección “Dónde encontrarlo”; para Escarlata/Púrpura, Leyendas: Arceus y Leyendas: Z-A se usa WikiDex como fuente alternativa.'
            : 'No se pudieron cargar las rutas. Recarga la página o consulta la pestaña Pokédex.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              ¿Qué puedo capturar aquí?
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Rutas y especies de {gameTitle}. Marca lo que veas o captures sin
              salir de la guía.
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-black text-gray-900">
              {pluralize(visibleSpecies.size, 'especie', 'especies')}
            </p>
            <p className="text-xs font-semibold text-gray-500">
              {pluralize(caughtVisible, 'capturada', 'capturadas')} ·{' '}
              {pluralize(filteredLocations.length, 'ruta', 'rutas')}
            </p>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-400">
          Solo se listan especies con encuentros salvajes registrados. Los
          iniciales, fósiles, regalos e intercambios pueden no aparecer.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <label htmlFor="route-search" className="sr-only">
              Buscar Pokémon en las rutas
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="route-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o número..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>

          <div>
            <label htmlFor="route-version" className="sr-only">
              Versión
            </label>
            <select
              id="route-version"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="all">Todas las versiones</option>
              {(data?.versions ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="route-method" className="sr-only">
              Método
            </label>
            <select
              id="route-method"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="all">Todos los métodos</option>
              {methods.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={onlyMissing}
              onChange={(event) => setOnlyMissing(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            Solo me faltan
          </label>

          <button
            type="button"
            onClick={() => setShiny((value) => !value)}
            aria-pressed={shiny}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
              shiny
                ? 'bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {shiny ? 'Shinies' : 'Ver shinies'}
          </button>

          <button
            type="button"
            onClick={() =>
              setExpanded(
                new Set(filteredLocations.map((location) => location.id))
              )
            }
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Expandir todo
          </button>
          <button
            type="button"
            onClick={() => setExpanded(new Set())}
            className="text-xs font-bold text-gray-500 hover:text-gray-700"
          >
            Contraer todo
          </button>
        </div>
      </div>

      {filteredLocations.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-gray-600">
            No hay rutas con esos filtros.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filteredLocations.map((location) => {
            const isOpen = expanded.has(location.id);
            const caughtHere = location.entries.filter((entry) =>
              caughtSet.has(entry.entry.id)
            ).length;

            return (
              <section
                key={location.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleLocation(location.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 flex-none text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-none text-gray-400" />
                    )}
                    <MapPin className="h-4 w-4 flex-none text-red-500" />
                    <span className="truncate text-sm font-black text-gray-900">
                      {location.name}
                    </span>
                  </span>
                  <span className="flex flex-none items-center gap-2 text-xs font-bold text-gray-500">
                    <span>
                      {pluralize(location.entries.length, 'especie', 'especies')}{' '}
                      · {pluralize(caughtHere, 'capturada', 'capturadas')}
                    </span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                      <span
                        className="block h-full rounded-full bg-green-500"
                        style={{
                          width: `${
                            location.entries.length === 0
                              ? 0
                              : (caughtHere / location.entries.length) * 100
                          }%`,
                        }}
                      />
                    </span>
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 p-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {location.entries.map(({ entry, encounters }) => {
                        const isCaught = caughtSet.has(entry.id);
                        const isSeen = seenSet.has(entry.id);
                        const lines = getEncounterLines(
                          encounters,
                          versions,
                          version
                        );

                        return (
                          <article
                            key={entry.id}
                            className={`rounded-xl border p-2 text-center transition ${
                              isCaught
                                ? 'border-green-300 bg-green-50'
                                : isSeen
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-gray-200 bg-white'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                shiny
                                  ? entry.shinyArtworkUrl
                                  : entry.artworkUrl
                              }
                              alt={`${formatPokemonName(entry.name)}${
                                shiny ? ' shiny' : ''
                              }`}
                              loading="lazy"
                              onError={(event) => {
                                const image = event.currentTarget;
                                image.onerror = null;
                                image.src = entry.artworkUrl;
                              }}
                              className="mx-auto h-16 w-16 object-contain"
                            />
                            <p className="mt-0.5 text-[10px] font-semibold text-gray-500">
                              {formatDexNumber(entry.id)}
                            </p>
                            <p className="truncate text-xs font-black text-gray-900">
                              {formatPokemonName(entry.name)}
                            </p>

                            <div className="mt-1 space-y-0.5">
                              {lines.slice(0, 2).map((line) => (
                                <p
                                  key={line}
                                  className="text-[9px] leading-tight text-gray-500"
                                >
                                  {line}
                                </p>
                              ))}
                              {lines.length > 2 && (
                                <p className="text-[9px] font-semibold text-gray-400">
                                  +{lines.length - 2} versiones
                                </p>
                              )}
                            </div>

                            <div className="mt-1.5 grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() => onToggleSeen(entry.id)}
                                disabled={readOnly || isCaught}
                                aria-pressed={isSeen}
                                title={
                                  isCaught
                                    ? 'Un Pokémon capturado ya cuenta como visto'
                                    : isSeen
                                      ? 'Quitar de vistos'
                                      : 'Marcar como visto'
                                }
                                className={`inline-flex items-center justify-center gap-0.5 rounded-md px-1 py-1 text-[9px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isSeen
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                                }`}
                              >
                                <Eye className="h-3 w-3" />
                                Visto
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleCaught(entry.id)}
                                disabled={readOnly}
                                aria-pressed={isCaught}
                                className={`inline-flex items-center justify-center gap-0.5 rounded-md px-1 py-1 text-[9px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isCaught
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                                }`}
                              >
                                <Check className="h-3 w-3" />
                                {isCaught ? 'Capturado' : 'Capturar'}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <strong>¿Buscas el shiny?</strong> Estas rutas sirven para cazar la
        versión shiny. La probabilidad depende del juego, del método y de los
        encuentros fijos o legendarios bloqueados.
      </p>
    </div>
  );
}
