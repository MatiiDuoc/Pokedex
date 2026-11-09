const VERSION = 'pokedex-v3';
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const MODELS_CACHE = `${VERSION}-models`;

const PRECACHE = [
  '/',
  '/offline',
  '/guias',
  '/pokedex',
  '/icon.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cachePage(request, response) {
  const cache = await caches.open(PAGES_CACHE);
  await cache.put(request, response.clone());
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Modelos 3D: cache-first para que la segunda carga sea instantánea.
  if (
    url.origin === 'https://raw.githubusercontent.com' &&
    url.pathname.startsWith('/Pokemon-3D-api/assets/')
  ) {
    event.respondWith(
      caches.open(MODELS_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) {
          void cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Nunca cachear API: login, progreso y cuenta deben ir siempre a la red.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          void cachePage(request, response);
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline');
          return offline ?? Response.error();
        })
    );
    return;
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname.startsWith('/manifest') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          void cachePage(request, response);
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          void cachePage(request, response);
          return response;
        })
        .catch(() => cached);

      return cached ?? network;
    })
  );
});
