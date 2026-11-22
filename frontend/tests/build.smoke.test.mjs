import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const distDirectory = new URL('../dist/', import.meta.url);

test('production build contains the React app, PWA manifest, and service worker', () => {
  const rootMarkup = readFileSync(new URL('index.html', distDirectory), 'utf8');
  const assetsDirectory = new URL('assets/', distDirectory);
  const javascriptFiles = readdirSync(assetsDirectory).filter(file => file.endsWith('.js'));
  const applicationBundle = javascriptFiles
    .map(file => readFileSync(new URL(file, assetsDirectory), 'utf8'))
    .join('\n');
  const stylesheetFiles = readdirSync(assetsDirectory).filter(file => file.endsWith('.css'));
  const applicationStyles = stylesheetFiles
    .map(file => readFileSync(new URL(file, assetsDirectory), 'utf8'))
    .join('\n');
  const moduleSourceDirectory = new URL('../src/ui/modulos/', import.meta.url);
  const moduleSourceFiles = readdirSync(moduleSourceDirectory);

  assert.match(rootMarkup, /id="app"/);
  assert.match(rootMarkup, /manifest\.json/);
  assert.match(applicationBundle, /tab-resumen/);
  assert.match(applicationBundle, /tab-entregas/);
  assert.match(applicationBundle, /tab-pomodoro/);
  assert.match(applicationBundle, /tab-progreso/);
  assert.match(applicationBundle, /tab-notas/);
  assert.match(applicationBundle, /subject-notes-list/);
  assert.match(applicationBundle, /tab-dispositivo/);
  assert.match(applicationBundle, /exam-week-list/);
  assert.match(applicationBundle, /btn-pomo-toggle/);
  assert.match(applicationBundle, /weekly-summary/);
  assert.match(applicationBundle, /auth-screen/);
  assert.doesNotMatch(applicationBundle, /auth-dialog/);
  assert.match(applicationBundle, /Así va tu día/);
  assert.match(applicationBundle, /Mis asignaturas/);
  assert.match(applicationBundle, /Entrega o evaluación/);
  assert.match(applicationBundle, /Metas semanales/);
  assert.match(applicationBundle, /Bitácora rápida/);
  assert.match(applicationBundle, /No pudimos mostrar tu resumen/);
  assert.match(applicationBundle, /¿Eliminar este apunte de/);
  assert.match(applicationBundle, /Esta acción no se puede deshacer/);
  assert.match(applicationBundle, /¿Quieres recibir recordatorios\?/);
  assert.match(applicationBundle, /centro-mando-recordatorios-solicitud-mostrada/);
  assert.match(applicationBundle, /Ahora no/);
  assert.match(applicationBundle, /Cronómetro y Modo Pomodoro/);
  assert.match(applicationBundle, /Recordatorios de estudio/);
  assert.match(applicationBundle, /Inicia sesión o crea una cuenta/);
  assert.match(applicationBundle, /Cambiar a modo oscuro/);
  assert.match(applicationBundle, /El almacenamiento local se está actualizando/);
  assert.match(applicationBundle, /No hay suficiente espacio disponible en este dispositivo/);
  assert.match(applicationBundle, /Tomar foto/);
  assert.match(applicationBundle, /Editar perfil/);
  assert.match(applicationBundle, /Confirmar cambios/);
  assert.match(applicationBundle, /Apellido\(s\)/);
  assert.match(applicationBundle, /Cambiar contraseña/);
  assert.match(applicationBundle, /Tus cambios se guardan en este dispositivo y se sincronizan automáticamente/);
  assert.doesNotMatch(applicationBundle, /Sincronizar ahora/);
  assert.match(applicationBundle, /Recordatorios de estudio/);
  assert.doesNotMatch(applicationBundle, /delivery-grade-input|delivery-grade-max-input|goal-average|targetAverageGrade|overallGpa/);
  assert.doesNotMatch(applicationBundle, /Calificación|Nota máxima|Promedio deseado|Promedio actual|Promedio general|Evaluaciones calificadas|Meta de promedio|GPA_MASTER/);
  assert.doesNotMatch(applicationBundle, /No se pudo completar la solicitud \(código/);
  assert.doesNotMatch(applicationBundle, /con el backend/);
  assert.match(applicationStyles, /\.record-delete/);
  assert.ok(moduleSourceFiles.every(file => !file.endsWith('.ts')));
  assert.equal(existsSync(new URL('../src/ui/renderizar-aplicacion.ts', import.meta.url)), false);
  assert.ok(readFileSync(new URL('sw.js', distDirectory), 'utf8').length > 0);
});
