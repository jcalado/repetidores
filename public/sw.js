// Service Worker for Repetidores PWA
//
// Cache strategy:
//   - Navigation HTML (request.mode === 'navigate'): network-first with cache
//     fallback. Ensures clients always pick up the latest deployed HTML when
//     online, falling back to the last good copy when offline.
//   - Next.js hashed chunks (/_next/static/*): cache-first. Content hash is in
//     the URL, so the URL itself is the cache key. Safe to cache aggressively.
//   - Other static assets (icons, manifest, fonts, images): cache-first with
//     stale-while-revalidate. Tolerant of staleness for one load.
//   - API (/api/*): network-first with cache fallback. Unchanged.
//
// Bump CACHE_VERSION whenever the strategy or precached set changes. That
// invalidates every prior cache and forces clients into a clean state.
const CACHE_VERSION = 'v3';
const CACHE_NAME = `radioamador.info-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `radioamador.info-data-${CACHE_VERSION}`;

// Precached on install. Keep small and stable. No HTML.
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// Network-first: fetch, fall back to cache only on failure. Used for HTML
// navigations and the API, where freshness matters more than offline support.
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Network failed, serving cached:', request.url);
      return cached;
    }
    throw err;
  }
}

// Cache-first: serve from cache if present, otherwise fetch and store.
// For URLs that already encode their version in the path (hashed chunks),
// no background revalidate is needed — a new deploy produces new URLs.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && new URL(request.url).origin === self.location.origin) {
    cache.put(request, response.clone());
  }
  return response;
}

// Stale-while-revalidate: serve cache immediately, refresh in background.
// Used for non-hashed static assets where staleness for one load is acceptable.
async function staleWhileRevalidate(request, cacheName, event) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchAndUpdate = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(fetchAndUpdate);
    return cached;
  }
  const response = await fetchAndUpdate;
  return response ?? new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;

  // 1. HTML navigations: network-first. Picks up new deploys on first reload.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_NAME));
    return;
  }

  // 2. API: network-first with cache fallback (unchanged from prior policy).
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DATA_CACHE_NAME));
    return;
  }

  // 3. Hashed Next.js chunks: cache-first. Content hash in URL is the cache
  //    key; staleness is structurally impossible.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // 4. Everything else (icons, manifest, fonts, images): stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME, event));
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'refreshData') {
    caches.delete(DATA_CACHE_NAME).then(() => {
      console.log('[SW] Data cache cleared for refresh');
    });
  }
});
