export const globDirectory = 'dist';
export const globPatterns = [
  'index.html',
  'assets/**/*.css',
  'assets/**/*.js',
  'manifest.json',
  'icons/*.png',
  'lib/workbox-v7.4.1/workbox-sw.js',
  'lib/workbox-v7.4.1/workbox-core.prod.js',
  'lib/workbox-v7.4.1/workbox-precaching.prod.js',
  'lib/workbox-v7.4.1/workbox-routing.prod.js',
  'lib/workbox-v7.4.1/workbox-strategies.prod.js',
  'lib/workbox-v7.4.1/workbox-expiration.prod.js',
  'lib/workbox-v7.4.1/workbox-background-sync.prod.js'
];
export const globIgnores = [
  'node_modules/**/*',
  'workbox-config.js',
  'sw-propio.js',
  'sw.js',
  'package*.json',
  '../servidor/**/*',
  '../servidor/node_modules/**/*'
];
export const swSrc = 'sw-propio.js';
export const swDest = 'dist/sw.js';
