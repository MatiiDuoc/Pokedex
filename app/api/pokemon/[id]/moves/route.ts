import { NextResponse } from 'next/server';
import { getPokemonMoves } from '@/services/pokemonMoves';

export const runtime = 'nodejs';
export const revalidate = 604800;

interface MovesRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: MovesRouteProps) {
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const id = Number.parseInt(rawId, 10);
  if (id < 1 || id > 1025) {
    return NextResponse.json({ error: 'Pokémon no encontrado' }, { status: 404 });
  }

  const versionGroup = new URL(request.url).searchParams.get('versionGroup');
  if (!versionGroup || !/^[a-z0-9-]+$/.test(versionGroup)) {
    return NextResponse.json(
      { error: 'versionGroup inválido' },
      { status: 400 }
    );
  }

  try {
    const moves = await getPokemonMoves(id, versionGroup);
    return NextResponse.json(moves, {
      headers: {
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
      },
    });
  } catch (error) {
    console.error('Error cargando movimientos:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los movimientos' },
      { status: 502 }
    );
  }
}
