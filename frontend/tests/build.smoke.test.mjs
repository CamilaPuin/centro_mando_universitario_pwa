import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const distDirectory = new URL('../dist/', import.meta.url);

test('production build contains the React app, PWA manifest, and service worker', () => {
  const rootMarkup = readFileSync(new URL('index.html', distDirectory), 'utf8');
  const assetsDirectory = new URL('assets/', distDirectory);
  const javascriptFiles = readdirSync(assetsDirectory).filter(file => file.endsWith('.js'));
  const applicationBundle = javascriptFiles
    .map(file => readFileSync(new URL(file, assetsDirectory), 'utf8'))
    .join('\n');

  assert.match(rootMarkup, /id="app"/);
  assert.match(rootMarkup, /manifest\.json/);
  assert.match(applicationBundle, /tab-resumen/);
  assert.match(applicationBundle, /tab-dispositivo/);
  assert.match(applicationBundle, /Así va tu día/);
  assert.match(applicationBundle, /Cambiar a modo oscuro/);
  assert.ok(readFileSync(new URL('sw.js', distDirectory), 'utf8').length > 0);
});
