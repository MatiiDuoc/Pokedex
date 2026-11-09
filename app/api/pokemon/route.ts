import { getPokemonPaginated } from '@/services/pokeapi';
import { NextRequest, NextResponse } from 'next/server';

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 20;

function parseInteger(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const offset = Math.max(0, parseInteger(searchParams.get('offset'), 0));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInteger(searchParams.get('limit'), DEFAULT_LIMIT))
  );

  try {
    const data = await getPokemonPaginated(offset, limit);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener los datos de Pokémon' },
      { status: 502 }
    );
  }
}
