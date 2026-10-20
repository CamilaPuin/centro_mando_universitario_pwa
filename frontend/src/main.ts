import './style.css';
import { renderizarAplicacion } from './ui/renderizar-aplicacion';
import { inicializarPwa } from './features/pwa';
import { inicializarNavegacion } from './features/navegacion';
import { inicializarPomodoro } from './features/pomodoro';
import { inicializarNotas } from './features/notas';
import { inicializarSincronizacion } from './features/sync';
import { inicializarNotificaciones } from './features/notificaciones';
import { inicializarResumen } from './features/resumen';
import { inicializarAsignaturas } from './features/asignaturas';
import { inicializarCalendario } from './features/calendario';
import { inicializarProgreso } from './features/progreso';
import { inicializarPerfil } from './features/profile';
import { abrirBaseDeDatos } from './utils/db';

renderizarAplicacion();
inicializarPwa();
inicializarNavegacion();
const databaseReady = 'indexedDB' in window &&
  typeof window.indexedDB !== 'undefined' &&
  typeof window.indexedDB.open === 'function'
  ? abrirBaseDeDatos().catch(error => {
      console.error('No se pudo abrir el almacenamiento local:', error);
      return undefined;
    })
  : Promise.resolve(undefined);
inicializarNotas(databaseReady);
inicializarPomodoro(databaseReady);
inicializarResumen(databaseReady);
inicializarAsignaturas(databaseReady);
inicializarSincronizacion(databaseReady);
inicializarNotificaciones(databaseReady);
inicializarCalendario(databaseReady);
inicializarProgreso(databaseReady);
inicializarPerfil(databaseReady);
