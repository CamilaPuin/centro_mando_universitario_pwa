import {
  listarAsignaturas,
  listarClasesHorario,
  listarEntregas,
  type EntregaAcademica
} from '../utils/db';

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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

interface CalendarEvent {
  title: string;
  detail: string;
  kind: 'class' | 'delivery' | 'exam';
}

export function inicializarCalendario(databaseReady: Promise<IDBDatabase | undefined>): void {
  const grid = document.getElementById('calendar-grid');
  const periodLabel = document.getElementById('calendar-period');
  const viewSelect = document.getElementById('calendar-view') as HTMLSelectElement | null;
  const previous = document.getElementById('calendar-previous');
  const next = document.getElementById('calendar-next');
  const today = document.getElementById('calendar-today');
  if (!grid || !periodLabel || !viewSelect || !previous || !next || !today) return;
  const calendarGrid = grid;
  const calendarPeriodLabel = periodLabel;
  const calendarViewSelect = viewSelect;
  const previousButton = previous;
  const nextButton = next;
  const todayButton = today;

  let anchor = new Date();

  async function update(): Promise<void> {
    const db = await databaseReady;
    if (!db) {
      calendarGrid.replaceChildren(Object.assign(document.createElement('p'), {
        className: 'dashboard-empty',
        textContent: 'No se pudo abrir el calendario local.'
      }));
      return;
    }
    const [subjects, classes, deliveries] = await Promise.all([
      listarAsignaturas(db),
      listarClasesHorario(db),
      listarEntregas(db)
    ]);
    const subjectNames = new Map<number | undefined, string>(subjects.map(subject => [subject.id, subject.nombre]));
    const eventsByDate = new Map<string, CalendarEvent[]>();
    const addEvent = (key: string, event: CalendarEvent): void => {
      const events = eventsByDate.get(key) ?? [];
      events.push(event);
      eventsByDate.set(key, events);
    };

    const view = calendarViewSelect.value;
    let firstDate: Date;
    let numberOfDays: number;
    if (view === 'month') {
      const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      firstDate = startOfWeek(firstOfMonth);
      const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      const lastCell = startOfWeek(lastOfMonth);
      numberOfDays = Math.round((lastCell.getTime() - firstDate.getTime()) / 86_400_000) + 7;
      calendarPeriodLabel.textContent = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(anchor);
    } else {
      firstDate = startOfWeek(anchor);
      numberOfDays = 7;
      const lastDate = addDays(firstDate, 6);
      calendarPeriodLabel.textContent = `${firstDate.toLocaleDateString('es', { day: 'numeric', month: 'short' })} – ${lastDate.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }

    for (let offset = 0; offset < numberOfDays; offset++) {
      const date = addDays(firstDate, offset);
      const key = dateKey(date);
      for (const classItem of classes) {
        if (classItem.diaSemana !== date.getDay()) continue;
        addEvent(key, {
          title: subjectNames.get(classItem.asignaturaId) ?? 'Clase',
          detail: `${classItem.horaInicio}–${classItem.horaFin}${classItem.aula ? ` · ${classItem.aula}` : ''}`,
          kind: 'class'
        });
      }
      for (const delivery of deliveries) {
        if (delivery.estado === 'entregada' || !delivery.fechaEntrega) continue;
        const dueDate = new Date(delivery.fechaEntrega);
        if (Number.isNaN(dueDate.getTime()) || dateKey(dueDate) !== key) continue;
        const kind = delivery.categoria === 'examen' ? 'exam' : 'delivery';
        addEvent(key, {
          title: delivery.titulo,
          detail: `${delivery.asignatura} · ${dueDate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`,
          kind
        });
      }
    }

    calendarGrid.replaceChildren();
    calendarGrid.classList.toggle('calendar-month-view', view === 'month');
    if (view === 'month') {
      for (const dayName of WEEKDAY_NAMES) {
        calendarGrid.append(Object.assign(document.createElement('div'), {
          className: 'calendar-weekday',
          textContent: dayName
        }));
      }
    }
    for (let offset = 0; offset < numberOfDays; offset++) {
      const date = addDays(firstDate, offset);
      const cell = document.createElement('article');
      cell.className = 'calendar-day';
      if (dateKey(date) === dateKey(new Date())) cell.classList.add('is-today');
      if (view === 'month' && date.getMonth() !== anchor.getMonth()) cell.classList.add('outside-month');
      const heading = document.createElement('h3');
      heading.textContent = view === 'week'
        ? `${WEEKDAY_NAMES[offset]} ${date.getDate()}`
        : String(date.getDate());
      cell.append(heading);
      const dayEvents = eventsByDate.get(dateKey(date)) ?? [];
      for (const event of dayEvents.sort((a, b) => a.detail.localeCompare(b.detail))) {
        const item = document.createElement('div');
        item.className = `calendar-event ${event.kind}`;
        item.title = event.detail;
        const title = document.createElement('strong');
        title.textContent = event.title;
        const detail = document.createElement('small');
        detail.textContent = event.detail;
        item.append(title, detail);
        cell.append(item);
      }
      if (view === 'week' && dayEvents.length === 0) {
        cell.append(Object.assign(document.createElement('p'), {
          className: 'calendar-empty',
          textContent: 'Sin actividades'
        }));
      }
      calendarGrid.append(cell);
    }
  }

  previousButton.addEventListener('click', () => {
    anchor = calendarViewSelect.value === 'month'
      ? new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
      : addDays(anchor, -7);
    void update();
  });
  nextButton.addEventListener('click', () => {
    anchor = calendarViewSelect.value === 'month'
      ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
      : addDays(anchor, 7);
    void update();
  });
  todayButton.addEventListener('click', () => {
    anchor = new Date();
    void update();
  });
  calendarViewSelect.addEventListener('change', () => void update());
  for (const eventName of ['entregas-actualizadas', 'horario-actualizado', 'asignaturas-actualizadas']) {
    window.addEventListener(eventName, () => void update());
  }
  window.addEventListener('focus', () => void update());
  void update().catch(error => {
    console.error('No se pudo cargar el calendario:', error);
    calendarGrid.replaceChildren(Object.assign(document.createElement('p'), {
      className: 'dashboard-empty',
      textContent: 'Ocurrió un error al cargar el calendario.'
    }));
  });
}

export function renderizarSemanaExamenes(
  container: HTMLElement,
  deliveries: EntregaAcademica[],
  now = new Date()
): void {
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  const exams = deliveries
    .filter(delivery => delivery.categoria === 'examen' && delivery.estado !== 'entregada' && delivery.fechaEntrega)
    .filter(delivery => {
      const date = new Date(delivery.fechaEntrega);
      return !Number.isNaN(date.getTime()) && date >= now && date <= end;
    })
    .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega));
  container.replaceChildren();
  if (!exams.length) {
    container.append(Object.assign(document.createElement('p'), {
      className: 'dashboard-empty',
      textContent: 'No hay exámenes pendientes en los próximos siete días.'
    }));
    return;
  }
  for (const exam of exams) {
    const item = document.createElement('article');
    item.className = 'exam-week-item';
    const title = document.createElement('strong');
    title.textContent = exam.titulo;
    const date = document.createElement('span');
    date.textContent = `${exam.asignatura} · ${new Date(exam.fechaEntrega).toLocaleString('es', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    item.append(title, date);
    container.append(item);
  }
}
