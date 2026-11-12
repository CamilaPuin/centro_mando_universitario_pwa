import { useEffect } from 'react';
import { inicializarAsignaturas } from './features/asignaturas';
import { inicializarAutenticacion } from './features/auth';
import { inicializarCalendario } from './features/calendario';
import { inicializarNavegacion } from './features/navegacion';
import { inicializarNotas } from './features/notas';
import { inicializarNotificaciones } from './features/notificaciones';
import { inicializarPomodoro } from './features/pomodoro';
import { inicializarPerfil } from './features/profile';
import { inicializarProgreso } from './features/progreso';
import { inicializarPwa } from './features/pwa';
import { inicializarResumen } from './features/resumen';
import { inicializarSincronizacion } from './features/sync';
import { inicializarTema } from './features/tema';
import { abrirBaseDeDatos } from './utils/db';
import { obtenerMarkupAplicacion } from './ui/renderizar-aplicacion';

export function App() {
  useEffect(() => {
    inicializarTema();
    inicializarPwa();
    inicializarNavegacion();
    inicializarAutenticacion();

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
  }, []);

  // Mantiene el HTML existente durante la migración gradual de pantallas a JSX.
  return <div dangerouslySetInnerHTML={{ __html: obtenerMarkupAplicacion() }} />;
}
