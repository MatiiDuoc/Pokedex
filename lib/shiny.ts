import type { ShinyMethod } from '@/types/shiny';

export interface ShinyMethodOption {
  value: ShinyMethod;
  label: string;
  description: string;
}

export const SHINY_METHOD_OPTIONS: ShinyMethodOption[] = [
  {
    value: 'random',
    label: 'Encuentro normal',
    description: 'Encuentros aleatorios, regalos o huevos sin método especial.',
  },
  {
    value: 'masuda',
    label: 'Método Masuda',
    description: 'Criar con un Pokémon de otro idioma.',
  },
  {
    value: 'soft-reset',
    label: 'Soft reset',
    description: 'Reiniciar el juego frente a un Pokémon fijo o legendario.',
  },
  {
    value: 'sos',
    label: 'Cadena SOS',
    description: 'Encadenar aliados en Sol/Luna y Ultrasol/Ultraluna.',
  },
  {
    value: 'chain',
    label: 'Cadena / Poké Radar',
    description: 'Cadena de Poké Radar, pesca en cadena o DexNav.',
  },
  {
    value: 'dexnav',
    label: 'DexNav',
    description: 'Búsqueda con el DexNav en Rubí Omega/Zafiro Alfa.',
  },
  {
    value: 'outbreak',
    label: 'Aparición masiva',
    description: 'Brotes o apariciones masivas con varias apariciones por ciclo.',
  },
  {
    value: 'sandwich',
    label: 'Sándwich shiny',
    description: 'Sándwich de Poder Shiny nivel 3 en Escarlata/Púrpura.',
  },
  {
    value: 'dynamax-adventure',
    label: 'Aventura Dinamax',
    description: 'Incursiones de la Aventura Dinamax en Espada/Escudo.',
  },
];

export function getShinyMethodLabel(method: ShinyMethod): string {
  return (
    SHINY_METHOD_OPTIONS.find((entry) => entry.value === method)?.label ??
    method
  );
}

/**
 * Probabilidad orientativa. Los juegos y los eventos cambian las reglas, así
 * que se usa una estimación conservadora y se avisa en la interfaz.
 */
export function getShinyOdds(
  method: ShinyMethod,
  generation: number,
  hasShinyCharm: boolean
): { denominator: number; note: string } {
  const base = generation >= 6 ? 4096 : 8192;

  if (method === 'masuda') {
    if (generation >= 6) {
      return {
        denominator: hasShinyCharm ? 512 : 683,
        note: 'Masuda en generaciones 6-9.',
      };
    }
    if (generation === 5) {
      return {
        denominator: hasShinyCharm ? 1024 : 1365,
        note: 'Masuda en la generación 5.',
      };
    }
    return {
      denominator: hasShinyCharm ? 1024 : 1638,
      note: 'Masuda en la generación 4.',
    };
  }

  if (method === 'sos') {
    return {
      denominator: hasShinyCharm ? 512 : 683,
      note: 'Cadena SOS larga.',
    };
  }

  if (method === 'chain') {
    return {
      denominator: hasShinyCharm ? 100 : 200,
      note: 'Cadena alta de Poké Radar o pesca.',
    };
  }

  if (method === 'dexnav') {
    return {
      denominator: hasShinyCharm ? 476 : 512,
      note: 'DexNav con búsqueda repetida.',
    };
  }

  if (method === 'outbreak') {
    return {
      denominator: hasShinyCharm ? 315 : 409,
      note: 'Aparición masiva con muchas apariciones.',
    };
  }

  if (method === 'sandwich') {
    return {
      denominator: hasShinyCharm ? 512 : 683,
      note: 'Sándwich de Poder Shiny nivel 3.',
    };
  }

  if (method === 'dynamax-adventure') {
    return {
      denominator: hasShinyCharm ? 100 : 300,
      note: 'Aventura Dinamax completada.',
    };
  }

  return {
    denominator: base,
    note: 'Probabilidad base del juego.',
  };
}

export function getShinyProbability(
  encounters: number,
  denominator: number
): number {
  if (encounters <= 0 || denominator <= 0) return 0;
  return 1 - Math.pow(1 - 1 / denominator, encounters);
}

export function formatShinyProbability(probability: number): string {
  if (probability <= 0) return '0%';
  if (probability < 0.01) return `${(probability * 100).toFixed(2)}%`;
  if (probability < 1) return `${(probability * 100).toFixed(1)}%`;
  return '100%';
}
