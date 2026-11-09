'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Home,
  Map,
  Search,
  User,
  Users,
} from 'lucide-react';

const links = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/pokedex', label: 'Pokédex', icon: BookOpen },
  { href: '/guias', label: 'Guías', icon: Map },
  { href: '/equipo', label: 'Equipo', icon: Users },
  { href: '/buscar', label: 'Buscar', icon: Search },
  { href: '/cuenta', label: 'Cuenta', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-bold transition ${
                isActive ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
