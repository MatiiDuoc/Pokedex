import { NextResponse } from 'next/server';
import {
  authenticateUser,
  cleanupSessions,
  createSession,
  getClientIp,
  isSameOrigin,
} from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { normalizeUsername } from '@/lib/validation';

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

  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  if (typeof body.username !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const username = normalizeUsername(body.username);
  const ip = await getClientIp();

  const [ipLimit, userLimit] = await Promise.all([
    checkRateLimit(
      `login-ip:${ip}`,
      RATE_LIMITS.login.limit * 3,
      RATE_LIMITS.login.windowSeconds
    ),
    checkRateLimit(
      `login-user:${username}`,
      RATE_LIMITS.login.limit,
      RATE_LIMITS.login.windowSeconds
    ),
  ]);

  if (!ipLimit.allowed || !userLimit.allowed) {
    const resetAt = !userLimit.allowed ? userLimit.resetAt : ipLimit.resetAt;
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento.' },
      {
        status: 429,
        headers: resetAt
          ? { 'Retry-After': String(Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000))) }
          : undefined,
      }
    );
  }

  const user = await authenticateUser(body.username, body.password);

  if (!user) {
    return NextResponse.json(
      { error: 'Usuario o contraseña incorrectos.' },
      { status: 401 }
    );
  }

  await createSession(user.id);
  await cleanupSessions().catch(() => undefined);

  return NextResponse.json({ user });
}
