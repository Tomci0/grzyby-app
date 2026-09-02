// MikroDziennik Service Worker
// Strategia: Cache-first dla zasobów statycznych, Network-first dla nawigacji

const CACHE_NAME = 'mikrodziennik-v1';
const STATIC_ASSETS = [
  '/',
  '/kalendarz',
  '/statystyki',
  '/ustawienia',
  '/manifest.json',
];

// Instalacja – pre-cache zasobów statycznych
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignoruj błędy pre-cache (zasoby mogą nie być dostępne offline)
      });
    })
  );
  self.skipWaiting();
});

// Aktywacja – usuń stare cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch – Network-first z fallbackiem do cache
self.addEventListener('fetch', (event) => {
  // Pomijaj żądania nie-GET i chrome-extension
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // API i _next/data – zawsze sieć
  if (
    event.request.url.includes('/_next/') ||
    event.request.url.includes('/api/')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Nawigacja – Network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('/'))
    );
    return;
  }

  // Pozostałe zasoby – Cache-first
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
    )
  );
});
