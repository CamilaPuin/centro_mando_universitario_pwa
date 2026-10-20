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

function crearElemento(tag: string, className: string, texto: string): HTMLElement {
  const elemento = document.createElement(tag);
  elemento.className = className;
  elemento.textContent = texto;
  return elemento;
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

function mostrarEstadoVacio(lista: HTMLElement, mensaje: string): void {
  lista.replaceChildren(crearElemento('p', 'dashboard-empty', mensaje));
}

export function inicializarResumen(databaseReady: Promise<IDBDatabase | undefined>): void {
  const agenda = document.getElementById('dashboard-agenda-list');
  const agendaCount = document.getElementById('dashboard-agenda-count');
  const pendingCount = document.getElementById('dashboard-pending-count');
  const urgentCount = document.getElementById('dashboard-urgent-count');
  const studyTime = document.getElementById('dashboard-study-time');
  const priorityCount = document.getElementById('dashboard-priority-count');
  const priorityList = document.getElementById('urgent-deliveries-list');
  const classCount = document.getElementById('dashboard-class-count');
  const nextClass = document.getElementById('dashboard-next-class');
  if (!agenda || !agendaCount || !pendingCount || !urgentCount || !studyTime || !priorityCount ||
      !priorityList || !classCount || !nextClass) return;
  const agendaList = agenda;
  const agendaBadge = agendaCount;
  const pendingMetric = pendingCount;
  const urgentMetric = urgentCount;
  const studyMetric = studyTime;
  const priorityBadge = priorityCount;
  const prioritiesList = priorityList;
  const classMetric = classCount;
  const nextClassDetail = nextClass;

  classMetric.textContent = '0';
  nextClassDetail.textContent = 'Aún no has configurado un horario de clases.';
  agendaBadge.textContent = '0 clases';
  mostrarEstadoVacio(agendaList, 'Tu horario está vacío. En el módulo de asignaturas podrás registrar tus clases.');

  async function actualizar(): Promise<void> {
    const db = await databaseReady;
    if (!db) {
      pendingMetric.textContent = '—';
      urgentMetric.textContent = '—';
      priorityBadge.textContent = 'No disponible';
      mostrarEstadoVacio(prioritiesList, 'No se pudo acceder a tus entregas guardadas.');
      return;
    }

    const [entregas, asignaturas, clases, sesiones] = await Promise.all([
      listarEntregas(db),
      listarAsignaturas(db),
      listarClasesHorario(db),
      listarSesionesEstudio(db)
    ]);
    const ahora = new Date();
    const segundosEstudioHoy = sesiones.reduce((total, sesion) =>
      Number.isFinite(sesion.duracionSegundos) &&
      new Date(sesion.inicio).toDateString() === ahora.toDateString()
        ? total + sesion.duracionSegundos
        : total, 0);
    const horasEstudio = Math.floor(segundosEstudioHoy / 3600);
    const minutosEstudio = Math.floor((segundosEstudioHoy % 3600) / 60);
    studyMetric.textContent = horasEstudio
      ? `${horasEstudio} h ${minutosEstudio} min`
      : segundosEstudioHoy > 0 && minutosEstudio === 0 ? '<1 min' : `${minutosEstudio} min`;
    const clasesHoy = clases
      .filter(clase => clase.diaSemana === ahora.getDay())
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    const nombresAsignaturas = new Map(asignaturas.map(asignatura => [asignatura.id, asignatura.nombre]));
    classMetric.textContent = String(clasesHoy.length);
    agendaBadge.textContent = `${clasesHoy.length} clase${clasesHoy.length === 1 ? '' : 's'}`;

    if (clasesHoy.length === 0) {
      nextClassDetail.textContent = 'No hay clases programadas para hoy.';
      mostrarEstadoVacio(agendaList, 'No hay clases en tu horario para hoy.');
    } else {
      const siguiente = clasesHoy.find(clase => clase.horaInicio >=
        `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`);
      nextClassDetail.textContent = siguiente
        ? `Próxima: ${nombresAsignaturas.get(siguiente.asignaturaId) ?? 'Asignatura'} a las ${siguiente.horaInicio}`
        : 'Ya no tienes más clases programadas hoy.';
      const fragmentoAgenda = document.createDocumentFragment();
      for (const clase of clasesHoy) {
        const item = document.createElement('article');
        item.className = 'agenda-item';
        const horas = document.createElement('div');
        horas.className = 'agenda-time';
        horas.append(
          document.createTextNode(clase.horaInicio),
          document.createElement('br'),
          Object.assign(document.createElement('small'), { textContent: clase.horaFin })
        );
        const info = document.createElement('div');
        info.className = 'agenda-info';
        const nombre = crearElemento(
          'div',
          'agenda-subject',
          nombresAsignaturas.get(clase.asignaturaId) ?? 'Asignatura'
        );
        const ubicacion = crearElemento(
          'div',
          'agenda-desc',
          clase.aula ? `Aula: ${clase.aula}` : 'Ubicación no especificada'
        );
        info.append(nombre, ubicacion);
        item.append(horas, info);
        fragmentoAgenda.append(item);
      }
      agendaList.replaceChildren(fragmentoAgenda);
    }

    const pendientes = entregas.filter(entrega => entrega.estado !== 'entregada');
    const priorizadas = priorizarEntregas(pendientes, ahora);
    const urgentes = priorizadas.filter(({ fecha }) =>
      fecha !== undefined && fecha.getTime() - ahora.getTime() <= 48 * 3_600_000
    );

    pendingMetric.textContent = String(pendientes.length);
    urgentMetric.textContent = String(urgentes.length);
    priorityBadge.textContent = urgentes.length
      ? `${urgentes.length} urgente${urgentes.length === 1 ? '' : 's'}`
      : `${priorizadas.length} pendiente${priorizadas.length === 1 ? '' : 's'}`;

    if (priorizadas.length === 0) {
      mostrarEstadoVacio(prioritiesList, '¡Todo al día! No tienes entregas pendientes.');
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const { entrega, nivel, fecha } of priorizadas.slice(0, 6)) {
      const item = document.createElement('article');
      item.className = `delivery-item priority-item priority-${nivel}`;
      const info = document.createElement('div');
      info.className = 'priority-item-info';
      info.append(
        crearElemento('strong', 'delivery-title', entrega.titulo),
        crearElemento(
          'span',
          'delivery-meta',
          `${entrega.asignatura} · ${describirFecha(fecha, ahora)}`
        )
      );
      const badges = document.createElement('div');
      badges.className = 'priority-item-badges';
      badges.append(
        crearElemento('span', `tag tag-${nivel}`, `Importancia ${nivel}`),
        crearElemento('span', 'tag tag-info', entrega.estado === 'en-progreso' ? 'En progreso' : 'Pendiente')
      );
      item.append(info, badges);
      fragment.append(item);
    }
    prioritiesList.replaceChildren(fragment);
  }

  void actualizar().catch(error => {
    console.error('No se pudo construir el resumen del día:', error);
    pendingMetric.textContent = '—';
    urgentMetric.textContent = '—';
    priorityBadge.textContent = 'Error al cargar';
    mostrarEstadoVacio(prioritiesList, 'No se pudieron cargar las prioridades.');
  });

  const actualizarResumen = () => {
    void actualizar().catch(error => {
      console.error('No se pudo actualizar el resumen del día:', error);
      mostrarEstadoVacio(prioritiesList, 'No se pudieron actualizar las prioridades.');
    });
  };
  window.addEventListener('entregas-actualizadas', actualizarResumen);
  window.addEventListener('horario-actualizado', actualizarResumen);
  window.addEventListener('sesion-estudio-guardada', actualizarResumen);
}
