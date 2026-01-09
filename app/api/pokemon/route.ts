import { getPokemonPaginated } from '@/services/pokeapi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const data = await getPokemonPaginated(offset, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Pokemon data' },
      { status: 500 }
    );
  }
}
