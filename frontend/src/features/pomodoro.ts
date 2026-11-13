import {
  guardarSesionEstudio,
  listarAsignaturas,
  type Asignatura,
  type SesionEstudio
} from '../utils/db';
import { apiRequest, isAuthenticated } from '../services/api';

export type TipoSesionPomodoro = SesionEstudio['tipo'];

export interface NuevaSesionEstudio {
  asignatura: string;
  tipo: TipoSesionPomodoro;
  inicio: string;
  duracionSegundos: number;
}

export async function listarAsignaturasPomodoro(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<Asignatura[]> {
  const db = await databaseReady;
  if (!db) throw new Error('IndexedDB no está disponible.');
  return listarAsignaturas(db);
}

export async function guardarSesionPomodoro(
  databaseReady: Promise<IDBDatabase | undefined>,
  sesion: NuevaSesionEstudio
): Promise<void> {
  const db = await databaseReady;
  if (!db) throw new Error('IndexedDB no está disponible; no se pudo guardar la sesión.');

  const fin = new Date();
  const inicio = sesion.inicio || new Date(fin.getTime() - sesion.duracionSegundos * 1000).toISOString();
  const localSessionId = await guardarSesionEstudio(db, {
    asignatura: sesion.asignatura,
    tipo: sesion.tipo,
    inicio,
    fin: fin.toISOString(),
    duracionSegundos: sesion.duracionSegundos
  });

  if (isAuthenticated() && navigator.onLine && sesion.duracionSegundos >= 60) {
    const assignments = await listarAsignaturas(db);
    const selectedSubject = assignments.find(item => item.nombre === sesion.asignatura);
    if (!selectedSubject || selectedSubject.backendId) {
      const sessionDate = new Date(inicio);
      const dateValue = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}T${String(sessionDate.getHours()).padStart(2, '0')}:${String(sessionDate.getMinutes()).padStart(2, '0')}:${String(sessionDate.getSeconds()).padStart(2, '0')}`;
      const remote = await apiRequest<{ id: number }>('/study/sessions', {
        method: 'POST',
        body: JSON.stringify({
          ...(selectedSubject?.backendId ? { subjectId: selectedSubject.backendId } : {}),
          durationMinutes: Math.floor(sesion.duracionSegundos / 60),
          cycleType: sesion.tipo === 'cronometro' ? 'FREE_SESSION' : 'POMODORO_TRADITIONAL',
          sessionDate: dateValue
        })
      });
      const transaction = db.transaction('sesionesEstudio', 'readwrite');
      const store = transaction.objectStore('sesionesEstudio');
      const request = store.get(localSessionId);
      request.onsuccess = () => {
        if (request.result) store.put({ ...request.result, backendId: remote.id });
      };
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(
          transaction.error ?? new Error('No se pudo actualizar la copia de la sesión.')
        );
      });
    }
  }

  window.dispatchEvent(new Event('sesion-estudio-guardada'));
}
