'use client';

import { useCallback } from 'react';
import { useAccount } from '@/components/AccountProvider';
import type { GameProgress } from '@/types/progress';

export type { GameProgress } from '@/types/progress';

const EMPTY_PROGRESS: GameProgress = { caught: [], checklist: [] };

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
      const caught = progress.caught.includes(id)
        ? progress.caught.filter((entry) => entry !== id)
        : [...progress.caught, id];
      update({ ...progress, caught });
    },
    [progress, update, user]
  );

  const setCaught = useCallback(
    (ids: number[], value: boolean) => {
      if (!user) return;
      const next = new Set(progress.caught);
      for (const id of ids) {
        if (value) next.add(id);
        else next.delete(id);
      }
      update({ ...progress, caught: Array.from(next) });
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
    isChecked: (item: string) => progress.checklist.includes(item),
    toggleCaught,
    setCaught,
    toggleChecklist,
    setChecklist,
    setNote,
    reset,
  };
}
