import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWikidexFallback } from './wikidexEncounters';

const wikitext = `== Localización ==
{{Localización
| generación = 9
| escarlata = *'''[[Pokémon salvaje|Salvaje]]:''' [[Área 1 del sur]], [[Área 2 del sur]] y [[Sendero de Cahíz]].
* '''[[Evolución|Evolucionar]]:''' a [[Pikachu]].
| púrpura = escarlata
| leyendas Arceus = *'''[[Pokémon salvaje|Salvaje]]:''' [[Pradera Obsidiana]].
}}

== Movimientos ==
`;

function mockFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes('/pokemon-species/')) {
        return new Response(
          JSON.stringify({
            name: 'pawmi',
            names: [
              { name: 'Pawmi', language: { name: 'es' } },
              { name: 'Pawmi', language: { name: 'en' } },
            ],
          }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          parse: {
            title: 'Pawmi',
            wikitext: { '*': wikitext },
          },
        }),
        { status: 200 }
      );
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fallback de WikiDex', () => {
  it('extrae los encuentros de Escarlata y Púrpura en español', async () => {
    mockFetch();

    const fallback = await getWikidexFallback(921, 'scarlet-violet');

    expect(fallback?.source).toBe('WikiDex');
    expect(fallback?.versions.map((version) => version.version)).toEqual([
      'scarlet',
      'violet',
    ]);
    expect(fallback?.versions[0].entries[0]).toEqual({
      method: 'Salvaje',
      details: 'Área 1 del sur, Área 2 del sur y Sendero de Cahíz.',
    });
    expect(fallback?.versions[1].entries).toEqual(
      fallback?.versions[0].entries
    );
  });

  it('devuelve las versiones de Leyendas: Arceus', async () => {
    mockFetch();

    const fallback = await getWikidexFallback(921, 'legends-arceus');

    expect(fallback?.versions).toEqual([
      {
        version: 'legends-arceus',
        entries: [
          {
            method: 'Salvaje',
            details: 'Pradera Obsidiana.',
          },
        ],
      },
    ]);
  });

  it('devuelve null si el juego no tiene datos', async () => {
    mockFetch();

    const fallback = await getWikidexFallback(921, 'sword-shield');

    expect(fallback).toBeNull();
  });
});
