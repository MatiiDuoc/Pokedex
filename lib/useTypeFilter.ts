'use client';

import { useEffect, useState } from 'react';

const cache = new Map<string, Set<string>>();

interface PokeApiTypeResponse {
  pokemon: Array<{ pokemon: { name: string } }>;
}

/**
 * Obtiene desde PokeAPI los nombres de Pokémon de un tipo. El resultado se
 * cachea en memoria para no repetir la petición al cambiar filtros.
 */
export function useTypeFilter(type: string): {
  names: Set<string> | null;
  loading: boolean;
} {
  const [result, setResult] = useState<{
    type: string;
    names: Set<string> | null;
  }>({ type: '', names: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!type) return;

    const cached = cache.get(type);
    if (cached) {
      // Es una lectura de caché síncrona: no provoca una cascada real.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult({ type, names: cached });
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`https://pokeapi.co/api/v2/type/${type}`)
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar el tipo');
        return response.json() as Promise<PokeApiTypeResponse>;
      })
      .then((data) => {
        const next = new Set(data.pokemon.map((entry) => entry.pokemon.name));
        cache.set(type, next);
        if (!cancelled) setResult({ type, names: next });
      })
      .catch(() => {
        if (!cancelled) setResult({ type, names: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  const names = type === '' ? null : result.type === type ? result.names : null;
  const isLoading = type !== '' && result.type !== type ? true : loading;

  return { names, loading: isLoading };
}
