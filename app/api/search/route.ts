import { NextRequest, NextResponse } from 'next/server';
import { games } from '@/data/games';
import { getPokemonIndex } from '@/services/pokedexIndex';

export const runtime = 'nodejs';
export const revalidate = 86400;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export async function GET(request: NextRequest) {
  const query = normalize(request.nextUrl.searchParams.get('q') ?? '');

  if (query.length < 2 || query.length > 60) {
    return NextResponse.json(
      { pokemon: [], games: [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  }

  const index = await getPokemonIndex();

  const pokemon = index
    .map((entry) => {
      const name = normalize(entry.name);
      const id = entry.id.toString();

      let score = 0;
      if (id === query || name === query) score = 100;
      else if (id.startsWith(query) || name.startsWith(query)) score = 70;
      else if (name.includes(query) || id.includes(query)) score = 40;

      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id - b.entry.id)
    .slice(0, 8)
    .map(({ entry }) => ({
      id: entry.id,
      name: entry.name,
      artworkUrl: entry.artworkUrl,
      shinyArtworkUrl: entry.shinyArtworkUrl,
      legendaryCategory: entry.legendaryCategory,
    }));

  const gameResults = games
    .map((game) => {
      const haystack = normalize(
        `${game.title} ${game.shortTitle} ${game.region} ${game.platform}`
      );
      const score = haystack.includes(query) ? 1 : 0;
      return { game, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => a.game.releaseYear - b.game.releaseYear)
    .slice(0, 5)
    .map(({ game }) => ({
      slug: game.slug,
      title: game.title,
      region: game.region,
      generation: game.generation,
      releaseYear: game.releaseYear,
      category: game.category ?? 'main',
      accent: game.accent,
    }));

  return NextResponse.json(
    { pokemon, games: gameResults },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
