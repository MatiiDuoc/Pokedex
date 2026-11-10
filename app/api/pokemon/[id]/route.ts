import { NextResponse } from 'next/server';
import { getPokemonByIds } from '@/services/pokeapi';

export const runtime = 'nodejs';
export const revalidate = 604800;

interface PokemonRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: PokemonRouteProps) {
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const id = Number.parseInt(rawId, 10);
  if (id < 1 || id > 1025) {
    return NextResponse.json({ error: 'Pokémon no encontrado' }, { status: 404 });
  }

  const [pokemon] = await getPokemonByIds([id]);
  if (!pokemon) {
    return NextResponse.json({ error: 'Pokémon no encontrado' }, { status: 404 });
  }

  return NextResponse.json(pokemon, {
    headers: {
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
    },
  });
}
