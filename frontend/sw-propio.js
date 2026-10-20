importScripts('./lib/workbox-v7.4.1/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: new URL('./lib/workbox-v7.4.1/', self.registration.scope).href
});

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkOnly } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { clientsClaim } = workbox.core;

precacheAndRoute(self.__WB_MANIFEST);
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
