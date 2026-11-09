import { NextResponse, type NextRequest } from 'next/server';

const POKEDEX_DETAIL_PATTERN = /^\/pokedex\/([^/]+)\/?$/;
const STATIC_POKEDEX_ROUTES = new Set(['3d']);

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(POKEDEX_DETAIL_PATTERN);
  if (!match) return NextResponse.next();

  const rawId = match[1];
  if (STATIC_POKEDEX_ROUTES.has(rawId)) return NextResponse.next();

  const id = /^\d+$/.test(rawId) ? Number.parseInt(rawId, 10) : Number.NaN;

  if (!Number.isInteger(id) || id < 1 || id > 1025) {
    return NextResponse.redirect(new URL('/pokedex', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pokedex/:path*'],
};
