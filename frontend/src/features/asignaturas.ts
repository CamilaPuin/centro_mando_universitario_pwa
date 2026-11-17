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
import { apiRequest, isAuthenticated } from '../services/api';

const DIAS_API = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
];

export interface DatosAsignaturas {
  asignaturas: Asignatura[];
  clases: ClaseHorario[];
}

export interface DatosNuevaClase {
  asignaturaId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  aula: string;
  id?: number;
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

export async function guardarAsignaturaMateria(
  databaseReady: Promise<IDBDatabase | undefined>,
  nombreOriginal: string,
  id?: number
): Promise<string> {
  const db = await obtenerBaseDeDatos(databaseReady);
  const nombre = nombreOriginal.trim();
  if (!nombre) throw new Error('Escribe el nombre de la asignatura.');
  const existing = id === undefined
    ? undefined
    : (await listarAsignaturas(db)).find(asignatura => asignatura.id === id);
  const guardada = await guardarAsignatura(db, {
    ...(id === undefined ? {} : { id }),
    ...(existing?.backendId === undefined ? {} : { backendId: existing.backendId }),
    ...(existing ? { creadoEn: existing.creadoEn } : {}),
    nombre,
    syncPending: true
  });

  if (isAuthenticated() && navigator.onLine) {
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
      return `Asignatura guardada. Se volverá a sincronizar automáticamente: ${error instanceof Error ? error.message : 'No se pudo completar la sincronización.'}`;
    }
  }

  return isAuthenticated()
    ? 'Asignatura guardada. Se sincronizará automáticamente cuando vuelva la conexión.'
    : 'Asignatura guardada en este dispositivo.';
}

export async function eliminarAsignaturaMateria(
  databaseReady: Promise<IDBDatabase | undefined>,
  asignatura: Asignatura
): Promise<string> {
  const db = await obtenerBaseDeDatos(databaseReady);
  if (asignatura.id === undefined) throw new Error('No se pudo abrir el almacenamiento local.');
  if (asignatura.backendId && (!isAuthenticated() || !navigator.onLine)) {
    throw new Error('Inicia sesión y recupera la conexión antes de eliminar esta asignatura sincronizada.');
  }
  if (isAuthenticated() && navigator.onLine && asignatura.backendId) {
    await apiRequest<void>(`/subjects/${asignatura.backendId}`, { method: 'DELETE' });
  }
  await eliminarAsignatura(db, asignatura.id);
  return `Se eliminó ${asignatura.nombre}.`;
}

export async function guardarClaseMateria(
  databaseReady: Promise<IDBDatabase | undefined>,
  datos: DatosNuevaClase
): Promise<string> {
  const db = await obtenerBaseDeDatos(databaseReady);
  const { asignaturaId, diaSemana, horaInicio, horaFin, aula, id } = datos;
  if (!Number.isInteger(asignaturaId)) throw new Error('Selecciona una asignatura.');
  if (!Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6) {
    throw new Error('Selecciona un día válido.');
  }
  if (!horaInicio || !horaFin || horaInicio >= horaFin) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
  }

  const [clases, asignaturas] = await Promise.all([
    listarClasesHorario(db),
    listarAsignaturas(db)
  ]);
  const cruza = clases.some(clase =>
    clase.id !== id &&
    clase.diaSemana === diaSemana &&
    horaInicio < clase.horaFin &&
    horaFin > clase.horaInicio
  );
  if (cruza) throw new Error('Ese horario se cruza con otra clase del mismo día.');

  const asignatura = asignaturas.find(item => item.id === asignaturaId);
  if (!asignatura) throw new Error('No se encontró la asignatura seleccionada.');
  const existing = id === undefined ? undefined : clases.find(clase => clase.id === id);
  const guardada = await guardarClaseHorario(db, {
    ...(id === undefined ? {} : { id }),
    ...(existing?.backendId === undefined ? {} : { backendId: existing.backendId }),
    asignaturaId,
    diaSemana,
    horaInicio,
    horaFin,
    aula: aula.trim(),
    syncPending: true
  });

  if (isAuthenticated() && navigator.onLine) {
    if (!asignatura.backendId) {
      return 'Horario guardado. Se sincronizará junto con la asignatura al recuperar la conexión.';
    }
    try {
      const payload = {
        subjectId: asignatura.backendId,
        dayOfWeek: DIAS_API[diaSemana],
        startTime: horaInicio,
        endTime: horaFin,
        location: aula.trim()
      };
      const response = guardada.backendId
        ? await apiRequest<{ id: number }>(`/calendar/class-schedules/${guardada.backendId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })
        : await apiRequest<{ id: number }>('/calendar/class-schedules', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
      await guardarClaseHorario(db, { ...guardada, backendId: response.id, syncPending: false });
      return 'Horario guardado.';
    } catch (error) {
      return `Horario guardado. Se volverá a sincronizar automáticamente: ${error instanceof Error ? error.message : 'No se pudo completar la sincronización.'}`;
    }
  }

  return isAuthenticated()
    ? 'Horario guardado. Se sincronizará automáticamente cuando vuelva la conexión.'
    : 'Horario guardado en este dispositivo.';
}

export async function eliminarClaseMateria(
  databaseReady: Promise<IDBDatabase | undefined>,
  clase: ClaseHorario
): Promise<void> {
  const db = await obtenerBaseDeDatos(databaseReady);
  if (clase.id === undefined) throw new Error('No se pudo abrir el almacenamiento local.');
  if (clase.backendId && (!isAuthenticated() || !navigator.onLine)) {
    throw new Error('Inicia sesión y recupera la conexión antes de eliminar esta clase sincronizada.');
  }
  if (isAuthenticated() && navigator.onLine && clase.backendId) {
    await apiRequest<void>(`/calendar/class-schedules/${clase.backendId}`, { method: 'DELETE' });
  }
  await eliminarClaseHorario(db, clase.id);
}
