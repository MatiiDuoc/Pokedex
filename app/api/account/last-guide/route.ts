import { NextResponse } from 'next/server';
import { getCurrentUser, isSameOrigin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { validateLastGuideData } from '@/lib/last-guide';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { gamesBySlug } from '@/data/games';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LAST_GUIDE_SLUG = '__last-guide__';
const MAX_BODY_SIZE = 20_000;

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
    `last-guide-read:${user.id}`,
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
    SELECT data
    FROM progress
    WHERE user_id = ${user.id} AND slug = ${LAST_GUIDE_SLUG}
    LIMIT 1
  `;

  const row = (rows as Array<{ data: unknown }>)[0];
  const lastGuide = row ? validateLastGuideData(parseJsonb(row.data)) : null;

  return NextResponse.json(
    { lastGuide },
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
    `last-guide-write:${user.id}`,
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
    return NextResponse.json(
      { error: 'Datos demasiado grandes' },
      { status: 413 }
    );
  }

  let body: { data?: unknown };
  try {
    body = JSON.parse(rawBody) as { data?: unknown };
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const lastGuide = validateLastGuideData(body.data);
  if (!lastGuide || !gamesBySlug.has(lastGuide.slug)) {
    return NextResponse.json(
      { error: 'Última guía inválida' },
      { status: 400 }
    );
  }

  const data = { ...lastGuide, updatedAt: Date.now() };

  await db`
    INSERT INTO progress (user_id, slug, data, updated_at)
    VALUES (${user.id}, ${LAST_GUIDE_SLUG}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (user_id, slug)
    DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;

  return NextResponse.json({ ok: true });
}
