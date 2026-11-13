'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from '@/components/AccountProvider';
import GlobalSearchAutocomplete from '@/components/GlobalSearchAutocomplete';
import ThemeToggle from '@/components/ThemeToggle';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/pokedex', label: 'Pokédex' },
  { href: '/guias', label: 'Guías' },
  { href: '/equipo', label: 'Equipo' },
  { href: '/buscar', label: 'Buscar' },
  { href: '/cuenta', label: 'Cuenta' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { user, authLoading, logout, syncError, registrationOpen } = useAccount();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="Pokédex + Guías"
            className="flex min-w-0 items-center gap-2 text-lg font-black text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <span
              className="relative flex h-9 w-9 flex-none items-center justify-center rounded-full bg-red-600"
              aria-hidden="true"
            >
              <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-gray-900" />
              <span className="relative h-4 w-4 rounded-full border-4 border-white bg-white">
                <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-gray-900" />
              </span>
            </span>
            <span className="hidden min-[360px]:inline">
              Pokédex<span className="text-red-600">+</span>Guías
            </span>
          </Link>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-1 overflow-x-auto lg:flex"
          >
            {links.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:px-3 ${
                    isActive
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-none items-center gap-2">
            <ThemeToggle />
            {syncError && (
              <span
                title={syncError}
                aria-label={syncError}
                className="hidden text-lg sm:inline"
                role="status"
              >
                ⚠️
              </span>
            )}

            {authLoading ? (
              <span className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
            ) : user ? (
              <>
                <Link
                  href="/cuenta"
                  className="hidden max-w-[10rem] truncate text-sm font-bold text-gray-700 hover:text-red-600 sm:inline"
                >
                  {user.displayName}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  Entrar
                </Link>
                {registrationOpen && (
                  <Link
                    href="/registro"
                    className="hidden rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200 sm:inline"
                  >
                    Crear cuenta
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-2 hidden lg:block">
          <GlobalSearchAutocomplete />
        </div>
      </div>
    </header>
  );
}
