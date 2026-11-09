import 'server-only';
import { getDb } from '@/lib/db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
}

const FALLBACK_WINDOW_MS = 60_000;

const memoryLimits = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const current = memoryLimits.get(key);

  if (!current || current.resetAt <= now) {
    memoryLimits.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt: new Date(now + windowSeconds * 1000),
    };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: new Date(current.resetAt),
  };
}

/**
 * Rate limit distribuido en Postgres. Si la base de datos no está disponible,
 * usa un límite en memoria como respaldo para desarrollo.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const db = getDb();
  if (!db) return memoryRateLimit(key, limit, windowSeconds);

  try {
    const rows = (await db`
      INSERT INTO rate_limits (key, count, expires_at)
      VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.expires_at <= now() THEN 1
          ELSE rate_limits.count + 1
        END,
        expires_at = CASE
          WHEN rate_limits.expires_at <= now()
            THEN now() + make_interval(secs => ${windowSeconds})
          ELSE rate_limits.expires_at
        END
      RETURNING count, expires_at
    `) as unknown as Array<{ count: number; expires_at: string }>;

    const row = rows[0];
    if (!row) return memoryRateLimit(key, limit, windowSeconds);

    return {
      allowed: row.count <= limit,
      remaining: Math.max(0, limit - row.count),
      resetAt: new Date(row.expires_at),
    };
  } catch (error) {
    console.error('Error en rate limit:', error);
    return memoryRateLimit(key, limit, windowSeconds);
  }
}

export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 60 },
  register: { limit: 20, windowSeconds: 3600 },
  accountWrite: { limit: 120, windowSeconds: 60 },
  accountRead: { limit: 240, windowSeconds: 60 },
  reset: { limit: 5, windowSeconds: 3600 },
};

export { FALLBACK_WINDOW_MS };
