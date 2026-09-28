const CURRENT_CACHE = 'centro-mando-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.ts',
  '/src/style.css'
];

function cacheOnly(request) {
  return caches.match(request);
}

function networkOnly(request) {
  return fetch(request);
}

function cacheFirst(request) {
  return caches.match(request).then((inCache) => {
    if (inCache) return inCache;
    return fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CURRENT_CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    });
  });
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CURRENT_CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request));
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((inCache) => {
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CURRENT_CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    });
    return inCache || fetchPromise;
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CURRENT_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CURRENT_CACHE)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.pathname.includes('/manifest.json')) {
    event.respondWith(cacheOnly(event.request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(event.request));
  } else if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(event.request));
  } else if (url.pathname.endsWith('.css') || url.pathname.endsWith('.ts') || url.pathname.endsWith('.js')) {
    event.respondWith(staleWhileRevalidate(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});