const CURRENT_CACHE = 'centro-mando-v2';
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
      const clon = respuesta.clone();
      caches.open(CURRENT_CACHE).then((cache) => cache.put(peticion, clon));
      return respuesta;
    });
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
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});