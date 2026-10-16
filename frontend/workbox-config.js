export const globDirectory = 'dist';
export const globPatterns = [
  'index.html',
  'assets/**/*.css',
  'assets/**/*.js',
  'manifest.json',
  'icons/*.png'
];
export const globIgnores = [
  'node_modules/**/*',
  'workbox-config.js',
  'package*.json'
];
export const swDest = 'dist/sw.js';
export const runtimeCaching = [
  {
    urlPattern: ({ url }) =>
      url.pathname.startsWith('/icons/') ||
      /\.(?:png|jpg|jpeg|svg|webp|avif)$/i.test(url.pathname),
    handler: 'CacheFirst',
    options: {
      cacheName: 'imagenes-centro-mando',
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60
      }
    }
  },
  {
    urlPattern: ({ url }) =>
      url.pathname.startsWith('/api/') ||
      /\/(asignaturas|tareas|entregas)(\/|$)/i.test(url.pathname),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-centro-mando',
      networkTimeoutSeconds: 3
    }
  }
];
