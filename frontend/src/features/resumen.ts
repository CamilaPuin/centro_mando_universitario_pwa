import {
  listarAsignaturas,
  listarClasesHorario,
  listarEntregas,
  listarSesionesEstudio,
  type EntregaAcademica
} from '../utils/db';

type NivelPrioridad = 'baja' | 'media' | 'alta';

interface EntregaPriorizada {
  entrega: EntregaAcademica;
  nivel: NivelPrioridad;
  puntaje: number;
  fecha: Date | undefined;
}

export interface ClaseResumen {
  clave: string;
  horaInicio: string;
  horaFin: string;
  asignatura: string;
  ubicacion: string;
}

export interface EntregaResumen {
  clave: string;
  titulo: string;
  asignatura: string;
  fechaLimite: string;
  prioridad: NivelPrioridad;
  estado: string;
}

export interface ResumenDia {
  cantidadClases: number;
  siguienteClase: string;
  agenda: ClaseResumen[];
  cantidadPendientes: number;
  cantidadUrgentes: number;
  tiempoEstudio: string;
  etiquetaPrioridades: string;
  prioridades: EntregaResumen[];
}

const NIVEL_IMPORTANCIA: Record<NivelPrioridad, number> = {
  baja: 10,
  media: 20,
  alta: 30
};

function calcularUrgencia(fecha: Date | undefined, ahora: Date): number {
  if (!fecha) return 0;
  const horasRestantes = (fecha.getTime() - ahora.getTime()) / 3_600_000;
  if (horasRestantes < 0) return 100;
  if (horasRestantes <= 24) return 90;
  if (horasRestantes <= 48) return 75;
  if (horasRestantes <= 168) return 50;
  return 25;
}

export function priorizarEntregas(
  entregas: EntregaAcademica[],
  ahora = new Date()
): EntregaPriorizada[] {
  return entregas
    .filter(entrega => entrega.estado !== 'entregada')
    .map(entrega => {
      const fecha = entrega.fechaEntrega ? new Date(entrega.fechaEntrega) : undefined;
      const fechaValida = fecha && !Number.isNaN(fecha.getTime()) ? fecha : undefined;
      const nivel = entrega.prioridad ?? 'media';
      return {
        entrega,
        nivel,
        puntaje: calcularUrgencia(fechaValida, ahora) + NIVEL_IMPORTANCIA[nivel],
        fecha: fechaValida
      };
    })
    .sort((a, b) =>
      b.puntaje - a.puntaje ||
      (a.fecha?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.fecha?.getTime() ?? Number.MAX_SAFE_INTEGER)
    );
}

function describirFecha(fecha: Date | undefined, ahora: Date): string {
  if (!fecha) return 'Sin fecha límite';
  const fechaLegible = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(fecha);
  const horas = (fecha.getTime() - ahora.getTime()) / 3_600_000;
  if (horas < 0) return `Vencida: ${fechaLegible}`;
  if (horas < 24) return `Vence hoy, ${fechaLegible}`;
  if (horas < 48) return `Vence mañana, ${fechaLegible}`;
  return `Vence ${fechaLegible}`;
}

function describirTiempoEstudio(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  if (horas) return `${horas} h ${minutos} min`;
  if (segundos > 0 && minutos === 0) return '<1 min';
  return `${minutos} min`;
}

export async function obtenerResumenDia(
  databaseReady: Promise<IDBDatabase | undefined>,
  ahora = new Date()
): Promise<ResumenDia> {
  const db = await databaseReady;
  if (!db) throw new Error('No se pudo acceder al almacenamiento local.');

  const [entregas, asignaturas, clases, sesiones] = await Promise.all([
    listarEntregas(db),
    listarAsignaturas(db),
    listarClasesHorario(db),
    listarSesionesEstudio(db)
  ]);
  const segundosEstudio = sesiones.reduce((total, sesion) =>
    Number.isFinite(sesion.duracionSegundos) &&
    new Date(sesion.inicio).toDateString() === ahora.toDateString()
      ? total + sesion.duracionSegundos
      : total, 0);
  const clasesHoy = clases
    .filter(clase => clase.diaSemana === ahora.getDay())
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  const nombresAsignaturas = new Map(asignaturas.map(asignatura => [asignatura.id, asignatura.nombre]));
  const siguiente = clasesHoy.find(clase => clase.horaInicio >=
    `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`);
  const pendientes = entregas.filter(entrega => entrega.estado !== 'entregada');
  const priorizadas = priorizarEntregas(pendientes, ahora);
  const urgentes = priorizadas.filter(({ fecha }) =>
    fecha !== undefined && fecha.getTime() - ahora.getTime() <= 48 * 3_600_000
  );

  return {
    cantidadClases: clasesHoy.length,
    siguienteClase: clasesHoy.length === 0
      ? 'No hay clases programadas para hoy.'
      : siguiente
        ? `Próxima: ${nombresAsignaturas.get(siguiente.asignaturaId) ?? 'Asignatura'} a las ${siguiente.horaInicio}`
        : 'Ya no tienes más clases programadas hoy.',
    agenda: clasesHoy.map(clase => ({
      clave: String(clase.id ?? `${clase.asignaturaId}-${clase.horaInicio}-${clase.horaFin}`),
      horaInicio: clase.horaInicio,
      horaFin: clase.horaFin,
      asignatura: nombresAsignaturas.get(clase.asignaturaId) ?? 'Asignatura',
      ubicacion: clase.aula ? `Aula: ${clase.aula}` : 'Ubicación no especificada'
    })),
    cantidadPendientes: pendientes.length,
    cantidadUrgentes: urgentes.length,
    tiempoEstudio: describirTiempoEstudio(segundosEstudio),
    etiquetaPrioridades: urgentes.length
      ? `${urgentes.length} urgente${urgentes.length === 1 ? '' : 's'}`
      : `${priorizadas.length} pendiente${priorizadas.length === 1 ? '' : 's'}`,
    prioridades: priorizadas.slice(0, 6).map(({ entrega, nivel, fecha }) => ({
      clave: String(entrega.id ?? `${entrega.titulo}-${entrega.asignatura}`),
      titulo: entrega.titulo,
      asignatura: entrega.asignatura,
      fechaLimite: describirFecha(fecha, ahora),
      prioridad: nivel,
      estado: entrega.estado === 'en-progreso' ? 'En progreso' : 'Pendiente'
    }))
  };
}
