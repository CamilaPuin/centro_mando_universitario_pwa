const CURRENT_CACHE = 'centro-mando-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.ts',
  '/src/style.css'
];

function cacheOnly(peticion) {
  return caches.match(peticion);
}

function networkOnly(peticion) {
  return fetch(peticion);
}

function cacheFirst(peticion) {
  return caches.match(peticion).then((enCache) => {
    if (enCache) return enCache;
    return fetch(peticion).then((respuesta) => {
      if (respuesta.ok) {
        const clon = respuesta.clone();
        caches.open(CURRENT_CACHE).then((cache) => cache.put(peticion, clon));
      }
      return respuesta;
    });
  });
}

function networkFirst(peticion) {
  return fetch(peticion)
    .then((respuesta) => {
      if (respuesta.ok) {
        const clon = respuesta.clone();
        caches.open(CURRENT_CACHE).then((cache) => cache.put(peticion, clon));
      }
      return respuesta;
    })
    .catch(() => caches.match(peticion));
}

function staleWhileRevalidate(peticion) {
  return caches.match(peticion).then((enCache) => {
    const promesaRed = fetch(peticion).then((respuesta) => {
      if (respuesta.ok) {
        const clon = respuesta.clone();
        caches.open(CURRENT_CACHE).then((cache) => cache.put(peticion, clon));
      }
      return respuesta;
    });
    return enCache || promesaRed;
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