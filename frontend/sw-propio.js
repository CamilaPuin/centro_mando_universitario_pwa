importScripts('./lib/workbox-v7.4.1/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: new URL('./lib/workbox-v7.4.1/', self.registration.scope).href
});

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { clientsClaim } = workbox.core;
const SYNC_TAG = 'sync-actividades-academicas';
const DATABASE_NAME = 'centro-mando-db';
const API_URL = new URL('/api/entregas', self.location.origin).href;

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
  new NetworkFirst({ cacheName: 'api-centro-mando', networkTimeoutSeconds: 3 })
);

function abrirBaseDeDatos() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in self) || typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME);
    request.onsuccess = () => {
      if (!request.result.objectStoreNames.contains('outbox')) {
        request.result.close();
        reject(new Error('La bandeja offline no está disponible en la base de datos.'));
        return;
      }
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('La base de datos está bloqueada por otra pestaña.'));
  });
}

function leerCambiosPendientes(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction('outbox', 'readonly').objectStore('outbox').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function quitarCambioPendiente(db, idCambio) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').delete(idCambio);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('No se pudo eliminar el cambio sincronizado.'));
  });
}

async function sincronizarBandeja() {
  const db = await abrirBaseDeDatos();
  try {
    const cambios = await leerCambiosPendientes(db);
    for (const cambio of cambios) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambio)
      });
      let result;
      try {
        result = await response.json();
      } catch {
        result = undefined;
      }

      if (response.status !== 200 && response.status !== 201 && result?.duplicado !== true) {
        throw new Error(`La API rechazó la sincronización (HTTP ${response.status}).`);
      }
      await quitarCambioPendiente(db, cambio.idCambio);
    }

    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (cambios.length > 0 && ventanas.length === 0) {
      await self.registration.showNotification('Entregas sincronizadas', {
        body: 'Tus cambios académicos pendientes se enviaron correctamente.',
        tag: 'sincronizacion-entregas',
        data: { url: self.registration.scope }
      });
    }
  } finally {
    db.close();
  }
}

self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(sincronizarBandeja());
  }
});

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
