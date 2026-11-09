import { describe, expect, it } from 'vitest';
import { resolveRegistrationOpen } from './registration-policy';

describe('política de registro', () => {
  it('abre el registro solo si no hay usuarios y no hay override', () => {
    expect(resolveRegistrationOpen(undefined, false)).toBe(true);
    expect(resolveRegistrationOpen(undefined, true)).toBe(false);
  });

  it('respeta el override explícito', () => {
    expect(resolveRegistrationOpen('true', true)).toBe(true);
    expect(resolveRegistrationOpen('false', false)).toBe(false);
  });
});
