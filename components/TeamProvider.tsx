'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PokemonBasic } from '@/types/pokemon';

const STORAGE_KEY = 'pokedex:team';
const MAX_TEAM_SIZE = 6;

interface TeamContextValue {
  team: PokemonBasic[];
  maxSize: number;
  hydrated: boolean;
  isFull: boolean;
  has: (id: number) => boolean;
  add: (pokemon: PokemonBasic) => 'added' | 'duplicate' | 'full';
  remove: (id: number) => void;
  clear: () => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

function isPokemonBasic(value: unknown): value is PokemonBasic {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PokemonBasic>;

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.name === 'string' &&
    typeof candidate.spriteUrl === 'string' &&
    Array.isArray(candidate.types) &&
    Array.isArray(candidate.stats)
  );
}

function readTeam(): PokemonBasic[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isPokemonBasic).slice(0, MAX_TEAM_SIZE);
  } catch {
    return [];
  }
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<PokemonBasic[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hidratamos desde localStorage después del primer render para evitar
    // desajustes de hidratación entre servidor y cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTeam(readTeam());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } catch {
      // localStorage puede no estar disponible.
    }
  }, [team, hydrated]);

  const has = useCallback(
    (id: number) => team.some((pokemon) => pokemon.id === id),
    [team]
  );

  const add = useCallback((pokemon: PokemonBasic) => {
    let result: 'added' | 'duplicate' | 'full' = 'added';

    setTeam((current) => {
      if (current.some((entry) => entry.id === pokemon.id)) {
        result = 'duplicate';
        return current;
      }
      if (current.length >= MAX_TEAM_SIZE) {
        result = 'full';
        return current;
      }
      return [...current, pokemon];
    });

    return result;
  }, []);

  const remove = useCallback((id: number) => {
    setTeam((current) => current.filter((pokemon) => pokemon.id !== id));
  }, []);

  const clear = useCallback(() => setTeam([]), []);

  const value = useMemo<TeamContextValue>(
    () => ({
      team,
      maxSize: MAX_TEAM_SIZE,
      hydrated,
      isFull: team.length >= MAX_TEAM_SIZE,
      has,
      add,
      remove,
      clear,
    }),
    [team, hydrated, has, add, remove, clear]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextValue {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam debe usarse dentro de <TeamProvider>');
  }
  return context;
}
