import { apiRequest, isAuthenticated, isUserSessionActive } from '../services/api';
import {
  eliminarApunte,
  guardarApunte,
  listarAsignaturas,
  listarApuntes,
  type ApunteMateria
} from '../utils/db';

export interface DatosApuntes {
  apuntes: ApunteMateria[];
  asignaturas: string[];
}

export async function obtenerDatosApuntes(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<DatosApuntes> {
  const db = await databaseReady;
  if (!db) throw new Error('Los apuntes no están disponibles en este dispositivo.');

  const [apuntes, asignaturas] = await Promise.all([
    listarApuntes(db),
    listarAsignaturas(db)
  ]);
  return {
    apuntes: apuntes.sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn)),
    asignaturas: asignaturas.map(asignatura => asignatura.nombre)
  };
}

export async function guardarApunteLocalYSincronizar(
  databaseReady: Promise<IDBDatabase | undefined>,
  input: { id?: number; asignatura: string; contenido: string }
): Promise<string> {
  const db = await databaseReady;
  if (!db) throw new Error('Los apuntes no están disponibles en este dispositivo.');
  if (!input.asignatura) throw new Error('Selecciona una asignatura.');
  const contenido = input.contenido.trim();
  if (!contenido) throw new Error('Escribe el contenido del apunte.');

  const existentes = await listarApuntes(db);
  const existing = input.id === undefined
    ? undefined
    : existentes.find(apunte => apunte.id === input.id);
  const asignaturas = await listarAsignaturas(db);
  const asignatura = asignaturas.find(item => item.nombre === input.asignatura);
  const saved = await guardarApunte(db, {
    ...(input.id === undefined ? {} : { id: input.id }),
    ...(existing?.backendId === undefined ? {} : { backendId: existing.backendId }),
    syncPending: true,
    ...(asignatura?.id === undefined ? {} : { asignaturaId: asignatura.id }),
    asignatura: input.asignatura,
    contenido,
    ...(existing ? { creadoEn: existing.creadoEn } : {})
  });

  if (isAuthenticated() && navigator.onLine && asignatura?.backendId) {
    try {
      const remote = await apiRequest<{ id: number }>(`/subjects/${asignatura.backendId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Apunte', content: contenido })
      });
      if (existing?.backendId) {
        await apiRequest<void>(`/subjects/notes/${existing.backendId}`, { method: 'DELETE' });
      }
      await guardarApunte(db, { ...saved, backendId: remote.id, syncPending: false });
      return 'Apunte guardado.';
    } catch (error) {
      return `Apunte guardado. Se volverá a sincronizar automáticamente: ${
        error instanceof Error ? error.message : 'No se pudo completar la sincronización.'
      }`;
    }
  }

  return isUserSessionActive()
    ? 'Apunte guardado. Se sincronizará automáticamente cuando vuelva la conexión.'
    : 'Apunte guardado en este dispositivo.';
}

export async function eliminarApunteLocalYSincronizar(
  databaseReady: Promise<IDBDatabase | undefined>,
  apunte: ApunteMateria
): Promise<void> {
  const db = await databaseReady;
  if (!db || apunte.id === undefined) throw new Error('No se pudo acceder al apunte.');
  if (apunte.backendId && (!isAuthenticated() || !navigator.onLine)) {
    throw new Error(isUserSessionActive()
      ? 'Recupera la conexión antes de eliminar este apunte sincronizado.'
      : 'Inicia sesión y recupera la conexión antes de eliminar este apunte.');
  }
  if (isAuthenticated() && navigator.onLine && apunte.backendId) {
    await apiRequest<void>(`/subjects/notes/${apunte.backendId}`, { method: 'DELETE' });
  }
  await eliminarApunte(db, apunte.id);
}
