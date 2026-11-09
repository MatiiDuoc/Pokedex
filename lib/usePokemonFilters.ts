'use client';

import { useEffect, useState } from 'react';
import type { PokemonFilterEntry } from '@/types/filters';

let cache: PokemonFilterEntry[] | null = null;
let pending: Promise<PokemonFilterEntry[]> | null = null;

async function loadFilters(): Promise<PokemonFilterEntry[]> {
  if (cache) return cache;
  if (!pending) {
    pending = fetch('/pokemon-filters.json')
      .then((response) => {
        if (!response.ok) throw new Error('No se pudieron cargar los filtros');
        return response.json() as Promise<PokemonFilterEntry[]>;
      })
      .then((data) => {
        cache = data;
        return data;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}

/**
 * Carga bajo demanda el dataset ligero de tipos, estadísticas y habilidades.
 * Solo se descarga cuando el usuario activa un filtro avanzado.
 */
export function usePokemonFilters(enabled: boolean): {
  data: PokemonFilterEntry[] | null;
  loading: boolean;
} {
  const [data, setData] = useState<PokemonFilterEntry[] | null>(cache);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || cache) return;

    let cancelled = false;
    // La carga es una sincronización con un recurso externo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    loadFilters()
      .then((entries) => {
        if (!cancelled) setData(entries);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, loading };
}
