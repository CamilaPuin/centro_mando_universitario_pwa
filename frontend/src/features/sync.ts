import {
  guardarEntregaYEncolar,
  listarCambiosPendientes,
  listarEntregas,
  quitarCambioPendiente,
  type EntregaAcademica
} from '../utils/db';
import { API_BASE_URL, API_SYNC_ENABLED } from '../config';
import { renderizarSemanaExamenes } from './calendario';

const SYNC_TAG = 'sync-actividades-academicas';

interface SyncCapableRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

export function inicializarSincronizacion(
  databaseReady: Promise<IDBDatabase | undefined>
): void {
  const form = document.getElementById('delivery-form') as HTMLFormElement | null;
  const idInput = document.getElementById('delivery-id') as HTMLInputElement | null;
  const titleInput = document.getElementById('delivery-title-input') as HTMLInputElement | null;
  const subjectInput = document.getElementById('delivery-subject-input') as HTMLInputElement | null;
  const dateInput = document.getElementById('delivery-date-input') as HTMLInputElement | null;
  const priorityInput = document.getElementById('delivery-priority-input') as HTMLSelectElement | null;
  const deliveryStatusInput = document.getElementById('delivery-status-input') as HTMLSelectElement | null;
  const categoryInput = document.getElementById('delivery-category-input') as HTMLSelectElement | null;
  const gradeInput = document.getElementById('delivery-grade-input') as HTMLInputElement | null;
  const gradeMaxInput = document.getElementById('delivery-grade-max-input') as HTMLInputElement | null;
  const detailInput = document.getElementById('delivery-detail-input') as HTMLTextAreaElement | null;
  const status = document.getElementById('delivery-sync-status');
  const list = document.getElementById('local-deliveries');
  const cancelButton = document.getElementById('delivery-cancel-edit') as HTMLButtonElement | null;
  const examWeekList = document.getElementById('exam-week-list');
  if (!form || !idInput || !titleInput || !subjectInput || !dateInput || !priorityInput ||
      !deliveryStatusInput || !categoryInput || !gradeInput || !gradeMaxInput ||
      !detailInput || !status || !list || !examWeekList) {
    return;
  }
  const deliveryForm = form;
  const deliveryIdInput = idInput;
  const deliveryTitleInput = titleInput;
  const deliverySubjectInput = subjectInput;
  const deliveryDateInput = dateInput;
  const deliveryPriorityInput = priorityInput;
  const deliveryStatusSelect = deliveryStatusInput;
  const deliveryCategorySelect = categoryInput;
  const deliveryGradeInput = gradeInput;
  const deliveryGradeMaxInput = gradeMaxInput;
  const deliveryDetailInput = detailInput;
  const syncStatus = status;
  const deliveryList = list;
  const examWeekContainer = examWeekList;
  const boardColumns = {
    pendiente: document.getElementById('col-pending'),
    'en-progreso': document.getElementById('col-progress'),
    entregada: document.getElementById('col-done')
  };
  const boardCounts = {
    pendiente: document.getElementById('count-pending'),
    'en-progreso': document.getElementById('count-progress'),
    entregada: document.getElementById('count-done')
  };

  function editarEntrega(entrega: EntregaAcademica): void {
    deliveryIdInput.value = String(entrega.id);
    deliveryTitleInput.value = entrega.titulo;
    deliverySubjectInput.value = entrega.asignatura;
    deliveryDateInput.value = entrega.fechaEntrega;
    deliveryPriorityInput.value = entrega.prioridad ?? 'media';
    deliveryStatusSelect.value = entrega.estado;
    deliveryCategorySelect.value = entrega.categoria ?? 'tarea';
    deliveryGradeInput.value = entrega.calificacion === undefined ? '' : String(entrega.calificacion);
    deliveryGradeMaxInput.value = String(entrega.notaMaxima ?? 5);
    deliveryDetailInput.value = entrega.detalle;
    deliveryForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent = 'Guardar cambios offline';
    if (cancelButton) cancelButton.hidden = false;
    deliveryTitleInput.focus();
  }

  function actualizarTablero(entregas: EntregaAcademica[]): void {
    const grupos: Record<EntregaAcademica['estado'], EntregaAcademica[]> = {
      pendiente: [],
      'en-progreso': [],
      entregada: []
    };
    for (const entrega of entregas) grupos[entrega.estado].push(entrega);

    for (const estado of Object.keys(grupos) as EntregaAcademica['estado'][]) {
      const columna = boardColumns[estado];
      const contador = boardCounts[estado];
      if (!columna || !contador) continue;
      contador.textContent = String(grupos[estado].length);
      columna.replaceChildren();
      if (grupos[estado].length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'dashboard-empty';
        vacio.textContent = 'Sin registros en esta categoría.';
        columna.append(vacio);
        continue;
      }

      for (const entrega of grupos[estado]) {
        const tarjeta = document.createElement('article');
        tarjeta.className = `kanban-card${estado === 'entregada' ? ' delivered' : ''}`;
        const title = document.createElement('h3');
        title.textContent = entrega.titulo;
        const detail = document.createElement('p');
        detail.textContent = `${entrega.asignatura}${entrega.fechaEntrega ? ` · ${new Date(entrega.fechaEntrega).toLocaleString()}` : ''}`;
        const priority = document.createElement('p');
        const grade = entrega.calificacion === undefined
          ? 'Sin calificación'
          : `Calificación: ${entrega.calificacion} / ${entrega.notaMaxima ?? 5}`;
        priority.textContent = `${entrega.categoria ?? 'tarea'} · Importancia: ${entrega.prioridad ?? 'media'} · ${grade}`;
        const edit = document.createElement('button');
        edit.className = 'btn btn-load';
        edit.type = 'button';
        edit.textContent = 'Editar';
        edit.addEventListener('click', () => editarEntrega(entrega));
        tarjeta.append(title, detail, priority, edit);
        columna.append(tarjeta);
      }
    }
    renderizarSemanaExamenes(examWeekContainer, entregas);
  }

  function mostrarEntrega(entrega: EntregaAcademica): void {
    let card = deliveryList.querySelector<HTMLElement>(`[data-local-delivery-id="${entrega.id}"]`);
    if (!card) {
      card = document.createElement('article');
      card.className = 'kanban-card local-delivery-card';
      card.dataset.localDeliveryId = String(entrega.id);
      deliveryList.append(card);
    }
    card.replaceChildren();
    const title = document.createElement('h3');
    title.textContent = entrega.titulo;
    const summary = document.createElement('p');
    summary.textContent = `${entrega.asignatura} • ${entrega.categoria ?? 'tarea'} • ${entrega.fechaEntrega ? new Date(entrega.fechaEntrega).toLocaleString() : 'Sin fecha'}${entrega.calificacion === undefined ? '' : ` • ${entrega.calificacion}/${entrega.notaMaxima ?? 5}`}`;
    const detail = document.createElement('p');
    detail.textContent = entrega.detalle;
    const edit = document.createElement('button');
    edit.className = 'btn btn-load';
    edit.type = 'button';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => editarEntrega(entrega));
    card.append(title, summary, detail, edit);
  }

  async function sincronizarPendientes(db: IDBDatabase): Promise<void> {
    const cambios = await listarCambiosPendientes(db);
    for (const cambio of cambios) {
      const response = await fetch(`${API_BASE_URL}/entregas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambio)
      });
      let resultado: { duplicado?: boolean } = {};
      try {
        resultado = await response.json() as { duplicado?: boolean };
      } catch {
        resultado = {};
      }
      if (response.status !== 200 && response.status !== 201 && resultado.duplicado !== true) {
        throw new Error(`El servidor respondió HTTP ${response.status}.`);
      }
      await quitarCambioPendiente(db, cambio.idCambio);
    }
    syncStatus.textContent = cambios.length
      ? `${cambios.length} cambio(s) sincronizado(s).`
      : 'No hay cambios pendientes de sincronización.';
  }

  async function vaciarBandejaEnLinea(): Promise<void> {
    if (!API_SYNC_ENABLED || !navigator.onLine) return;
    try {
      const db = await databaseReady;
      if (!db) return;
      await sincronizarPendientes(db);
    } catch (error) {
      console.error('Error al enviar la bandeja de salida:', error);
      syncStatus.textContent = error instanceof Error
        ? `Cambios guardados en el dispositivo; se reintentará la sincronización: ${error.message}`
        : 'Cambios guardados en el dispositivo; se reintentará la sincronización.';
    }
  }

  deliveryForm.addEventListener('submit', async event => {
    event.preventDefault();
    syncStatus.textContent = 'Guardando en este dispositivo…';
    try {
      const db = await databaseReady;
      if (!db) throw new Error('IndexedDB no está disponible.');
      const id = deliveryIdInput.value ? Number(deliveryIdInput.value) : undefined;
      const prioridadValor = deliveryPriorityInput.value;
      const prioridad = prioridadValor === 'alta' || prioridadValor === 'media' || prioridadValor === 'baja'
        ? prioridadValor
        : undefined;
      const estadoValor = deliveryStatusSelect.value;
      const estado = estadoValor === 'pendiente' || estadoValor === 'en-progreso' || estadoValor === 'entregada'
        ? estadoValor
        : undefined;
      const categoriaValor = deliveryCategorySelect.value;
      const categoria = categoriaValor === 'tarea' || categoriaValor === 'proyecto' ||
        categoriaValor === 'examen' || categoriaValor === 'otro'
        ? categoriaValor
        : undefined;
      const notaMaxima = Number(deliveryGradeMaxInput.value);
      const calificacion = deliveryGradeInput.value.trim() === ''
        ? undefined
        : Number(deliveryGradeInput.value);
      if (!prioridad || !estado || !categoria) throw new Error('Selecciona una importancia, categoría y estado válidos.');
      if (!Number.isFinite(notaMaxima) || notaMaxima <= 0) throw new Error('La nota máxima debe ser mayor que cero.');
      if (calificacion !== undefined && (!Number.isFinite(calificacion) || calificacion < 0 || calificacion > notaMaxima)) {
        throw new Error('La calificación debe estar entre cero y la nota máxima.');
      }
      const { entrega } = await guardarEntregaYEncolar(db, {
        ...(id === undefined ? {} : { id }),
        titulo: deliveryTitleInput.value.trim(),
        asignatura: deliverySubjectInput.value.trim(),
        fechaEntrega: deliveryDateInput.value,
        prioridad,
        categoria,
        ...(calificacion === undefined ? {} : { calificacion }),
        notaMaxima,
        detalle: deliveryDetailInput.value.trim(),
        estado
      });
      mostrarEntrega(entrega);
      actualizarTablero(await listarEntregas(db));
      window.dispatchEvent(new Event('entregas-actualizadas'));
      deliveryForm.reset();
      deliveryIdInput.value = '';
      deliveryForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent = 'Guardar offline y sincronizar';
      if (cancelButton) cancelButton.hidden = true;
      if (!API_SYNC_ENABLED) {
        syncStatus.textContent = 'Guardado localmente. Configura VITE_API_SYNC_ENABLED y la ruta /api del backend para habilitar la sincronización.';
      } else if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration() as SyncCapableRegistration | undefined;
          if (registration?.sync) {
            await registration.sync.register(SYNC_TAG);
            syncStatus.textContent = 'Guardado localmente y envío en segundo plano registrado.';
          } else {
            syncStatus.textContent = 'Guardado localmente; se enviará al recuperar la conexión.';
            void vaciarBandejaEnLinea();
          }
        } catch {
          syncStatus.textContent = 'Guardado localmente; se enviará al recuperar la conexión.';
          void vaciarBandejaEnLinea();
        }
      } else {
        syncStatus.textContent = 'Guardado localmente; se enviará al recuperar la conexión.';
        void vaciarBandejaEnLinea();
      }
    } catch (error) {
      console.error('No se pudo guardar la entrega:', error);
      syncStatus.textContent = error instanceof Error
        ? `No se pudo guardar la entrega: ${error.message}`
        : 'No se pudo guardar la entrega.';
    }
  });

  cancelButton?.addEventListener('click', () => {
    deliveryForm.reset();
    deliveryIdInput.value = '';
    deliveryForm.querySelector<HTMLButtonElement>('button[type="submit"]')!.textContent = 'Guardar offline y sincronizar';
    cancelButton.hidden = true;
  });

  window.addEventListener('online', () => {
    void vaciarBandejaEnLinea();
  });

  void databaseReady.then(async db => {
    if (!db) return;
    try {
      const entregas = await listarEntregas(db);
      entregas.forEach(mostrarEntrega);
      actualizarTablero(entregas);
      window.dispatchEvent(new Event('entregas-actualizadas'));
      const pendientes = await listarCambiosPendientes(db);
      if (pendientes.length) {
        syncStatus.textContent = API_SYNC_ENABLED
          ? `${pendientes.length} cambio(s) esperando conexión.`
          : `${pendientes.length} cambio(s) guardado(s) localmente; configura el backend para enviarlos.`;
        if (API_SYNC_ENABLED) void vaciarBandejaEnLinea();
      }
    } catch (error) {
      console.error('No se pudieron cargar las entregas locales:', error);
      syncStatus.textContent = 'No se pudieron cargar las entregas guardadas en este dispositivo.';
    }
  });
}
