import { NextResponse } from 'next/server';
import {
  createSession,
  getCurrentUser,
  hashPassword,
  isSameOrigin,
  verifyPassword,
} from '@/lib/auth';
import { getDb } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { isValidPassword } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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
    `password-change:${user.id}`,
    RATE_LIMITS.login.limit,
    RATE_LIMITS.login.windowSeconds
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento.' },
      { status: 429 }
    );
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = (await request.json()) as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  if (
    typeof body.currentPassword !== 'string' ||
    typeof body.newPassword !== 'string'
  ) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  if (!isValidPassword(body.newPassword)) {
    return NextResponse.json(
      { error: 'La nueva contraseña debe tener entre 8 y 128 caracteres.' },
      { status: 400 }
    );
  }

  const rows = await db`
    SELECT password_hash
    FROM users
    WHERE id = ${user.id}
    LIMIT 1
  `;
  const row = (rows as Array<{ password_hash: string }>)[0];

  if (!row) {
    return NextResponse.json(
      { error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  const valid = await verifyPassword(body.currentPassword, row.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: 'La contraseña actual no es correcta.' },
      { status: 401 }
    );
  }

  const passwordHash = await hashPassword(body.newPassword);

  await db`
    UPDATE users
    SET password_hash = ${passwordHash}
    WHERE id = ${user.id}
  `;

  // Invalida las sesiones de otros dispositivos y renueva la actual.
  await db`DELETE FROM sessions WHERE user_id = ${user.id}`;
  await createSession(user.id);

  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
