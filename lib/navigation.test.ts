import { describe, expect, it } from 'vitest';
import { safeNextPath } from './navigation';

describe('safeNextPath', () => {
  it('acepta rutas internas', () => {
    expect(safeNextPath('/guias/red-blue-green')).toBe('/guias/red-blue-green');
    expect(safeNextPath('/')).toBe('/');
  });

  it('bloquea redirecciones abiertas', () => {
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('javascript:alert(1)')).toBe('/');
    expect(safeNextPath(undefined)).toBe('/');
  });
});
