'use client';

import { useCallback, useEffect, useState } from 'react';

export interface GameProgress {
  caught: number[];
  checklist: string[];
}

const EMPTY_PROGRESS: GameProgress = { caught: [], checklist: [] };

function storageKey(slug: string): string {
  return `pokedex:guide:${slug}`;
}

function parseProgress(raw: string | null): GameProgress {
  if (!raw) return EMPTY_PROGRESS;

  try {
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    return {
      caught: Array.isArray(parsed.caught)
        ? parsed.caught.filter((id): id is number => Number.isInteger(id))
        : [],
      checklist: Array.isArray(parsed.checklist)
        ? parsed.checklist.filter((item): item is string => typeof item === 'string')
        : [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

/**
 * Progreso local por guía. Se guarda en localStorage para que el usuario pueda
 * marcar Pokémon capturados y pasos completados sin crear una cuenta.
 */
export function useGameProgress(slug: string) {
  const [progress, setProgress] = useState<GameProgress>(EMPTY_PROGRESS);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);

  useEffect(() => {
    // El estado inicial debe ser determinista en el servidor; leemos
    // localStorage después de hidratar.
    setProgress(parseProgress(window.localStorage.getItem(storageKey(slug))));
    setLoadedSlug(slug);
  }, [slug]);

  useEffect(() => {
    // Evita guardar el progreso de la guía anterior al navegar entre guías.
    if (loadedSlug !== slug) return;

    try {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(progress));
    } catch {
      // El navegador puede bloquear localStorage (modo privado, cuota, etc.).
    }
  }, [progress, slug, loadedSlug]);

  const toggleCaught = useCallback((id: number) => {
    setProgress((current) => {
      const caught = current.caught.includes(id)
        ? current.caught.filter((entry) => entry !== id)
        : [...current.caught, id];
      return { ...current, caught };
    });
  }, []);

  const setCaught = useCallback((ids: number[], value: boolean) => {
    setProgress((current) => {
      const next = new Set(current.caught);
      for (const id of ids) {
        if (value) next.add(id);
        else next.delete(id);
      }
      return { ...current, caught: Array.from(next) };
    });
  }, []);

  const toggleChecklist = useCallback((item: string) => {
    setProgress((current) => {
      const checklist = current.checklist.includes(item)
        ? current.checklist.filter((entry) => entry !== item)
        : [...current.checklist, item];
      return { ...current, checklist };
    });
  }, []);

  const reset = useCallback(() => {
    setProgress(EMPTY_PROGRESS);
  }, []);

  return {
    progress,
    loaded: loadedSlug === slug,
    isCaught: (id: number) => progress.caught.includes(id),
    isChecked: (item: string) => progress.checklist.includes(item),
    toggleCaught,
    setCaught,
    toggleChecklist,
    reset,
  };
}
