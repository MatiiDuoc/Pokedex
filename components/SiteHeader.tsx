'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/pokedex', label: 'Pokédex' },
  { href: '/guias', label: 'Guías de juegos' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-black text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-red-600"
            aria-hidden="true"
          >
            <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-gray-900" />
            <span className="relative h-4 w-4 rounded-full border-4 border-white bg-white">
              <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-gray-900" />
            </span>
          </span>
          <span>
            Pokédex<span className="text-red-600">+</span>Guías
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="flex items-center gap-1 overflow-x-auto">
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
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
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
      </div>
    </header>
  );
}
