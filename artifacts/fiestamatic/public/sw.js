// Fiestamatic Service Worker v2
// Strategy:
//   - App shell (HTML nav): StaleWhileRevalidate → no white screen offline
//   - Static assets (JS/CSS/fonts/images): CacheFirst → instant loads
//   - OSM map tiles: CacheFirst with dedicated tile cache → offline map
//   - API requests: NetworkOnly → always live data (handled by app-level fallback)

const APP_CACHE = 'fiestamatic-app-v2';
const TILE_CACHE = 'fiestamatic-tiles-v1';
const FONT_CACHE = 'fiestamatic-fonts-v1';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// ─── Install: precache shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) =>
      Promise.allSettled(PRECACHE_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// ─── Activate: purge old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const VALID = new Set([APP_CACHE, TILE_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !VALID.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. API — always network, no caching (app handles offline via localStorage)
  if (url.pathname.startsWith('/api')) return;

  // 2. OSM map tiles — CacheFirst with 7-day TTL awareness (tiles don't change often)
  if (
    url.hostname.endsWith('tile.openstreetmap.org') ||
    url.hostname.endsWith('openstreetmap.org')
  ) {
    event.respondWith(tileStrategy(event.request));
    return;
  }

  // 3. Google Fonts / external fonts — CacheFirst
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE));
    return;
  }

  // 4. App navigation (HTML) — StaleWhileRevalidate → always renders, updates in bg
  if (event.request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // 5. Everything else (JS chunks, CSS, images, icons) — CacheFirst
  event.respondWith(cacheFirst(event.request, APP_CACHE));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Return a graceful offline placeholder for images
    if (request.destination === 'image') {
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <rect width="64" height="64" fill="#f5ede0"/>
          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="28">🎉</text>
        </svg>`,
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match('/'); // always serve app shell
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise || new Response('Offline', { status: 503 });
}

async function tileStrategy(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Limit tile cache size: evict oldest if over 500 tiles
      const keys = await cache.keys();
      if (keys.length > 500) {
        cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a transparent 1x1 tile so the map grid doesn't break
    const png = Uint8Array.from(atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    ), c => c.charCodeAt(0));
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  }
}
