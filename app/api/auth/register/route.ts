import { NextResponse } from 'next/server';
import {
  cleanupSessions,
  createSession,
  getClientIp,
  isSameOrigin,
  registerUser,
} from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { isValidPassword, isValidUsername } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'La base de datos no está configurada' },
      { status: 503 }
    );
  }

  const ip = await getClientIp();
  const limit = await checkRateLimit(
    `register:${ip}`,
    RATE_LIMITS.register.limit,
    RATE_LIMITS.register.windowSeconds
  );

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados registros. Inténtalo más tarde.' },
      {
        status: 429,
        headers: limit.resetAt
          ? { 'Retry-After': String(Math.max(1, Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000))) }
          : undefined,
      }
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  if (typeof body.username !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  if (!isValidUsername(body.username)) {
    return NextResponse.json(
      {
        error:
          'El usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo.',
      },
      { status: 400 }
    );
  }

  if (!isValidPassword(body.password)) {
    return NextResponse.json(
      { error: 'La contraseña debe tener entre 8 y 128 caracteres.' },
      { status: 400 }
    );
  }

  const result = await registerUser(body.username, body.password);

  if ('error' in result) {
    if (result.error === 'exists') {
      return NextResponse.json(
        { error: 'Ese nombre de usuario ya existe.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'No se pudo crear la cuenta.' },
      { status: 500 }
    );
  }

  await createSession(result.user.id);
  await cleanupSessions().catch(() => undefined);

  return NextResponse.json(
    { user: result.user },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  );
}
