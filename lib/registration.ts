import 'server-only';
import { getDb } from '@/lib/db';
import { resolveRegistrationOpen } from '@/lib/registration-policy';

/**
 * Comprueba si el registro público está abierto. Por defecto se cierra
 * automáticamente en cuanto existe al menos una cuenta, de modo que solo el
 * propietario puede entrar. `ALLOW_REGISTRATION=true` lo reabre temporalmente.
 */
export async function isRegistrationOpen(): Promise<boolean> {
  const envValue = process.env.ALLOW_REGISTRATION;

  if (envValue === 'true' || envValue === 'false') {
    return resolveRegistrationOpen(envValue, false);
  }

  const db = getDb();
  if (!db) return false;

  try {
    const rows = (await db`
      SELECT EXISTS(SELECT 1 FROM users) AS has_users
    `) as unknown as Array<{ has_users: boolean }>;

    return resolveRegistrationOpen(undefined, Boolean(rows[0]?.has_users));
  } catch {
    // Si no se puede comprobar, cerramos por seguridad.
    return false;
  }
}
