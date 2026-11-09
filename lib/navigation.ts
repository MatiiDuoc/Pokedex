/** Evita redirecciones abiertas: solo rutas internas absolutas. */
export function safeNextPath(value: string | undefined): string {
  if (!value) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}
