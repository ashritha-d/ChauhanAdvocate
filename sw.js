// Service Worker — network-first for HTML, cache-first for hashed assets
// 1783688437338 is replaced with Date.now() by the Vite build plugin
const CACHE = 'chauhanadvocate-__SW_BUILD_TS__';

// Take control immediately on install — don't wait for old SW to die
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  // Delete all old caches except the current one
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // 1. HTML navigation — ALWAYS go to network, never serve stale HTML
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => caches.match(request)) // offline fallback
    );
    return;
  }

  // 2. External resources (fonts, YouTube thumbs, CDN) — pass through
  if (url.origin !== self.location.origin) return;

  // 3. API calls — always network, never cache dynamic data
  if (url.pathname.includes('/api/')) {
    e.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // 4. Hashed Vite assets (e.g. index-Abc123.js) — cache-first for speed
  if (/\/assets\/.*-[a-f0-9]{8,}\.(js|css)(\?.*)?$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(hit => {
        if (hit) return hit;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // 5. Everything else — network-first
  e.respondWith(
    fetch(request, { cache: 'no-store' })
      .catch(() => caches.match(request))
  );
});
