'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Swords,
  Trash2,
  Users,
} from 'lucide-react';
import { useAccount, useGameTeam } from '@/components/AccountProvider';
import {
  TYPE_COLORS,
  formatPokemonName,
  getTypeLabel,
} from '@/lib/pokemon';
import { getTeamSuggestions } from '@/lib/team-suggestions';
import { usePokemonFilters } from '@/lib/usePokemonFilters';
import {
  TYPE_CHART,
  getOffensiveCoverage,
  getTeamWeaknesses,
  getTypeName,
  isPokemonType,
} from '@/lib/type-chart';
import type { GameGuide } from '@/types/game';
import type { PokemonBasic, PokemonIndexEntry } from '@/types/pokemon';
import type {
  LearnedMove,
  PokemonMoveSet,
} from '@/services/pokemonMoves';

interface GameTeamBuilderProps {
  game: GameGuide;
  pokemon: PokemonIndexEntry[];
  versionGroup: string | null;
}

type MoveState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: PokemonMoveSet };

interface DexEntryWithTypes extends PokemonIndexEntry {
  types: string[];
}

const TYPE_ICONS: Record<string, string> = {
  physical: 'Físico',
  special: 'Especial',
  status: 'Estado',
};

export default function GameTeamBuilder({
  game,
  pokemon,
  versionGroup,
}: GameTeamBuilderProps) {
  const { authLoading, user } = useAccount();
  const teamState = useGameTeam(game.slug);
  const { data: filterData, loading: filtersLoading } =
    usePokemonFilters(true);

  const [query, setQuery] = useState('');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedMoves, setExpandedMoves] = useState<number | null>(null);
  const [movesById, setMovesById] = useState<Record<number, MoveState>>({});

  const filterMap = useMemo(
    () => new Map((filterData ?? []).map((entry) => [entry.id, entry])),
    [filterData]
  );

  const dexPool = useMemo<DexEntryWithTypes[]>(() => {
    return pokemon
      .map((entry) => ({
        ...entry,
        types: filterMap.get(entry.id)?.types ?? [],
      }))
      .filter((entry) => entry.types.length > 0);
  }, [pokemon, filterMap]);

  const team = teamState.team;
  const teamIds = useMemo(() => team.map((entry) => entry.id), [team]);
  const teamTypes = useMemo(() => team.map((entry) => entry.types), [team]);

  const weaknesses = getTeamWeaknesses(teamTypes);
  const coverage = getOffensiveCoverage(teamTypes);

  const suggestions = useMemo(() => {
    return getTeamSuggestions(teamTypes, dexPool, teamIds, 8);
  }, [teamTypes, dexPool, teamIds]);

  const threats = useMemo(() => {
    if (team.length === 0) return [];
    const teamSet = new Set(teamIds);

    return dexPool
      .filter((candidate) => !teamSet.has(candidate.id))
      .map((candidate) => {
        let threatened = 0;

        for (const member of team) {
          const memberTypes = member.types.filter(isPokemonType);
          const isThreat = candidate.types.some(
            (candidateType) =>
              isPokemonType(candidateType) &&
              memberTypes.some(
                (memberType) => (TYPE_CHART[candidateType][memberType] ?? 1) > 1
              )
          );
          if (isThreat) threatened += 1;
        }

        return { ...candidate, threatened };
      })
      .filter((candidate) => candidate.threatened > 0)
      .sort((a, b) => b.threatened - a.threatened || a.id - b.id)
      .slice(0, 8);
  }, [dexPool, team, teamIds]);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];

    return pokemon
      .filter(
        (entry) =>
          entry.name.toLowerCase().includes(normalized) ||
          entry.id.toString().includes(normalized)
      )
      .slice(0, 12);
  }, [pokemon, query]);

  const addPokemon = async (entry: PokemonIndexEntry) => {
    if (teamState.isFull) {
      setMessage('El equipo ya tiene 6 Pokémon.');
      return;
    }
    if (teamState.has(entry.id)) {
      setMessage('Ese Pokémon ya está en el equipo.');
      return;
    }

    setAddingId(entry.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/pokemon/${entry.id}`);
      if (!response.ok) throw new Error('No se pudo cargar el Pokémon');
      const data = (await response.json()) as PokemonBasic;
      const result = teamState.add(data);

      if (result === 'added') {
        setMessage(`${formatPokemonName(entry.name)} añadido al equipo.`);
        setQuery('');
      } else if (result === 'full') {
        setMessage('El equipo ya tiene 6 Pokémon.');
      } else if (result === 'duplicate') {
        setMessage('Ese Pokémon ya está en el equipo.');
      }
    } catch {
      setMessage('No se pudo añadir el Pokémon. Inténtalo de nuevo.');
    } finally {
      setAddingId(null);
    }
  };

  const loadMoves = async (member: PokemonBasic) => {
    if (!versionGroup) {
      setMovesById((current) => ({
        ...current,
        [member.id]: { status: 'error' },
      }));
      return;
    }

    const existing = movesById[member.id];
    if (existing) return;

    setMovesById((current) => ({
      ...current,
      [member.id]: { status: 'loading' },
    }));

    try {
      const response = await fetch(
        `/api/pokemon/${member.id}/moves?versionGroup=${encodeURIComponent(
          versionGroup
        )}`
      );
      if (!response.ok) throw new Error('No se pudieron cargar los movimientos');
      const data = (await response.json()) as PokemonMoveSet;
      setMovesById((current) => ({
        ...current,
        [member.id]: { status: 'ready', data },
      }));
    } catch {
      setMovesById((current) => ({
        ...current,
        [member.id]: { status: 'error' },
      }));
    }
  };

  const toggleMoves = (member: PokemonBasic) => {
    if (expandedMoves === member.id) {
      setExpandedMoves(null);
      return;
    }
    setExpandedMoves(member.id);
    void loadMoves(member);
  };

  if (authLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-gray-50" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <Users className="mx-auto h-12 w-12 text-red-600" />
        <h2 className="mt-3 text-2xl font-black text-gray-900">
          Crea tu equipo de {game.shortTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
          Inicia sesión para guardar un equipo distinto por juego, analizar sus
          debilidades y consultar los movimientos que puede aprender.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href={`/login?next=${encodeURIComponent(`/guias/${game.slug}`)}`}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Iniciar sesión
          </Link>
          <Link
            href={`/pokedex/3d`}
            className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
          >
            Ver galería 3D
          </Link>
        </div>
      </div>
    );
  }

  const expandedMember = team.find((member) => member.id === expandedMoves) ?? null;
  const expandedMovesState = expandedMoves
    ? movesById[expandedMoves]
    : undefined;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-red-600">
              Equipo por juego
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">
              Mi equipo de {game.shortTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {team.length}/6 Pokémon · {coverage.length} tipos ofensivos ·{' '}
              {weaknesses.length} debilidades compartidas
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/pokedex"
              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
            >
              Ver Pokédex
            </Link>
            <Link
              href="/equipo"
              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
            >
              Team Builder global
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor={`game-team-search-${game.slug}`} className="sr-only">
            Buscar Pokémon para añadir al equipo
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id={`game-team-search-${game.slug}`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar Pokémon del juego por nombre o número..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          {query.trim().length >= 2 && (
            <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {searchResults.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-500">
                  No hay Pokémon de este juego con ese nombre.
                </p>
              ) : (
                searchResults.map((entry) => {
                  const alreadyInTeam = teamState.has(entry.id);
                  const disabled =
                    alreadyInTeam ||
                    teamState.isFull ||
                    addingId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.artworkUrl}
                        alt={formatPokemonName(entry.name)}
                        loading="lazy"
                        className="h-10 w-10 object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {formatPokemonName(entry.name)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          #{entry.id.toString().padStart(4, '0')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void addPokemon(entry)}
                        disabled={disabled}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {addingId === entry.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : alreadyInTeam ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        {alreadyInTeam ? 'En equipo' : 'Añadir'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
          {message && (
            <p role="status" className="mt-2 text-sm font-semibold text-gray-500">
              {message}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => {
            const member = team[index];

            if (!member) {
              return (
                <div
                  key={`empty-${index}`}
                  className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400"
                >
                  <Plus className="h-7 w-7" />
                  <p className="mt-1 text-xs font-bold">Hueco libre</p>
                  <p className="text-[10px]">Busca arriba para añadir</p>
                </div>
              );
            }

            return (
              <article
                key={member.id}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedIndex !== null) teamState.move(draggedIndex, index);
                  setDraggedIndex(null);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                className={`relative cursor-grab rounded-2xl border border-gray-200 bg-white p-3 text-center shadow-sm transition active:cursor-grabbing ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="absolute left-2 top-2 h-4 w-4 text-gray-300" />
                <button
                  type="button"
                  onClick={() => teamState.remove(member.id)}
                  aria-label={`Quitar a ${formatPokemonName(member.name)}`}
                  className="absolute right-2 top-2 rounded-full bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.spriteUrl}
                  alt={formatPokemonName(member.name)}
                  loading="lazy"
                  className="mx-auto h-20 w-20 object-contain"
                />
                <h3 className="mt-1 text-sm font-black text-gray-900">
                  {formatPokemonName(member.name)}
                </h3>
                <p className="text-[10px] font-semibold text-gray-400">
                  #{member.id.toString().padStart(4, '0')}
                </p>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {member.types.map((type) => (
                    <span
                      key={type}
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-white ${
                        TYPE_COLORS[type] ?? 'bg-gray-400'
                      }`}
                    >
                      {getTypeLabel(type)}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => toggleMoves(member)}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Movimientos
                  {expandedMoves === member.id ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </article>
            );
          })}
        </div>

        {expandedMember && (
          <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-black text-indigo-950">
                Movimientos de {formatPokemonName(expandedMember.name)} en{' '}
                {game.shortTitle}
              </h3>
              <button
                type="button"
                onClick={() => setExpandedMoves(null)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                Cerrar
              </button>
            </div>

            {!versionGroup ? (
              <p className="mt-2 text-sm text-indigo-900">
                Este juego no tiene datos de movimientos compatibles en PokeAPI.
              </p>
            ) : expandedMovesState?.status === 'loading' ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-900">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando movimientos...
              </p>
            ) : expandedMovesState?.status === 'error' ? (
              <p className="mt-2 text-sm text-red-700">
                No se pudieron cargar los movimientos. Inténtalo de nuevo.
              </p>
            ) : expandedMovesState?.status === 'ready' ? (
              <div className="mt-3 space-y-4">
                <p className="text-xs font-semibold text-indigo-900/80">
                  Prioriza movimientos STAB (del mismo tipo que el Pokémon) y
                  lleva al menos un ataque de cobertura para los tipos que no
                  cubre tu equipo.
                </p>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900/70">
                    Por nivel
                  </h4>
                  {expandedMovesState.data.levelUp.length === 0 ? (
                    <p className="mt-1 text-sm text-indigo-900/70">
                      Sin movimientos por nivel registrados.
                    </p>
                  ) : (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {expandedMovesState.data.levelUp.map((move) => (
                        <MoveCard
                          key={`${move.name}-${move.level}`}
                          move={move}
                          pokemonTypes={expandedMember.types}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {expandedMovesState.data.machine.length > 0 && (
                  <MoveChips
                    title={`MT / MO (${expandedMovesState.data.machine.length})`}
                    moves={expandedMovesState.data.machine}
                  />
                )}

                {expandedMovesState.data.tutor.length > 0 && (
                  <MoveChips
                    title={`Tutor (${expandedMovesState.data.tutor.length})`}
                    moves={expandedMovesState.data.tutor}
                  />
                )}

                {expandedMovesState.data.egg.length > 0 && (
                  <MoveChips
                    title={`Huevo (${expandedMovesState.data.egg.length})`}
                    moves={expandedMovesState.data.egg}
                  />
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Debilidades del equipo
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Tipos que golpean fuerte a varios miembros del equipo.
          </p>
          {weaknesses.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              Sin debilidades compartidas por ahora.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {weaknesses.map((weakness) => (
                <span
                  key={weakness.type}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white ${
                    TYPE_COLORS[weakness.type] ?? 'bg-gray-400'
                  }`}
                >
                  {getTypeName(weakness.type)}
                  <span className="rounded-full bg-black/25 px-1.5 text-[10px]">
                    x{weakness.count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
            <Swords className="h-5 w-5 text-red-600" />
            Cobertura ofensiva
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Tipos de ataque disponibles en el equipo.
          </p>
          {coverage.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">
              Añade Pokémon para ver la cobertura.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {coverage.map((type) => (
                <span
                  key={type}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold text-white ${
                    TYPE_COLORS[type] ?? 'bg-gray-400'
                  }`}
                >
                  {getTypeName(type)}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          ¿Contra qué Pokémon es débil tu equipo?
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Amenazas de {game.shortTitle} que tienen ventaja de tipo contra tu
          equipo.
        </p>
        {filtersLoading ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analizando tipos del juego...
          </p>
        ) : threats.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">
            Añade Pokémon al equipo para ver amenazas concretas.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {threats.map((threat) => (
              <Link
                key={threat.id}
                href={`/pokedex/${threat.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2 transition hover:border-red-200 hover:bg-red-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={threat.artworkUrl}
                  alt={formatPokemonName(threat.name)}
                  loading="lazy"
                  className="h-12 w-12 object-contain"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-gray-900">
                    {formatPokemonName(threat.name)}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {threat.types.map((type) => (
                      <span
                        key={type}
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${
                          TYPE_COLORS[type] ?? 'bg-gray-400'
                        }`}
                      >
                        {getTypeLabel(type)}
                      </span>
                    ))}
                  </div>
                  <p className="mt-0.5 text-[10px] font-bold text-red-600">
                    Amenaza a {threat.threatened} miembro
                    {threat.threatened === 1 ? '' : 's'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black text-gray-900">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Sugerencias para mejorar el equipo
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Pokémon de este juego que resisten las debilidades de tu equipo.
        </p>
        {filtersLoading ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando datos del Pokédex...
          </p>
        ) : suggestions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">
            No hay sugerencias disponibles o el equipo está equilibrado.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((candidate) => {
              const alreadyInTeam = teamState.has(candidate.id);
              const disabled =
                alreadyInTeam || teamState.isFull || addingId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={candidate.artworkUrl}
                    alt={formatPokemonName(candidate.name)}
                    loading="lazy"
                    className="h-12 w-12 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-gray-900">
                      {formatPokemonName(candidate.name)}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {candidate.types.map((type) => (
                        <span
                          key={type}
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${
                            TYPE_COLORS[type] ?? 'bg-gray-400'
                          }`}
                        >
                          {getTypeLabel(type)}
                        </span>
                      ))}
                    </div>
                    <p className="mt-0.5 text-[10px] font-bold text-purple-700">
                      Cubre {candidate.score} debilidad
                      {candidate.score === 1 ? '' : 'es'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void addPokemon(candidate)}
                    disabled={disabled}
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {addingId === candidate.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : alreadyInTeam ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function MoveCard({
  move,
  pokemonTypes,
}: {
  move: LearnedMove;
  pokemonTypes: string[];
}) {
  const isStab = move.type ? pokemonTypes.includes(move.type) : false;

  return (
    <div className="rounded-lg border border-indigo-100 bg-white p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-gray-900">
          {move.level ? `Nv. ${move.level} ` : ''}
          {formatPokemonName(move.name)}
        </span>
        {isStab && (
          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
            STAB
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {move.type && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase text-white ${
              TYPE_COLORS[move.type] ?? 'bg-gray-400'
            }`}
          >
            {getTypeLabel(move.type)}
          </span>
        )}
        {move.damageClass && (
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600">
            {TYPE_ICONS[move.damageClass] ?? move.damageClass}
          </span>
        )}
        {move.power !== null && (
          <span className="text-[9px] font-semibold text-gray-500">
            Poder {move.power}
          </span>
        )}
        {move.accuracy !== null && (
          <span className="text-[9px] font-semibold text-gray-500">
            Prec. {move.accuracy}
          </span>
        )}
      </div>
    </div>
  );
}

function MoveChips({
  title,
  moves,
}: {
  title: string;
  moves: LearnedMove[];
}) {
  return (
    <div>
      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900/70">
        {title}
      </h4>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {moves.slice(0, 40).map((move) => (
          <span
            key={move.name}
            className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-900 shadow-sm"
          >
            {formatPokemonName(move.name)}
          </span>
        ))}
        {moves.length > 40 && (
          <span className="text-[10px] font-semibold text-indigo-700">
            +{moves.length - 40} más
          </span>
        )}
      </div>
    </div>
  );
}
