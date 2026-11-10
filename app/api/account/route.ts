import { NextResponse } from 'next/server';
import { getCurrentUser, isSameOrigin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import {
  validateProgressData,
  validateTeamData,
} from '@/lib/validation';
import { gamesBySlug } from '@/data/games';
import type { GameProgress } from '@/types/progress';
import type { PokemonBasic } from '@/types/pokemon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEAM_SLUG = '__team__';
const GAME_TEAM_PREFIX = '__team__:';
const MAX_BODY_SIZE = 250_000;

function parseGameTeamSlug(slug: string): string | null {
  if (!slug.startsWith(GAME_TEAM_PREFIX)) return null;
  const gameSlug = slug.slice(GAME_TEAM_PREFIX.length);
  return gamesBySlug.has(gameSlug) ? gameSlug : null;
}

function parseJsonb(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: 'La base de datos no está configurada' },
      { status: 503 }
    );
  }

  const limit = await checkRateLimit(
    `account-read:${user.id}`,
    RATE_LIMITS.accountRead.limit,
    RATE_LIMITS.accountRead.windowSeconds
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones' },
      { status: 429 }
    );
  }

  const rows = await db`
    SELECT slug, data
    FROM progress
    WHERE user_id = ${user.id}
  `;

  const guides: Record<string, GameProgress> = {};
  const gameTeams: Record<string, PokemonBasic[]> = {};
  let team: PokemonBasic[] = [];

  for (const row of rows as Array<{ slug: string; data: unknown }>) {
    const parsed = parseJsonb(row.data);

    if (row.slug === TEAM_SLUG) {
      team = validateTeamData(parsed) ?? [];
      continue;
    }

    const gameTeamSlug = parseGameTeamSlug(row.slug);
    if (gameTeamSlug) {
      const gameTeam = validateTeamData(parsed);
      if (gameTeam) gameTeams[gameTeamSlug] = gameTeam;
      continue;
    }

    if (!gamesBySlug.has(row.slug)) continue;
    const progress = validateProgressData(parsed);
    if (progress) guides[row.slug] = progress;
  }

  return NextResponse.json(
    { guides, team, gameTeams },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: 'La base de datos no está configurada' },
      { status: 503 }
    );
  }

  const limit = await checkRateLimit(
    `account-write:${user.id}`,
    RATE_LIMITS.accountWrite.limit,
    RATE_LIMITS.accountWrite.windowSeconds
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados cambios seguidos. Espera un momento.' },
      { status: 429 }
    );
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Datos demasiado grandes' }, { status: 413 });
  }

  let body: { slug?: unknown; data?: unknown };
  try {
    body = JSON.parse(rawBody) as { slug?: unknown; data?: unknown };
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  if (typeof body.slug !== 'string') {
    return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  }

  let data: GameProgress | PokemonBasic[];

  if (body.slug === TEAM_SLUG) {
    const team = validateTeamData(body.data);
    if (!team) {
      return NextResponse.json({ error: 'Equipo inválido' }, { status: 400 });
    }
    data = team;
  } else if (body.slug.startsWith(GAME_TEAM_PREFIX)) {
    const gameTeamSlug = parseGameTeamSlug(body.slug);
    if (!gameTeamSlug) {
      return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 });
    }
    const gameTeam = validateTeamData(body.data);
    if (!gameTeam) {
      return NextResponse.json(
        { error: 'Equipo del juego inválido' },
        { status: 400 }
      );
    }
    data = gameTeam;
  } else {
    if (!gamesBySlug.has(body.slug)) {
      return NextResponse.json({ error: 'Guía no encontrada' }, { status: 404 });
    }
    const progress = validateProgressData(body.data);
    if (!progress) {
      return NextResponse.json({ error: 'Progreso inválido' }, { status: 400 });
    }
    data = progress;
  }

  await db`
    INSERT INTO progress (user_id, slug, data, updated_at)
    VALUES (${user.id}, ${body.slug}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (user_id, slug)
    DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: 'La base de datos no está configurada' },
      { status: 503 }
    );
  }

  const limit = await checkRateLimit(
    `account-reset:${user.id}`,
    RATE_LIMITS.reset.limit,
    RATE_LIMITS.reset.windowSeconds
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados reinicios. Espera un momento.' },
      { status: 429 }
    );
  }

  await db`DELETE FROM progress WHERE user_id = ${user.id}`;

  return NextResponse.json({ ok: true });
}
