import {
  listarAsignaturas,
  listarClasesHorario,
  listarEntregas
} from '../utils/db';

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export type TipoEventoCalendario = 'class' | 'delivery' | 'exam';
export type VistaCalendario = 'week' | 'month';

export interface EventoCalendario {
  titulo: string;
  detalle: string;
  tipo: TipoEventoCalendario;
}

export interface DiaCalendario {
  clave: string;
  encabezado: string;
  esHoy: boolean;
  fueraDelMes: boolean;
  eventos: EventoCalendario[];
}

export interface DatosCalendario {
  periodo: string;
  dias: DiaCalendario[];
}

function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, count: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

export async function obtenerDatosCalendario(
  databaseReady: Promise<IDBDatabase | undefined>,
  anchor: Date,
  view: VistaCalendario,
  ahora = new Date()
): Promise<DatosCalendario> {
  const db = await databaseReady;
  if (!db) throw new Error('No se pudo abrir el calendario local.');

  const [subjects, classes, deliveries] = await Promise.all([
    listarAsignaturas(db),
    listarClasesHorario(db),
    listarEntregas(db)
  ]);
  const subjectNames = new Map<number | undefined, string>(subjects.map(subject => [subject.id, subject.nombre]));
  const eventsByDate = new Map<string, EventoCalendario[]>();
  const addEvent = (key: string, event: EventoCalendario): void => {
    const events = eventsByDate.get(key) ?? [];
    events.push(event);
    eventsByDate.set(key, events);
  };

  let firstDate: Date;
  let numberOfDays: number;
  let period: string;
  if (view === 'month') {
    const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    firstDate = startOfWeek(firstOfMonth);
    const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const lastCell = startOfWeek(lastOfMonth);
    numberOfDays = Math.round((lastCell.getTime() - firstDate.getTime()) / 86_400_000) + 7;
    period = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(anchor);
  } else {
    firstDate = startOfWeek(anchor);
    numberOfDays = 7;
    const lastDate = addDays(firstDate, 6);
    period = `${firstDate.toLocaleDateString('es', { day: 'numeric', month: 'short' })} – ${lastDate.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  for (let offset = 0; offset < numberOfDays; offset++) {
    const date = addDays(firstDate, offset);
    const key = dateKey(date);
    for (const classItem of classes) {
      if (classItem.diaSemana !== date.getDay()) continue;
      addEvent(key, {
        titulo: subjectNames.get(classItem.asignaturaId) ?? 'Clase',
        detalle: `${classItem.horaInicio}–${classItem.horaFin}${classItem.aula ? ` · ${classItem.aula}` : ''}`,
        tipo: 'class'
      });
    }
    for (const delivery of deliveries) {
      if (delivery.estado === 'entregada' || !delivery.fechaEntrega) continue;
      const dueDate = new Date(delivery.fechaEntrega);
      if (Number.isNaN(dueDate.getTime()) || dateKey(dueDate) !== key) continue;
      addEvent(key, {
        titulo: delivery.titulo,
        detalle: `${delivery.asignatura} · ${dueDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`,
        tipo: delivery.categoria === 'examen' ? 'exam' : 'delivery'
      });
    }
  }

  const todayKey = dateKey(ahora);
  return {
    periodo: period,
    dias: Array.from({ length: numberOfDays }, (_, offset) => {
      const date = addDays(firstDate, offset);
      const key = dateKey(date);
      const eventos = (eventsByDate.get(key) ?? [])
        .sort((a, b) => a.detalle.localeCompare(b.detalle));
      return {
        clave: key,
        encabezado: view === 'week'
          ? `${WEEKDAY_NAMES[offset]} ${date.getDate()}`
          : String(date.getDate()),
        esHoy: key === todayKey,
        fueraDelMes: view === 'month' && date.getMonth() !== anchor.getMonth(),
        eventos
      };
    })
  };
}
