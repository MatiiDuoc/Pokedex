'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from '@/types/auth';
import type { GameProgress } from '@/types/progress';
import type { PokemonBasic } from '@/types/pokemon';
import { SHINY_HUNTS_SLUG, type ShinyHunt } from '@/types/shiny';

const MAX_TEAM_SIZE = 6;
const CACHE_PREFIX = 'pokedex:cache:';
const PENDING_PREFIX = 'pokedex:pending:';
const SAVE_DEBOUNCE_MS = 500;
const GAME_TEAM_PREFIX = '__team__:';

type PendingSave = GameProgress | PokemonBasic[] | ShinyHunt[];

interface AccountData {
  guides: Record<string, GameProgress>;
  team: PokemonBasic[];
  gameTeams: Record<string, PokemonBasic[]>;
  shinyHunts: ShinyHunt[];
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AccountContextValue {
  user: AuthUser | null;
  authLoading: boolean;
  dataLoading: boolean;
  saving: boolean;
  syncError: string | null;
  registrationOpen: boolean;
  guides: Record<string, GameProgress>;
  team: PokemonBasic[];
  gameTeams: Record<string, PokemonBasic[]>;
  shinyHunts: ShinyHunt[];
  login: (username: string, password: string) => Promise<AuthResult>;
  register: (username: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  saveGuide: (slug: string, data: GameProgress) => void;
  saveTeam: (team: PokemonBasic[]) => void;
  saveGameTeam: (gameSlug: string, team: PokemonBasic[]) => void;
  saveShinyHunts: (hunts: ShinyHunt[]) => void;
  resetAll: () => Promise<AuthResult>;
  refresh: () => Promise<void>;
}

interface TeamContextValue {
  team: PokemonBasic[];
  maxSize: number;
  hydrated: boolean;
  requiresLogin: boolean;
  isFull: boolean;
  has: (id: number) => boolean;
  add: (pokemon: PokemonBasic) => 'added' | 'duplicate' | 'full' | 'auth' | 'loading';
  remove: (id: number) => void;
  move: (from: number, to: number) => void;
  clear: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

function cacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId}`;
}

function readCache(userId: string): AccountData | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AccountData>;
    return {
      guides: parsed.guides && typeof parsed.guides === 'object' ? parsed.guides : {},
      team: Array.isArray(parsed.team) ? parsed.team : [],
      gameTeams:
        parsed.gameTeams && typeof parsed.gameTeams === 'object'
          ? parsed.gameTeams
          : {},
      shinyHunts: Array.isArray(parsed.shinyHunts) ? parsed.shinyHunts : [],
    };
  } catch {
    return null;
  }
}

function writeCache(userId: string, data: AccountData): void {
  try {
    window.localStorage.setItem(cacheKey(userId), JSON.stringify(data));
  } catch {
    // Sin espacio o localStorage bloqueado.
  }
}

function clearCache(userId: string): void {
  try {
    window.localStorage.removeItem(cacheKey(userId));
  } catch {
    // Ignorar.
  }
}

function pendingKey(userId: string): string {
  return `${PENDING_PREFIX}${userId}`;
}

function readPending(userId: string): Record<string, PendingSave> | null {
  try {
    const raw = window.localStorage.getItem(pendingKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const pending: Record<string, PendingSave> = {};

    for (const [slug, value] of Object.entries(parsed)) {
      if (
        slug === '__team__' ||
        slug === SHINY_HUNTS_SLUG ||
        slug.startsWith(GAME_TEAM_PREFIX)
      ) {
        if (Array.isArray(value)) pending[slug] = value as PendingSave;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        pending[slug] = value as GameProgress;
      }
    }

    return Object.keys(pending).length > 0 ? pending : null;
  } catch {
    return null;
  }
}

function writePending(
  userId: string,
  pending: Map<string, PendingSave>
): void {
  try {
    if (pending.size === 0) {
      window.localStorage.removeItem(pendingKey(userId));
      return;
    }

    window.localStorage.setItem(
      pendingKey(userId),
      JSON.stringify(Object.fromEntries(pending))
    );
  } catch {
    // Sin espacio o localStorage bloqueado.
  }
}

function clearPending(userId: string): void {
  try {
    window.localStorage.removeItem(pendingKey(userId));
  } catch {
    // Ignorar.
  }
}

function mergePendingData(
  base: AccountData,
  pending: Record<string, PendingSave>
): AccountData {
  const guides = { ...base.guides };
  let team = base.team;
  let shinyHunts = base.shinyHunts;
  const gameTeams = { ...base.gameTeams };

  for (const [slug, value] of Object.entries(pending)) {
    if (slug === '__team__') {
      team = value as PokemonBasic[];
    } else if (slug === SHINY_HUNTS_SLUG) {
      shinyHunts = value as ShinyHunt[];
    } else if (slug.startsWith(GAME_TEAM_PREFIX)) {
      gameTeams[slug.slice(GAME_TEAM_PREFIX.length)] = value as PokemonBasic[];
    } else {
      guides[slug] = value as GameProgress;
    }
  }

  return { guides, team, gameTeams, shinyHunts };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? 'Ha ocurrido un error.';
  } catch {
    return 'Ha ocurrido un error.';
  }
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [guides, setGuides] = useState<Record<string, GameProgress>>({});
  const [team, setTeam] = useState<PokemonBasic[]>([]);
  const [gameTeams, setGameTeams] = useState<Record<string, PokemonBasic[]>>({});
  const [shinyHunts, setShinyHunts] = useState<ShinyHunt[]>([]);

  const userRef = useRef<AuthUser | null>(null);
  const guidesRef = useRef<Record<string, GameProgress>>({});
  const teamRef = useRef<PokemonBasic[]>([]);
  const gameTeamsRef = useRef<Record<string, PokemonBasic[]>>({});
  const shinyHuntsRef = useRef<ShinyHunt[]>([]);
  const pendingRef = useRef(new Map<string, PendingSave>());
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    guidesRef.current = guides;
  }, [guides]);

  useEffect(() => {
    teamRef.current = team;
  }, [team]);

  useEffect(() => {
    gameTeamsRef.current = gameTeams;
  }, [gameTeams]);

  useEffect(() => {
    shinyHuntsRef.current = shinyHunts;
  }, [shinyHunts]);

  const persist = useCallback(async (slug: string, data: PendingSave) => {
    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, data }),
      });

      if (response.status === 401) {
        setUser(null);
        userRef.current = null;
        setSaving(false);
        setSyncError('Tu sesión ha caducado. Vuelve a iniciar sesión.');
        return false;
      }

      if (!response.ok) {
        setSyncError('No se pudo guardar el progreso. Reintentaremos al volver la conexión.');
        return false;
      }

      setSyncError(null);
      return true;
    } catch {
      setSyncError('Sin conexión. El progreso se guardará cuando vuelvas a estar en línea.');
      return false;
    }
  }, []);

  const flush = useCallback(
    async (slug: string, keepalive = false) => {
      const data = pendingRef.current.get(slug);
      if (!data) return true;

      if (keepalive) {
        try {
          await fetch('/api/account', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, data }),
            keepalive: true,
          });
          pendingRef.current.delete(slug);
          if (userRef.current) {
            if (pendingRef.current.size === 0) {
              clearPending(userRef.current.id);
            } else {
              writePending(userRef.current.id, pendingRef.current);
            }
          }
          if (pendingRef.current.size === 0) setSaving(false);
          return true;
        } catch {
          return false;
        }
      }

      const ok = await persist(slug, data);
      if (ok) pendingRef.current.delete(slug);
      if (userRef.current) {
        if (pendingRef.current.size === 0) {
          clearPending(userRef.current.id);
        } else {
          writePending(userRef.current.id, pendingRef.current);
        }
      }
      if (pendingRef.current.size === 0) setSaving(false);
      return ok;
    },
    [persist]
  );

  const flushAll = useCallback(
    async (keepalive = false) => {
      const slugs = Array.from(pendingRef.current.keys());
      await Promise.all(slugs.map((slug) => flush(slug, keepalive)));
    },
    [flush]
  );

  const scheduleSave = useCallback(
    (slug: string, data: PendingSave) => {
      pendingRef.current.set(slug, data);
      setSaving(true);
      if (userRef.current) {
        writePending(userRef.current.id, pendingRef.current);
      }

      const existing = timersRef.current.get(slug);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        timersRef.current.delete(slug);
        void flush(slug);
      }, SAVE_DEBOUNCE_MS);

      timersRef.current.set(slug, timer);
    },
    [flush]
  );

  const loadAccount = useCallback(async (currentUser: AuthUser) => {
    setDataLoading(true);
    setSaving(false);

    try {
      const response = await fetch('/api/account', { cache: 'no-store' });

      if (response.status === 401) {
        setUser(null);
        userRef.current = null;
        return;
      }

      if (!response.ok) throw new Error('No se pudo cargar la cuenta');

      const data = (await response.json()) as AccountData;
      const loadedGameTeams =
        data.gameTeams && typeof data.gameTeams === 'object'
          ? data.gameTeams
          : {};
      const base: AccountData = {
        guides: data.guides ?? {},
        team: Array.isArray(data.team) ? data.team : [],
        gameTeams: loadedGameTeams,
        shinyHunts: Array.isArray(data.shinyHunts) ? data.shinyHunts : [],
      };
      const pending = readPending(currentUser.id);
      const merged = pending ? mergePendingData(base, pending) : base;

      if (pending) {
        pendingRef.current = new Map(Object.entries(pending));
        setSaving(true);
      }

      setGuides(merged.guides);
      setTeam(merged.team);
      setGameTeams(merged.gameTeams);
      setShinyHunts(merged.shinyHunts);
      writeCache(currentUser.id, merged);
      setSyncError(null);

      if (pending) {
        void flushAll();
      }
    } catch {
      const cached = readCache(currentUser.id);
      if (cached) {
        const pending = readPending(currentUser.id);
        const merged = pending ? mergePendingData(cached, pending) : cached;

        if (pending) {
          pendingRef.current = new Map(Object.entries(pending));
          setSaving(true);
        }

        setGuides(merged.guides);
        setTeam(merged.team);
        setGameTeams(merged.gameTeams);
        setShinyHunts(merged.shinyHunts);
        setSyncError('Modo sin conexión: mostrando la última copia guardada.');
      } else {
        setSyncError('No se pudieron cargar tus datos.');
      }
    } finally {
      setDataLoading(false);
    }
  }, [flushAll]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = (await response.json()) as {
          user: AuthUser | null;
          registrationOpen?: boolean;
        };

        if (cancelled) return;

        setUser(data.user);
        userRef.current = data.user;
        setRegistrationOpen(Boolean(data.registrationOpen));

        if (data.user) {
          await loadAccount(data.user);
        }
      } catch {
        if (!cancelled) setSyncError('No se pudo comprobar la sesión.');
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadAccount]);

  useEffect(() => {
    const handleOnline = () => void flushAll();
    const handlePageHide = () => void flushAll(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') void flushAll(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [flushAll]);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          return { ok: false, error: await readErrorMessage(response) };
        }

        const data = (await response.json()) as { user: AuthUser };
        setUser(data.user);
        userRef.current = data.user;
        await loadAccount(data.user);
        return { ok: true };
      } catch {
        return { ok: false, error: 'No se pudo conectar con el servidor.' };
      }
    },
    [loadAccount]
  );

  const register = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          return { ok: false, error: await readErrorMessage(response) };
        }

        const data = (await response.json()) as { user: AuthUser };
        setUser(data.user);
        userRef.current = data.user;
        setRegistrationOpen(false);
        setGuides({});
        setTeam([]);
        setGameTeams({});
        setShinyHunts([]);
        return { ok: true };
      } catch {
        return { ok: false, error: 'No se pudo conectar con el servidor.' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await flushAll(false);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar: la cookie se borrará igualmente al expirar.
    }

    if (userRef.current) clearCache(userRef.current.id);

    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    pendingRef.current.clear();

    setUser(null);
    userRef.current = null;
    setGuides({});
    setTeam([]);
    setGameTeams({});
    setShinyHunts([]);
    setSaving(false);
    setSyncError(null);
  }, [flushAll]);

  const saveGuide = useCallback(
    (slug: string, data: GameProgress) => {
      if (!userRef.current) return;

      setGuides((current) => {
        const next = { ...current, [slug]: data };
        guidesRef.current = next;
        writeCache(userRef.current!.id, {
          guides: next,
          team: teamRef.current,
          gameTeams: gameTeamsRef.current,
          shinyHunts: shinyHuntsRef.current,
        });
        return next;
      });

      scheduleSave(slug, data);
    },
    [scheduleSave]
  );

  const saveTeam = useCallback(
    (nextTeam: PokemonBasic[]) => {
      if (!userRef.current) return;

      setTeam(nextTeam);
      teamRef.current = nextTeam;

      writeCache(userRef.current.id, {
        guides: guidesRef.current,
        team: nextTeam,
        gameTeams: gameTeamsRef.current,
        shinyHunts: shinyHuntsRef.current,
      });

      scheduleSave('__team__', nextTeam);
    },
    [scheduleSave]
  );

  const saveGameTeam = useCallback(
    (gameSlug: string, nextTeam: PokemonBasic[]) => {
      if (!userRef.current) return;

      setGameTeams((current) => {
        const next = { ...current, [gameSlug]: nextTeam };
        gameTeamsRef.current = next;
        writeCache(userRef.current!.id, {
          guides: guidesRef.current,
          team: teamRef.current,
          gameTeams: next,
          shinyHunts: shinyHuntsRef.current,
        });
        return next;
      });

      scheduleSave(`__team__:${gameSlug}`, nextTeam);
    },
    [scheduleSave]
  );

  const saveShinyHunts = useCallback(
    (nextHunts: ShinyHunt[]) => {
      if (!userRef.current) return;

      setShinyHunts(nextHunts);
      shinyHuntsRef.current = nextHunts;

      writeCache(userRef.current.id, {
        guides: guidesRef.current,
        team: teamRef.current,
        gameTeams: gameTeamsRef.current,
        shinyHunts: nextHunts,
      });

      scheduleSave(SHINY_HUNTS_SLUG, nextHunts);
    },
    [scheduleSave]
  );

  const resetAll = useCallback(async (): Promise<AuthResult> => {
    if (!userRef.current) {
      return { ok: false, error: 'Inicia sesión para borrar tus datos.' };
    }

    try {
      const response = await fetch('/api/account', { method: 'DELETE' });

      if (!response.ok) {
        return { ok: false, error: await readErrorMessage(response) };
      }

      pendingRef.current.clear();
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
      clearPending(userRef.current.id);
      setGuides({});
      setTeam([]);
      setGameTeams({});
      setShinyHunts([]);
      setSaving(false);
      writeCache(userRef.current.id, {
        guides: {},
        team: [],
        gameTeams: {},
        shinyHunts: [],
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor.' };
    }
  }, []);

  const refresh = useCallback(async () => {
    setAuthLoading(true);
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = (await response.json()) as {
        user: AuthUser | null;
        registrationOpen?: boolean;
      };
      setUser(data.user);
      userRef.current = data.user;
      setRegistrationOpen(Boolean(data.registrationOpen));
      if (data.user) await loadAccount(data.user);
    } finally {
      setAuthLoading(false);
    }
  }, [loadAccount]);

  const value = useMemo<AccountContextValue>(
    () => ({
      user,
      authLoading,
      dataLoading,
      saving,
      syncError,
      registrationOpen,
      guides,
      team,
      gameTeams,
      shinyHunts,
      login,
      register,
      logout,
      saveGuide,
      saveTeam,
      saveGameTeam,
      saveShinyHunts,
      resetAll,
      refresh,
    }),
    [
      user,
      authLoading,
      dataLoading,
      saving,
      syncError,
      registrationOpen,
      guides,
      team,
      gameTeams,
      shinyHunts,
      login,
      register,
      logout,
      saveGuide,
      saveTeam,
      saveGameTeam,
      saveShinyHunts,
      resetAll,
      refresh,
    ]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount debe usarse dentro de <AccountProvider>');
  }
  return context;
}

export function useTeam(): TeamContextValue {
  const { user, team, dataLoading, saveTeam } = useAccount();
  const hydrated = !dataLoading;

  const has = useCallback(
    (id: number) => team.some((pokemon) => pokemon.id === id),
    [team]
  );

  const add = useCallback(
    (pokemon: PokemonBasic): 'added' | 'duplicate' | 'full' | 'auth' | 'loading' => {
      if (!user) return 'auth';
      if (dataLoading) return 'loading';
      if (team.some((entry) => entry.id === pokemon.id)) return 'duplicate';
      if (team.length >= MAX_TEAM_SIZE) return 'full';

      saveTeam([...team, pokemon]);
      return 'added';
    },
    [user, dataLoading, team, saveTeam]
  );

  const remove = useCallback(
    (id: number) => {
      if (!user) return;
      saveTeam(team.filter((pokemon) => pokemon.id !== id));
    },
    [user, team, saveTeam]
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (!user) return;
      if (from === to) return;
      if (from < 0 || to < 0 || from >= team.length || to >= team.length) return;

      const next = [...team];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      saveTeam(next);
    },
    [user, team, saveTeam]
  );

  const clear = useCallback(() => {
    if (!user) return;
    saveTeam([]);
  }, [user, saveTeam]);

  return {
    team,
    maxSize: MAX_TEAM_SIZE,
    hydrated,
    requiresLogin: !user,
    isFull: team.length >= MAX_TEAM_SIZE,
    has,
    add,
    remove,
    move,
    clear,
  };
}

export function useGameTeam(gameSlug: string): TeamContextValue {
  const { user, gameTeams, dataLoading, saveGameTeam } = useAccount();
  const team = useMemo(
    () => gameTeams[gameSlug] ?? [],
    [gameTeams, gameSlug]
  );
  const hydrated = !dataLoading;

  const has = useCallback(
    (id: number) => team.some((pokemon) => pokemon.id === id),
    [team]
  );

  const add = useCallback(
    (pokemon: PokemonBasic): 'added' | 'duplicate' | 'full' | 'auth' | 'loading' => {
      if (!user) return 'auth';
      if (dataLoading) return 'loading';
      if (team.some((entry) => entry.id === pokemon.id)) return 'duplicate';
      if (team.length >= MAX_TEAM_SIZE) return 'full';

      saveGameTeam(gameSlug, [...team, pokemon]);
      return 'added';
    },
    [user, dataLoading, team, saveGameTeam, gameSlug]
  );

  const remove = useCallback(
    (id: number) => {
      if (!user) return;
      saveGameTeam(
        gameSlug,
        team.filter((pokemon) => pokemon.id !== id)
      );
    },
    [user, team, saveGameTeam, gameSlug]
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (!user) return;
      if (from === to) return;
      if (from < 0 || to < 0 || from >= team.length || to >= team.length) return;

      const next = [...team];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      saveGameTeam(gameSlug, next);
    },
    [user, team, saveGameTeam, gameSlug]
  );

  const clear = useCallback(() => {
    if (!user) return;
    saveGameTeam(gameSlug, []);
  }, [user, saveGameTeam, gameSlug]);

  return {
    team,
    maxSize: MAX_TEAM_SIZE,
    hydrated,
    requiresLogin: !user,
    isFull: team.length >= MAX_TEAM_SIZE,
    has,
    add,
    remove,
    move,
    clear,
  };
}
