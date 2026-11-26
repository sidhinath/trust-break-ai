// TrustBreak AI Service Worker (PWA offline shell + versioned static cache)
//
// IMPORTANT: never serve `/` or `/index.html` from a cache-first handler.
// Vercel deletes old hashed chunks after a deploy. Navigations are always
// network-first so a stale index.html can never pin an old build.

const CACHE_PREFIX = 'trustbreak-';
const CACHE_VERSION = 'v3';
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_VERSION}`;

const SKIP_WAITING = 'SKIP_WAITING';
const CLEAR_CACHES = 'CLEAR_CACHES';

const PRECACHE_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo-icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

const STATIC_ASSET = /\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|css|js|map)$/i;

// Install: activate immediately so a deployed build never waits for tabs to
// close. The React app handles the single reload on controllerchange.
self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        PRECACHE_ASSETS.map((path) =>
          cache.add(new Request(path, { cache: 'reload' })).catch((err) => {
            console.warn('[TrustBreak SW] Pre-cache skipped:', path, err);
          })
        )
      )
    )
  );
});

// Activate: remove every old TrustBreak cache, then take control.
self.addEventListener('activate', (event) => {
  const validCaches = new Set([SHELL_CACHE, STATIC_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && !validCaches.has(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Client-controlled update + recovery messages.
self.addEventListener('message', (event) => {
  const type = event.data && event.data.type;
  const reply = event.ports && event.ports[0];

  if (type === SKIP_WAITING) {
    self.skipWaiting();
    return;
  }

  if (type === CLEAR_CACHES) {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith(CACHE_PREFIX))
              .map((key) => caches.delete(key))
          )
        )
        .then(() => {
          if (reply) reply.postMessage({ ok: true });
        })
        .catch((err) => {
          console.warn('[TrustBreak SW] Cache clear failed:', err);
          if (reply) reply.postMessage({ ok: false });
        })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin http(s) requests. Never touch /api/ or third-party
  // font/analytics requests — the browser/network owns those.
  if (
    url.origin !== self.location.origin ||
    !/^https?:$/.test(url.protocol) ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Navigations (including PWA standalone launches at "/") must go to the
  // network first so a stale index.html can never pin an old build. The cached
  // shell is only an offline fallback and is refreshed from successful navigations.
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            event.waitUntil(
              caches.open(SHELL_CACHE).then((cache) =>
                cache.put('/index.html', response.clone())
              )
            );
          }
          return response;
        })
        .catch(() =>
          caches.match('/index.html', { cacheName: SHELL_CACHE }).then((cached) => {
            if (cached) return cached;
            return new Response('Offline — open TrustBreak AI when connected.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          })
        )
    );
    return;
  }

  // Hashed build assets and icons are immutable/versioned: cache-first is safe.
  if (STATIC_ASSET.test(url.pathname)) {
    event.respondWith(
      caches.match(request, { cacheName: STATIC_CACHE }).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response && response.ok) {
            event.waitUntil(
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()))
            );
          }
          return response;
        });
      })
    );
  }
});
