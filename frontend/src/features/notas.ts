import {
  eliminarApunte,
  guardarApunte,
  listarAsignaturas,
  listarApuntes,
  type ApunteMateria
} from '../utils/db';
import { apiRequest, isAuthenticated } from '../services/api';

export interface DatosApuntes {
  asignaturas: string[];
  apuntes: ApunteMateria[];
}

export async function obtenerDatosApuntes(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<DatosApuntes> {
  const db = await databaseReady;
  if (!db) throw new Error('Los apuntes no están disponibles porque IndexedDB no pudo abrirse.');
  const [asignaturas, apuntes] = await Promise.all([
    listarAsignaturas(db),
    listarApuntes(db)
  ]);
  return {
    asignaturas: asignaturas.map(asignatura => asignatura.nombre),
    apuntes: apuntes.sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn))
  };
}

export async function guardarApunteMateria(
  databaseReady: Promise<IDBDatabase | undefined>,
  asignaturaNombre: string,
  contenidoOriginal: string,
  apunteId?: number
): Promise<string> {
  const db = await databaseReady;
  if (!db) throw new Error('IndexedDB no está disponible.');
  if (!asignaturaNombre) throw new Error('Selecciona una asignatura.');
  const contenido = contenidoOriginal.trim();
  if (!contenido) throw new Error('Escribe el contenido del apunte.');

  const existing = apunteId === undefined
    ? undefined
    : (await listarApuntes(db)).find(apunte => apunte.id === apunteId);
  const asignaturas = await listarAsignaturas(db);
  const asignatura = asignaturas.find(item => item.nombre === asignaturaNombre);
  const guardado = await guardarApunte(db, {
    ...(apunteId === undefined ? {} : { id: apunteId }),
    ...(existing?.backendId === undefined ? {} : { backendId: existing.backendId }),
    syncPending: true,
    ...(asignatura?.id === undefined ? {} : { asignaturaId: asignatura.id }),
    asignatura: asignaturaNombre,
    contenido,
    ...(existing ? { creadoEn: existing.creadoEn } : {})
  });

  if (isAuthenticated() && navigator.onLine && asignatura?.backendId) {
    try {
      const remoto = await apiRequest<{ id: number }>(`/subjects/${asignatura.backendId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Apunte', content: contenido })
      });
      if (existing?.backendId) {
        await apiRequest<void>(`/subjects/notes/${existing.backendId}`, { method: 'DELETE' });
      }
      await guardarApunte(db, { ...guardado, backendId: remoto.id, syncPending: false });
      return 'Apunte guardado.';
    } catch (error) {
      return `Apunte guardado. Se volverá a sincronizar automáticamente: ${error instanceof Error ? error.message : 'No se pudo completar la sincronización.'}`;
    }
  }

  return isAuthenticated()
    ? 'Apunte guardado. Se sincronizará automáticamente cuando vuelva la conexión.'
    : 'Apunte guardado en este dispositivo.';
}

export async function eliminarApunteMateria(
  databaseReady: Promise<IDBDatabase | undefined>,
  apunte: ApunteMateria
): Promise<void> {
  const db = await databaseReady;
  if (!db || apunte.id === undefined) throw new Error('No se pudo acceder al apunte.');
  if (apunte.backendId && (!isAuthenticated() || !navigator.onLine)) {
    throw new Error('Inicia sesión y recupera la conexión antes de eliminar este apunte.');
  }
  if (isAuthenticated() && navigator.onLine && apunte.backendId) {
    await apiRequest<void>(`/subjects/notes/${apunte.backendId}`, { method: 'DELETE' });
  }
  await eliminarApunte(db, apunte.id);
}
