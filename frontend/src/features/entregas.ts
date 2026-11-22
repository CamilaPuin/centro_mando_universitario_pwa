import {
  guardarAsignatura,
  guardarEntregaYEncolar,
  listarAsignaturas,
  listarCambiosPendientes,
  listarEntregas,
  type Asignatura,
  type EntregaAcademica
} from '../utils/db';
import { isAuthenticated } from '../services/api';

export const EVENTO_SOLICITAR_SINCRONIZACION = 'solicitar-sincronizacion-entregas';
export const EVENTO_ESTADO_SINCRONIZACION = 'estado-sincronizacion-entregas';

export function publicarEstadoSincronizacion(mensaje: string): void {
  window.dispatchEvent(new CustomEvent<string>(EVENTO_ESTADO_SINCRONIZACION, {
    detail: mensaje
  }));
}

export interface DatosEntregas {
  asignaturas: Asignatura[];
  entregas: EntregaAcademica[];
  cambiosPendientes: number;
}

export interface FormularioEntrega {
  id?: number;
  titulo: string;
  asignaturaSeleccionada: string;
  otraAsignatura: string;
  fechaEntrega: string;
  prioridad: string;
  categoria: string;
  estado: string;
  detalle: string;
}

export interface ResultadoGuardarEntrega {
  mensaje: string;
  nuevaAsignatura: boolean;
  sincronizar: boolean;
}

function obtenerBaseDeDatos(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<IDBDatabase> {
  return databaseReady.then(db => {
    if (!db) throw new Error('IndexedDB no está disponible.');
    return db;
  });
}

export async function obtenerDatosEntregas(
  databaseReady: Promise<IDBDatabase | undefined>
): Promise<DatosEntregas> {
  const db = await obtenerBaseDeDatos(databaseReady);
  const [asignaturas, entregas, cambiosPendientes] = await Promise.all([
    listarAsignaturas(db),
    listarEntregas(db),
    listarCambiosPendientes(db)
  ]);
  return { asignaturas, entregas, cambiosPendientes: cambiosPendientes.length };
}

export async function guardarEntrega(
  databaseReady: Promise<IDBDatabase | undefined>,
  formulario: FormularioEntrega
): Promise<ResultadoGuardarEntrega> {
  const db = await obtenerBaseDeDatos(databaseReady);
  const titulo = formulario.titulo.trim();
  if (!titulo) throw new Error('Escribe el nombre de la entrega.');
  const prioridad = formulario.prioridad === 'alta' ||
    formulario.prioridad === 'media' ||
    formulario.prioridad === 'baja'
    ? formulario.prioridad
    : undefined;
  const estado = formulario.estado === 'pendiente' ||
    formulario.estado === 'en-progreso' ||
    formulario.estado === 'entregada'
    ? formulario.estado
    : undefined;
  const categoria = formulario.categoria === 'tarea' ||
    formulario.categoria === 'proyecto' ||
    formulario.categoria === 'examen' ||
    formulario.categoria === 'otro'
    ? formulario.categoria
    : undefined;
  if (!prioridad || !estado || !categoria) {
    throw new Error('Selecciona una importancia, categoría y estado válidos.');
  }

  const nombreAsignatura = formulario.asignaturaSeleccionada === '__otra__'
    ? formulario.otraAsignatura.trim()
    : formulario.asignaturaSeleccionada.trim();
  if (!nombreAsignatura) throw new Error('Selecciona una asignatura o escribe su nombre.');

  const asignaturas = await listarAsignaturas(db);
  let asignatura = asignaturas.find(item =>
    item.nombre.trim().toLocaleLowerCase() === nombreAsignatura.toLocaleLowerCase()
  );
  let nuevaAsignatura = false;
  if (!asignatura) {
    asignatura = await guardarAsignatura(db, { nombre: nombreAsignatura, syncPending: true });
    nuevaAsignatura = true;
  }

  const existente = formulario.id === undefined
    ? undefined
    : (await listarEntregas(db)).find(item => item.id === formulario.id);
  await guardarEntregaYEncolar(db, {
    ...(formulario.id === undefined ? {} : { id: formulario.id }),
    ...(existente?.backendId === undefined ? {} : { backendId: existente.backendId }),
    ...(existente?.evaluationBackendId === undefined
      ? {}
      : { evaluationBackendId: existente.evaluationBackendId }),
    ...(asignatura.id === undefined ? {} : { asignaturaId: asignatura.id }),
    titulo,
    asignatura: nombreAsignatura,
    fechaEntrega: formulario.fechaEntrega,
    prioridad,
    categoria,
    detalle: formulario.detalle.trim(),
    estado
  });

  const sincronizar = isAuthenticated() && navigator.onLine;
  const mensaje = sincronizar
    ? 'Entrega guardada. Sincronizando tus cambios…'
    : isAuthenticated()
      ? 'Entrega guardada. Se sincronizará automáticamente cuando vuelva la conexión.'
      : 'Entrega guardada. Inicia sesión para sinronizar los cambio.';

  return { mensaje, nuevaAsignatura, sincronizar };
}

export function obtenerExamenesProximos(
  entregas: EntregaAcademica[],
  ahora = new Date()
): EntregaAcademica[] {
  const fin = new Date(ahora);
  fin.setDate(fin.getDate() + 7);
  return entregas
    .filter(entrega =>
      entrega.categoria === 'examen' &&
      entrega.estado !== 'entregada' &&
      Boolean(entrega.fechaEntrega)
    )
    .filter(entrega => {
      const fecha = new Date(entrega.fechaEntrega);
      return !Number.isNaN(fecha.getTime()) && fecha >= ahora && fecha <= fin;
    })
    .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega));
}
