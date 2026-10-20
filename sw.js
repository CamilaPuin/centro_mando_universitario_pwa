importScripts('./lib/workbox-v7.4.1/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: new URL('./lib/workbox-v7.4.1/', self.registration.scope).href
});

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkOnly } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { clientsClaim } = workbox.core;

precacheAndRoute([{"revision":"e638f4ed4bdc06decbf0c26649bb0a1c","url":"index.html"},{"revision":"f0e4d2b5c253742ebe5a5cb783939b80","url":"assets/index-BMPVg00A.css"},{"revision":"d5bf44822c2a3f3b705158ac438d4bf9","url":"assets/index-CeH6aUSE.js"},{"revision":"9ed91d97049a884ccafed0a7a9aa1e96","url":"manifest.json"},{"revision":"e2270cb84e3511e3b8502e72dabc6f79","url":"icons/icon-512.png"},{"revision":"8ac8848cabc920612e0d9eaa1c0b9dc6","url":"icons/icon-192.png"},{"revision":"4a5a8c870b374dd6e76275c2d968e1ea","url":"lib/workbox-v7.4.1/workbox-sw.js"},{"revision":"317fc89483d1f033fd1a9f123546170c","url":"lib/workbox-v7.4.1/workbox-core.prod.js"},{"revision":"2b856c81714a9f5ff2f7187caac1fd00","url":"lib/workbox-v7.4.1/workbox-precaching.prod.js"},{"revision":"02c6cad79d72343ab97475f26c4d76ec","url":"lib/workbox-v7.4.1/workbox-routing.prod.js"},{"revision":"f24892c99eeb13fe411298ccf782b6b0","url":"lib/workbox-v7.4.1/workbox-strategies.prod.js"},{"revision":"9afc7d7e8fbce3cde88a719439947c5c","url":"lib/workbox-v7.4.1/workbox-expiration.prod.js"},{"revision":"4620a4e4197b51215e01fe55de7e8e68","url":"lib/workbox-v7.4.1/workbox-background-sync.prod.js"}]);
cleanupOutdatedCaches();
clientsClaim();

registerRoute(
  ({ url }) => url.origin === self.location.origin &&
    (url.pathname.includes('/icons/') || /\.(?:png|jpe?g|svg|webp|avif)$/i.test(url.pathname)),
  new CacheFirst({
    cacheName: 'imagenes-centro-mando',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
);

registerRoute(
  ({ url, request }) => url.origin === self.location.origin &&
    request.method === 'GET' && url.pathname.includes('/api/'),
  new NetworkOnly()
);

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {};
    if (event.data) {
      const text = event.data.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { body: text };
      }
    }

    await self.registration.showNotification(payload.title || 'Recordatorio académico', {
      body: payload.body || 'Tienes una actualización en tu Centro de Mando.',
      tag: payload.tag || 'recordatorio-academico',
      data: { url: payload.data?.url || self.registration.scope },
      icon: new URL('icons/icon-192.png', self.registration.scope).href,
      badge: new URL('icons/icon-192.png', self.registration.scope).href
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL(event.notification.data?.url || self.registration.scope, self.location.origin);
    const safeTarget = target.origin === self.location.origin ? target.href : self.registration.scope;
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existente = ventanas.find(client => client.url.startsWith(self.registration.scope));
    if (existente) {
      if ('navigate' in existente && existente.url !== safeTarget) {
        await existente.navigate(safeTarget);
      }
      await existente.focus();
      return;
    }
    await self.clients.openWindow(safeTarget);
  })());
});
