import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';
import { getDb, requireDb } from '@/lib/db';
import { normalizeUsername } from '@/lib/validation';
import type { AuthUser } from '@/types/auth';

export type { AuthUser } from '@/types/auth';

function scryptAsync(
  password: string,
  salt: string,
  keyLength: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

export const SESSION_COOKIE = 'pokedex_session';
const SESSION_DAYS = 30;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt,
    derived.toString('hex'),
  ].join('$');
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, n, r, p, salt, expectedHex] = parts;
  const expected = Buffer.from(expectedHex, 'hex');

  try {
    const derived = await scryptAsync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });

    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}

export async function createSession(userId: string): Promise<void> {
  const db = requireDb();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${tokenHash}, ${userId}, ${expiresAt.toISOString()})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = getDb();
    if (db) {
      await db`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const db = getDb();
  if (!db) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = (await db`
    SELECT u.id, u.username, u.display_name
    FROM sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.expires_at > now()
    LIMIT 1
  `) as unknown as Array<{
    id: string;
    username: string;
    display_name: string;
  }>;

  const row = rows[0];

  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  };
});

export async function registerUser(
  usernameInput: string,
  password: string
): Promise<{ user: AuthUser } | { error: 'exists' } | { error: 'db' }> {
  const db = getDb();
  if (!db) return { error: 'db' };

  const username = normalizeUsername(usernameInput);
  const displayName = usernameInput.trim();
  const id = randomUUID();
  const passwordHash = await hashPassword(password);

  try {
    await db`
      INSERT INTO users (id, username, display_name, password_hash)
      VALUES (${id}, ${username}, ${displayName}, ${passwordHash})
    `;
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return { error: 'exists' };
    }
    console.error('Error registrando usuario:', error);
    return { error: 'db' };
  }

  return { user: { id, username, displayName } };
}

export async function authenticateUser(
  usernameInput: string,
  password: string
): Promise<AuthUser | null> {
  const db = getDb();
  if (!db) return null;

  const username = normalizeUsername(usernameInput);
  const rows = (await db`
    SELECT id, username, display_name, password_hash
    FROM users
    WHERE username = ${username}
    LIMIT 1
  `) as unknown as UserRow[];

  const row = rows[0];
  if (!row) return null;

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return null;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  };
}

export async function cleanupSessions(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db`DELETE FROM sessions WHERE expires_at < now()`;
  await db`DELETE FROM rate_limits WHERE expires_at < now() - interval '1 day'`;
}

export async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return headerStore.get('x-real-ip') || 'unknown';
}

/** Protección CSRF básica para mutaciones con cookies SameSite=Lax. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const host = request.headers.get('host');
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
