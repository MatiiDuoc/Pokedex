import { NextResponse } from 'next/server';
import {
  getPokemonEncounters,
  getVersionGroupVersions,
} from '@/services/pokemonEncounters';
import { getWikidexFallback } from '@/services/wikidexEncounters';

export const runtime = 'nodejs';
export const revalidate = 604800;

interface EncountersRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: EncountersRouteProps) {
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const id = Number.parseInt(rawId, 10);
  if (id < 1 || id > 1025) {
    return NextResponse.json(
      { error: 'Pokémon no encontrado' },
      { status: 404 }
    );
  }

  const versionGroup = new URL(request.url).searchParams.get('versionGroup');
  if (versionGroup && !/^[a-z0-9-]+$/.test(versionGroup)) {
    return NextResponse.json(
      { error: 'versionGroup inválido' },
      { status: 400 }
    );
  }

  try {
    const encounters = await getPokemonEncounters(id);

    if (!versionGroup) {
      const alternative =
        encounters.length === 0
          ? await getWikidexFallback(id)
          : null;
      const cacheable = encounters.length > 0 || alternative !== null;

      return NextResponse.json(
        { encounters, alternative },
        {
          headers: {
            'Cache-Control': cacheable
              ? 'public, s-maxage=604800, stale-while-revalidate=2592000'
              : 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    }

    const versions = await getVersionGroupVersions(versionGroup);
    const allowed = new Set(versions);
    const filtered = encounters.filter((group) =>
      allowed.has(group.version)
    );
    const alternative =
      filtered.length === 0
        ? await getWikidexFallback(id, versionGroup)
        : null;
    const cacheable = filtered.length > 0 || alternative !== null;

    return NextResponse.json(
      { encounters: filtered, alternative },
      {
        headers: {
          'Cache-Control': cacheable
            ? 'public, s-maxage=604800, stale-while-revalidate=2592000'
            : 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error cargando encuentros:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los encuentros' },
      { status: 502 }
    );
  }
}
