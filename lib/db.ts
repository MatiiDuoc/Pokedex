import 'server-only';
import { neon } from '@neondatabase/serverless';

type NeonSql = ReturnType<typeof neon>;

let client: NeonSql | null = null;

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
}

export function getDb(): NeonSql | null {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!client) client = neon(url);
  return client;
}

export function requireDb(): NeonSql {
  const db = getDb();
  if (!db) {
    throw new Error(
      'DATABASE_URL no está configurada. Añádela en .env.local o en Vercel.'
    );
  }
  return db;
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseUrl() !== null;
}
