/**
 * Política de registro público:
 * - `true`: registro abierto.
 * - `false`: registro cerrado.
 * - sin definir: bootstrap, abierto solo si todavía no existe ningún usuario.
 */
export function resolveRegistrationOpen(
  envValue: string | undefined,
  hasUsers: boolean
): boolean {
  if (envValue === 'true') return true;
  if (envValue === 'false') return false;
  return !hasUsers;
}
