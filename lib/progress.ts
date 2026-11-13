'use client';

import { useCallback } from 'react';
import { useAccount } from '@/components/AccountProvider';
import type { GameProgress } from '@/types/progress';

export type { GameProgress } from '@/types/progress';

const EMPTY_PROGRESS: GameProgress = {
  caught: [],
  seen: [],
  checklist: [],
};

/**
 * Progreso de una guía. Cuando hay sesión iniciada se sincroniza con Postgres;
 * los invitados solo pueden consultar y deben iniciar sesión para marcar.
 */
export function useGameProgress(slug: string) {
  const { guides, saveGuide, dataLoading, authLoading, user } = useAccount();

  const progress = guides[slug] ?? EMPTY_PROGRESS;

  const update = useCallback(
    (next: GameProgress) => {
      if (!user || dataLoading) return;
      saveGuide(slug, next);
    },
    [dataLoading, saveGuide, slug, user]
  );

  const toggleCaught = useCallback(
    (id: number) => {
      if (!user) return;

      const isCaught = progress.caught.includes(id);
      const caught = isCaught
        ? progress.caught.filter((entry) => entry !== id)
        : [...progress.caught, id];
      const seen = new Set(progress.seen ?? []);

      if (!isCaught) seen.add(id);

      update({ ...progress, caught, seen: Array.from(seen) });
    },
    [progress, update, user]
  );

  const setCaught = useCallback(
    (ids: number[], value: boolean) => {
      if (!user) return;

      const caught = new Set(progress.caught);
      const seen = new Set(progress.seen ?? []);

      for (const id of ids) {
        if (value) {
          caught.add(id);
          seen.add(id);
        } else {
          caught.delete(id);
        }
      }

      update({
        ...progress,
        caught: Array.from(caught),
        seen: Array.from(seen),
      });
    },
    [progress, update, user]
  );

  const toggleSeen = useCallback(
    (id: number) => {
      if (!user) return;

      const currentSeen = progress.seen ?? [];
      const isSeen = currentSeen.includes(id);

      if (isSeen) {
        update({
          ...progress,
          seen: currentSeen.filter((entry) => entry !== id),
          caught: progress.caught.filter((entry) => entry !== id),
        });
      } else {
        update({ ...progress, seen: [...currentSeen, id] });
      }
    },
    [progress, update, user]
  );

  const setSeen = useCallback(
    (ids: number[], value: boolean) => {
      if (!user) return;

      const seen = new Set(progress.seen ?? []);
      const removed = new Set<number>();

      for (const id of ids) {
        if (value) seen.add(id);
        else {
          seen.delete(id);
          removed.add(id);
        }
      }

      update({
        ...progress,
        seen: Array.from(seen),
        caught: value
          ? progress.caught
          : progress.caught.filter((id) => !removed.has(id)),
      });
    },
    [progress, update, user]
  );

  const toggleChecklist = useCallback(
    (item: string) => {
      if (!user) return;
      const checklist = progress.checklist.includes(item)
        ? progress.checklist.filter((entry) => entry !== item)
        : [...progress.checklist, item];
      update({ ...progress, checklist });
    },
    [progress, update, user]
  );

  const setChecklist = useCallback(
    (items: string[], value: boolean) => {
      if (!user) return;

      const checklist = new Set(progress.checklist);
      for (const item of items) {
        if (value) checklist.add(item);
        else checklist.delete(item);
      }

      update({ ...progress, checklist: Array.from(checklist) });
    },
    [progress, update, user]
  );

  const setNote = useCallback(
    (key: string, value: string) => {
      if (!user) return;

      const notes = { ...(progress.notes ?? {}) };
      const trimmed = value.trim().slice(0, 1000);

      if (trimmed) notes[key] = trimmed;
      else delete notes[key];

      update({ ...progress, notes });
    },
    [progress, update, user]
  );

  const reset = useCallback(() => {
    update(EMPTY_PROGRESS);
  }, [update]);

  return {
    progress,
    loaded: !dataLoading && !authLoading,
    isAuthenticated: Boolean(user),
    requiresLogin: !user && !authLoading,
    isCaught: (id: number) => progress.caught.includes(id),
    isSeen: (id: number) => (progress.seen ?? []).includes(id),
    isChecked: (item: string) => progress.checklist.includes(item),
    toggleCaught,
    setCaught,
    toggleSeen,
    setSeen,
    toggleChecklist,
    setChecklist,
    setNote,
    reset,
  };
}
