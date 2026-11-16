import {
  eliminarAsignatura,
  eliminarClaseHorario,
  guardarAsignatura,
  guardarClaseHorario,
  listarAsignaturas,
  listarClasesHorario,
  type Asignatura,
  type ClaseHorario
} from '../utils/db';
import { apiRequest, isAuthenticated, isUserSessionActive } from '../services/api';

const DIAS_BACKEND = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export interface DatosAsignaturas {
  asignaturas: Asignatura[];
  clases: ClaseHorario[];
}

export interface DatosClase {
  id?: number;
  asignaturaId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

async function obtenerBaseDeDatos(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<IDBDatabase> {
  const db = await databaseReady;
  if (!db) throw new Error('IndexedDB no está disponible.');
  return db;
}

export async function obtenerDatosAsignaturas(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<DatosAsignaturas> {
  const db = await obtenerBaseDeDatos(databaseReady);
  const [asignaturas, clases] = await Promise.all([
    listarAsignaturas(db),
    listarClasesHorario(db)
  ]);
  return { asignaturas, clases };
}

export async function guardarAsignaturaLocalYSincronizar(
  databaseReady: Promise<IDBDatabase | undefined>,
  datos: { id?: number; nombre: string }
): Promise<string> {
  const db = await obtenerBaseDeDatos(databaseReady);
  const nombre = datos.nombre.trim();
  if (!nombre) throw new Error('Escribe el nombre de la asignatura.');

  await guardarAsignatura(db, {
    ...(datos.id === undefined ? {} : { id: datos.id }),
    nombre,
    syncPending: true
  });
  const asignaturas = await listarAsignaturas(db);
  const guardada = asignaturas.find(item => item.nombre === nombre);
  if (guardada && isAuthenticated() && navigator.onLine) {
    try {
      const payload = { name: nombre, teacher: '', schedule: '', credits: 3 };
      const response = guardada.backendId
        ? await apiRequest<{ id: number }>(`/subjects/${guardada.backendId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await apiRequest<{ id: number }>('/subjects', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
      await guardarAsignatura(db, { ...guardada, backendId: response.id, syncPending: false });
      return 'Asignatura guardada.';
    } catch (error) {
      return `Asignatura guardada. Se volverá a sincronizar automáticamente: ${
        error instanceof Error ? error.message : 'No se pudo completar la sincronización.'
      }`;
    }
  }

  return isUserSessionActive()
    ? 'Asignatura guardada. Se sincronizará automáticamente cuando vuelva la conexión.'
    : 'Asignatura guardada en este dispositivo.';
}

export async function eliminarAsignaturaLocalYSincronizar(
  databaseReady: Promise<IDBDatabase | undefined>,
  asignatura: Asignatura
): Promise<void> {
  const db = await obtenerBaseDeDatos(databaseReady);
  if (asignatura.id === undefined) throw new Error('No se pudo abrir el almacenamiento local.');
  if (asignatura.backendId && (!isAuthenticated() || !navigator.onLine)) {
    throw new Error(isUserSessionActive()
      ? 'Recupera la conexión para eliminar esta asignatura sincronizada.'
      : 'Inicia sesión y recupera la conexión antes de eliminar esta asignatura sincronizada.');
  }
  if (isAuthenticated() && navigator.onLine && asignatura.backendId) {
    await apiRequest<void>(`/subjects/${asignatura.backendId}`, { method: 'DELETE' });
  }
  await eliminarAsignatura(db, asignatura.id);
}

export async function guardarClaseLocalYSincronizar(
  databaseReady: Promise<IDBDatabase | undefined>,
  datos: DatosClase
): Promise<string> {
  const db = await obtenerBaseDeDatos(databaseReady);
  if (!Number.isInteger(datos.asignaturaId) || datos.asignaturaId <= 0) {
    throw new Error('Selecciona una asignatura.');
  }
  if (!Number.isInteger(datos.diaSemana) || datos.diaSemana < 0 || datos.diaSemana > 6) {
    throw new Error('Selecciona un día válido.');
  }
  if (!datos.horaInicio || !datos.horaFin || datos.horaInicio >= datos.horaFin) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
  }

  const clases = await listarClasesHorario(db);
  const cruza = clases.some(clase =>
    clase.id !== datos.id &&
    clase.diaSemana === datos.diaSemana &&
    datos.horaInicio < clase.horaFin &&
    datos.horaFin > clase.horaInicio
  );
  if (cruza) throw new Error('Ese horario se cruza con otra clase del mismo día.');

  const asignaturaSeleccionada = (await listarAsignaturas(db))
    .find(asignatura => asignatura.id === datos.asignaturaId);
  if (!asignaturaSeleccionada) throw new Error('No se encontró la asignatura seleccionada.');

  const claseGuardada = await guardarClaseHorario(db, {
    ...(datos.id === undefined ? {} : { id: datos.id }),
    asignaturaId: datos.asignaturaId,
    diaSemana: datos.diaSemana,
    horaInicio: datos.horaInicio,
    horaFin: datos.horaFin,
    aula: datos.aula.trim(),
    syncPending: true
  });

  if (!isAuthenticated() || !navigator.onLine) {
    return isUserSessionActive()
      ? 'Horario guardado. Se sincronizará automáticamente cuando vuelva la conexión.'
      : 'Horario guardado en este dispositivo.';
  }
  if (!asignaturaSeleccionada.backendId) {
    return 'Horario guardado. Se sincronizará junto con la asignatura al recuperar la conexión.';
  }

  try {
    const payload = {
      subjectId: asignaturaSeleccionada.backendId,
      dayOfWeek: DIAS_BACKEND[datos.diaSemana],
      startTime: datos.horaInicio,
      endTime: datos.horaFin,
      location: datos.aula.trim()
    };
    const response = claseGuardada.backendId
      ? await apiRequest<{ id: number }>(`/calendar/class-schedules/${claseGuardada.backendId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      : await apiRequest<{ id: number }>('/calendar/class-schedules', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
    await guardarClaseHorario(db, { ...claseGuardada, backendId: response.id, syncPending: false });
    return 'Horario guardado.';
  } catch (error) {
    return `Horario guardado. Se volverá a sincronizar automáticamente: ${
      error instanceof Error ? error.message : 'No se pudo completar la sincronización.'
    }`;
  }
}

export async function eliminarClaseLocalYSincronizar(
  databaseReady: Promise<IDBDatabase | undefined>,
  clase: ClaseHorario
): Promise<void> {
  const db = await obtenerBaseDeDatos(databaseReady);
  if (clase.id === undefined) throw new Error('No se pudo abrir el almacenamiento local.');
  if (clase.backendId && (!isAuthenticated() || !navigator.onLine)) {
    throw new Error(isUserSessionActive()
      ? 'Recupera la conexión para eliminar esta clase sincronizada.'
      : 'Inicia sesión y recupera la conexión antes de eliminar esta clase sincronizada.');
  }
  if (isAuthenticated() && navigator.onLine && clase.backendId) {
    await apiRequest<void>(`/calendar/class-schedules/${clase.backendId}`, { method: 'DELETE' });
  }
  await eliminarClaseHorario(db, clase.id);
}

export function notificarAsignaturasActualizadas(): void {
  window.dispatchEvent(new Event('asignaturas-actualizadas'));
}

export function notificarHorarioActualizado(): void {
  window.dispatchEvent(new Event('horario-actualizado'));
}
