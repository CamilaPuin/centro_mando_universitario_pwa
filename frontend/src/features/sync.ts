import {
  guardarApunte,
  guardarAsignatura,
  guardarClaseHorario,
  guardarEntregaYEncolar,
  listarApuntes,
  listarAsignaturas,
  listarCambiosPendientes,
  listarClasesHorario,
  listarEntregas,
  listarSesionesEstudio,
  obtenerMetas,
  guardarMetas,
  quitarCambioPendiente,
  type Asignatura,
  type ApunteMateria,
  type EntregaAcademica,
  type SesionEstudio
} from '../utils/db';
import { apiRequest, isAuthenticated } from '../services/api';
import { renderizarSemanaExamenes } from './calendario';

function normalizarCalificacion(entrega: EntregaAcademica): number | null {
  if (entrega.calificacion === undefined) return null;
  const notaMaxima = entrega.notaMaxima ?? 5;
  if (!Number.isFinite(entrega.calificacion) || !Number.isFinite(notaMaxima) || notaMaxima <= 0) {
    throw new Error(`La calificación de "${entrega.titulo}" no se puede sincronizar.`);
  }
  return Math.round((entrega.calificacion / notaMaxima) * 500) / 100;
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
  let remoteRefresh: Promise<void> | undefined;
  let pendingSync: Promise<void> | undefined;

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

  async function actualizarDatosRemotos(db: IDBDatabase): Promise<void> {
    if (!isAuthenticated() || !navigator.onLine) return;
    const subjectsFromApi = await apiRequest<RemoteSubject[]>('/subjects');
    let cachedSubjects = await listarAsignaturas(db);
    for (const cached of cachedSubjects) {
      if (cached.backendId && !cached.syncPending) continue;
      let remote = subjectsFromApi.find(subject => subject.id === cached.backendId) ??
        subjectsFromApi.find(subject =>
          subject.name.trim().toLocaleLowerCase() === cached.nombre.trim().toLocaleLowerCase()
        );
      if (!remote) {
        remote = await apiRequest<RemoteSubject>('/subjects', {
          method: 'POST',
          body: JSON.stringify({ name: cached.nombre, teacher: '', schedule: '', credits: 3 })
        });
        subjectsFromApi.push(remote);
      } else if (cached.backendId && cached.syncPending) {
        await apiRequest(`/subjects/${remote.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: cached.nombre, teacher: '', schedule: '', credits: 3 })
        });
        remote.name = cached.nombre;
      }
      await guardarAsignatura(db, { ...cached, backendId: remote.id, syncPending: false });
    }
    cachedSubjects = await listarAsignaturas(db);
    const localSubjects: Asignatura[] = [];
    for (const subject of subjectsFromApi) {
      const cached = cachedSubjects.find(item => item.backendId === subject.id) ??
        cachedSubjects.find(item => item.nombre.trim().toLocaleLowerCase() === subject.name.trim().toLocaleLowerCase());
      localSubjects.push(await guardarAsignatura(db, {
        ...(cached?.id === undefined ? {} : { id: cached.id }),
        backendId: subject.id,
        nombre: subject.name,
        creadoEn: cached?.creadoEn ?? new Date().toISOString()
      }));
    }
    const subjectsByBackendId = new Map(subjectsFromApi.map(subject => [
      subject.id,
      localSubjects.find(local => local.backendId === subject.id)!
    ]));

    const cachedNotes = await listarApuntes(db);
    for (const note of cachedNotes.filter(item => item.backendId === undefined || item.syncPending)) {
      const subject = subjectsFromApi.find(item =>
        item.name.trim().toLocaleLowerCase() === note.asignatura.trim().toLocaleLowerCase()
      );
      if (!subject) continue;
      const remoteNote = await apiRequest<RemoteNote>(`/subjects/${subject.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Apunte', content: note.contenido })
      });
      if (note.backendId) {
        await apiRequest<void>(`/subjects/notes/${note.backendId}`, { method: 'DELETE' });
      }
      await guardarApunte(db, { ...note, backendId: remoteNote.id, syncPending: false });
    }
    const remoteNotes = await Promise.all(subjectsFromApi.map(async subject => ({
      subject,
      notes: await apiRequest<RemoteNote[]>(`/subjects/${subject.id}/notes`)
    })));
    const localNotes: ApunteMateria[] = await listarApuntes(db);
    for (const { subject, notes } of remoteNotes) {
      const localSubject = subjectsByBackendId.get(subject.id);
      if (!localSubject) continue;
      for (const note of notes) {
        const cached = localNotes.find(item => item.backendId === note.id);
        await guardarApunte(db, {
          ...(cached?.id === undefined ? {} : { id: cached.id }),
          backendId: note.id,
          syncPending: false,
          ...(localSubject.id === undefined ? {} : { asignaturaId: localSubject.id }),
          asignatura: localSubject.nombre,
          contenido: note.content,
          ...(cached ? { creadoEn: cached.creadoEn } : {})
        });
      }
    }

    const schedulesFromApi = await apiRequest<RemoteSchedule[]>('/calendar/class-schedules');
    let cachedSchedules = await listarClasesHorario(db);
    for (const cached of cachedSchedules) {
      if (cached.backendId && !cached.syncPending) continue;
      const subject = cachedSubjects.find(item => item.id === cached.asignaturaId);
      if (!subject?.backendId) continue;
      const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][cached.diaSemana];
      if (!dayOfWeek) continue;
      const payload = {
        subjectId: subject.backendId,
        dayOfWeek,
        startTime: cached.horaInicio,
        endTime: cached.horaFin,
        location: cached.aula
      };
      let remote = schedulesFromApi.find(schedule => schedule.id === cached.backendId) ??
        schedulesFromApi.find(schedule =>
          schedule.subjectId === subject.backendId &&
          schedule.dayOfWeek === dayOfWeek &&
          schedule.startTime.slice(0, 5) === cached.horaInicio &&
          schedule.endTime.slice(0, 5) === cached.horaFin
        );
      if (!remote) {
        remote = await apiRequest<RemoteSchedule>('/calendar/class-schedules', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        schedulesFromApi.push(remote);
      } else if (cached.backendId && cached.syncPending) {
        remote = await apiRequest<RemoteSchedule>(`/calendar/class-schedules/${remote.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }
      await guardarClaseHorario(db, { ...cached, backendId: remote.id, syncPending: false });
    }
    cachedSchedules = await listarClasesHorario(db);
    await sincronizarPendientes(db);
    const [tasksFromApi, remoteSessions, remoteGoal] = await Promise.all([
      apiRequest<RemoteTask[]>('/tasks'),
      apiRequest<RemoteStudySession[]>('/study/sessions'),
      apiRequest<{ targetWeeklyMinutes: number; targetAverageGrade: number }>('/statistics/goals')
    ]);
    const sessionsFromApi = [...remoteSessions];
    const localSessions = await listarSesionesEstudio(db);
    for (const session of localSessions.filter(item => item.backendId === undefined)) {
      const subject = localSubjects.find(item => item.nombre === session.asignatura);
      if (!subject?.backendId || session.duracionSegundos < 60) continue;
      const sessionDate = new Date(session.inicio);
      const formattedDate = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}T${String(sessionDate.getHours()).padStart(2, '0')}:${String(sessionDate.getMinutes()).padStart(2, '0')}:${String(sessionDate.getSeconds()).padStart(2, '0')}`;
      let remote = sessionsFromApi.find(item =>
        item.subjectId === subject.backendId &&
        item.durationMinutes === Math.floor(session.duracionSegundos / 60) &&
        Math.abs(new Date(item.sessionDate).getTime() - sessionDate.getTime()) < 60_000
      );
      if (!remote) {
        remote = await apiRequest<RemoteStudySession>('/study/sessions', {
          method: 'POST',
          body: JSON.stringify({
            subjectId: subject.backendId,
            durationMinutes: Math.floor(session.duracionSegundos / 60),
            cycleType: session.tipo === 'cronometro' ? 'FREE_SESSION' : 'POMODORO_TRADITIONAL',
            sessionDate: formattedDate
          })
        });
        sessionsFromApi.push(remote);
      }
      const remoteSessionId = remote.id;
      if (session.id !== undefined) {
        const transaction = db.transaction('sesionesEstudio', 'readwrite');
        const store = transaction.objectStore('sesionesEstudio');
        const request = store.get(session.id);
        request.onsuccess = () => {
          if (request.result) store.put({ ...request.result, backendId: remoteSessionId });
        };
        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error ?? new Error('No se pudo guardar el vínculo con la sesión remota.'));
        });
      }
    }
    const localDeliveries = await listarEntregas(db);
    for (const delivery of localDeliveries.filter(item => item.backendId === undefined)) {
      if (!delivery.fechaEntrega) continue;
      const subject = localSubjects.find(item =>
        item.id === delivery.asignaturaId || item.nombre === delivery.asignatura
      );
      if (!subject?.backendId || subject.id === undefined) continue;
      const taskType = delivery.categoria === 'examen'
        ? 'EXAM'
        : delivery.categoria === 'proyecto'
          ? 'PROJECT'
          : delivery.categoria === 'otro' ? 'ASSIGNMENT' : 'TASK';
      const payload = {
        subjectId: subject.backendId,
        title: delivery.titulo,
        description: delivery.detalle,
        dueDate: delivery.fechaEntrega,
        priority: (delivery.prioridad ?? 'media').toUpperCase(),
        taskType
      };
      let remoteTask = tasksFromApi.find(item =>
        item.subjectId === subject.backendId &&
        item.title === delivery.titulo &&
        item.dueDate.slice(0, 16) === delivery.fechaEntrega.slice(0, 16)
      );
      if (!remoteTask) {
        remoteTask = await apiRequest<RemoteTask>('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        tasksFromApi.push(remoteTask);
      }
      const state = delivery.estado === 'entregada'
        ? 'DONE'
        : delivery.estado === 'en-progreso' ? 'IN_PROGRESS' : 'PENDING';
      await apiRequest<void>(`/tasks/${remoteTask.id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ state })
      });
      remoteTask.currentStateName = state;
      const evaluation = subjectsFromApi.find(item => item.id === subject.backendId)
        ?.evaluations?.find(item => item.name === delivery.titulo);
      let evaluationBackendId = evaluation?.id;
      if (delivery.categoria === 'examen' || delivery.calificacion !== undefined || evaluationBackendId) {
        const evaluationDate = delivery.fechaEntrega.length > 19
          ? delivery.fechaEntrega.slice(0, 19)
          : delivery.fechaEntrega;
        const evaluationPayload = {
          name: delivery.titulo,
          grade: delivery.calificacion === undefined
            ? evaluation?.grade ?? null
            : normalizarCalificacion(delivery),
          percentage: 100,
          evaluationDate
        };
        const remoteEvaluation = evaluationBackendId
          ? await apiRequest<{ id: number }>(`/subjects/${subject.backendId}/evaluations/${evaluationBackendId}`, {
              method: 'PUT',
              body: JSON.stringify(evaluationPayload)
            })
          : await apiRequest<{ id: number }>(`/subjects/${subject.backendId}/evaluations`, {
              method: 'POST',
              body: JSON.stringify(evaluationPayload)
            });
        evaluationBackendId = remoteEvaluation.id;
      }
      const transaction = db.transaction('entregas', 'readwrite');
      transaction.objectStore('entregas').put({
        ...delivery,
        backendId: remoteTask.id,
        ...(evaluationBackendId === undefined ? {} : { evaluationBackendId }),
        asignaturaId: subject.id
      });
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error('No se pudo guardar el vínculo con la entrega remota.'));
      });
    }
    const localGoal = await obtenerMetas(db);
    const goalFromApi = localGoal?.syncPending
      ? await apiRequest<{ targetWeeklyMinutes: number; targetAverageGrade: number }>('/statistics/goals', {
          method: 'PUT',
          body: JSON.stringify({
            targetWeeklyMinutes: localGoal.minutosSemanales,
            targetAverageGrade: localGoal.promedioDeseado
          })
        })
      : remoteGoal;
    if (localGoal?.syncPending) {
      await guardarMetas(db, {
        minutosSemanales: goalFromApi.targetWeeklyMinutes,
        promedioDeseado: goalFromApi.targetAverageGrade,
        syncPending: false
      });
    }
    for (const schedule of schedulesFromApi) {
      const subject = subjectsByBackendId.get(schedule.subjectId);
      if (!subject?.id) continue;
      const cached = cachedSchedules.find(item => item.backendId === schedule.id);
      const day = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        .indexOf(schedule.dayOfWeek);
      if (day < 0) continue;
      await guardarClaseHorario(db, {
        ...(cached?.id === undefined ? {} : { id: cached.id }),
        backendId: schedule.id,
        asignaturaId: subject.id,
        diaSemana: day,
        horaInicio: schedule.startTime.slice(0, 5),
        horaFin: schedule.endTime.slice(0, 5),
        aula: schedule.location ?? ''
      });
    }

    const localSubjectByBackendId = new Map(localSubjects.map(subject => [subject.backendId, subject]));
    const cachedTasks = await listarEntregas(db);
    const taskStore = db.transaction('entregas', 'readwrite').objectStore('entregas');
    for (const task of tasksFromApi) {
      const subject = localSubjectByBackendId.get(task.subjectId);
      if (!subject) continue;
      const cached = cachedTasks.find(item => item.backendId === task.id);
      const category = task.taskType === 'EXAM' || task.taskType === 'EVALUATION' || task.taskType === 'TEST'
        ? 'examen'
        : task.taskType === 'PROJECT' ? 'proyecto' : task.taskType === 'TASK' || task.taskType === 'ASSIGNMENT'
          ? 'tarea' : 'otro';
      const status = task.currentStateName === 'DONE'
        ? 'entregada'
        : task.currentStateName === 'IN_PROGRESS' ? 'en-progreso' : 'pendiente';
      const evaluation = subjectsFromApi
        .find(item => item.id === task.subjectId)
        ?.evaluations?.find(item => item.name === task.title);
      const record: EntregaAcademica = {
        ...(cached?.id === undefined ? {} : { id: cached.id }),
        backendId: task.id,
        asignaturaId: subject.id,
        titulo: task.title,
        asignatura: subject.nombre,
        fechaEntrega: task.dueDate,
        detalle: task.description ?? '',
        estado: status,
        categoria: category,
        prioridad: task.priority.toLowerCase() as EntregaAcademica['prioridad'],
        ...(evaluation
          ? evaluation.grade == null ? {} : { calificacion: evaluation.grade, notaMaxima: 5 }
          : cached?.calificacion === undefined
            ? {}
            : { calificacion: cached.calificacion, notaMaxima: cached.notaMaxima ?? 5 }),
        ...((evaluation?.id ?? cached?.evaluationBackendId) === undefined
          ? {}
          : { evaluationBackendId: evaluation?.id ?? cached?.evaluationBackendId }),
        actualizadoEn: cached?.actualizadoEn ?? new Date().toISOString()
      };
      if (record.id === undefined) taskStore.add(record);
      else taskStore.put(record);
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = taskStore.transaction;
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('No se pudo guardar la copia de tareas.'));
    });

    const cachedSessions = await listarSesionesEstudio(db);
    const sessionsStore = db.transaction('sesionesEstudio', 'readwrite').objectStore('sesionesEstudio');
    for (const session of sessionsFromApi) {
      const subject = localSubjectByBackendId.get(session.subjectId);
      if (!subject) continue;
      const cached = cachedSessions.find(item => item.backendId === session.id);
      const record: SesionEstudio = {
        ...(cached?.id === undefined ? {} : { id: cached.id }),
        backendId: session.id,
        asignatura: subject.nombre,
        tipo: session.cycleType === 'FREE_SESSION' ? 'cronometro' : 'pomodoro',
        inicio: session.sessionDate,
        fin: new Date(new Date(session.sessionDate).getTime() + session.durationMinutes * 60_000).toISOString(),
        duracionSegundos: session.durationMinutes * 60
      };
      if (record.id === undefined) sessionsStore.add(record);
      else sessionsStore.put(record);
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = sessionsStore.transaction;
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('No se pudo guardar la copia de sesiones.'));
    });

    const goalsTransaction = db.transaction('metas', 'readwrite');
    goalsTransaction.objectStore('metas').put({
      id: 'actual',
      minutosSemanales: goalFromApi.targetWeeklyMinutes,
      promedioDeseado: goalFromApi.targetAverageGrade,
      actualizadoEn: new Date().toISOString()
    });
    await new Promise<void>((resolve, reject) => {
      goalsTransaction.oncomplete = () => resolve();
      goalsTransaction.onerror = () => reject(goalsTransaction.error);
      goalsTransaction.onabort = () => reject(goalsTransaction.error ?? new Error('No se pudo guardar la copia de metas.'));
    });

    const refreshed = await listarEntregas(db);
    refreshed.forEach(mostrarEntrega);
    actualizarTablero(refreshed);
    window.dispatchEvent(new Event('asignaturas-actualizadas'));
    window.dispatchEvent(new Event('horario-actualizado'));
    window.dispatchEvent(new Event('entregas-actualizadas'));
    window.dispatchEvent(new Event('sesion-estudio-guardada'));
    syncStatus.textContent = 'Datos actualizados desde el servidor.';
  }

  function cargarDatosRemotos(db: IDBDatabase): Promise<void> {
    if (remoteRefresh) return remoteRefresh;
    remoteRefresh = actualizarDatosRemotos(db).finally(() => {
      remoteRefresh = undefined;
    });
    return remoteRefresh;
  }

  async function enviarCambiosPendientes(db: IDBDatabase): Promise<void> {
    if (!isAuthenticated()) {
      syncStatus.textContent = 'Inicia sesión para sincronizar las entregas pendientes.';
      return;
    }
    const asignaturas = await listarAsignaturas(db);
    const cambios = await listarCambiosPendientes(db);
    for (const cambio of cambios) {
      const entrega = cambio.payload;
      const asignatura = asignaturas.find(item =>
        item.id === entrega.asignaturaId || item.nombre === entrega.asignatura
      );
      if (!asignatura?.backendId) {
        throw new Error(`Conecta primero la asignatura "${entrega.asignatura}" con el servidor.`);
      }
      const taskType = entrega.categoria === 'examen'
        ? 'EXAM'
        : entrega.categoria === 'proyecto'
          ? 'PROJECT'
          : entrega.categoria === 'otro' ? 'ASSIGNMENT' : 'TASK';
      const task = {
        subjectId: asignatura.backendId,
        title: entrega.titulo,
        description: entrega.detalle,
        dueDate: entrega.fechaEntrega,
        priority: (entrega.prioridad ?? 'media').toUpperCase(),
        taskType
      };
      const remoteTask = entrega.backendId
        ? await apiRequest<{ id: number }>(`/tasks/${entrega.backendId}`, {
            method: 'PUT',
            body: JSON.stringify(task)
          })
        : await apiRequest<{ id: number }>('/tasks', {
            method: 'POST',
            body: JSON.stringify(task)
          });
      cambio.payload = { ...entrega, backendId: remoteTask.id };
      const taskMarkerTx = db.transaction(['entregas', 'outbox'], 'readwrite');
      taskMarkerTx.objectStore('entregas').put({ ...entrega, backendId: remoteTask.id });
      taskMarkerTx.objectStore('outbox').put(cambio);
      await new Promise<void>((resolve, reject) => {
        taskMarkerTx.oncomplete = () => resolve();
        taskMarkerTx.onerror = () => reject(taskMarkerTx.error);
        taskMarkerTx.onabort = () => reject(taskMarkerTx.error ?? new Error('No se pudo guardar el vínculo con la tarea remota.'));
      });
      const state = entrega.estado === 'entregada'
        ? 'DONE'
        : entrega.estado === 'en-progreso' ? 'IN_PROGRESS' : 'PENDING';
      await apiRequest<void>(`/tasks/${remoteTask.id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ state })
      });
      let evaluationBackendId = entrega.evaluationBackendId;
      if (entrega.categoria === 'examen' || entrega.calificacion !== undefined || evaluationBackendId) {
        const evaluationDate = entrega.fechaEntrega.length > 19
          ? entrega.fechaEntrega.slice(0, 19)
          : entrega.fechaEntrega;
        const evaluationPayload = {
          name: entrega.titulo,
          grade: normalizarCalificacion(entrega),
          percentage: 100,
          evaluationDate
        };
        const evaluation = evaluationBackendId
          ? await apiRequest<{ id: number }>(`/subjects/${asignatura.backendId}/evaluations/${evaluationBackendId}`, {
              method: 'PUT',
              body: JSON.stringify(evaluationPayload)
            })
          : await apiRequest<{ id: number }>(`/subjects/${asignatura.backendId}/evaluations`, {
              method: 'POST',
              body: JSON.stringify(evaluationPayload)
            });
        evaluationBackendId = evaluation.id;
        cambio.payload = { ...cambio.payload, evaluationBackendId };
        const evaluationMarkerTx = db.transaction('outbox', 'readwrite');
        evaluationMarkerTx.objectStore('outbox').put(cambio);
        await new Promise<void>((resolve, reject) => {
          evaluationMarkerTx.oncomplete = () => resolve();
          evaluationMarkerTx.onerror = () => reject(evaluationMarkerTx.error);
          evaluationMarkerTx.onabort = () => reject(evaluationMarkerTx.error ?? new Error('No se pudo guardar el vínculo con la evaluación remota.'));
        });
      }
      const saveTx = db.transaction('entregas', 'readwrite');
      saveTx.objectStore('entregas').put({
        ...entrega,
        backendId: remoteTask.id,
        ...(evaluationBackendId === undefined ? {} : { evaluationBackendId }),
        asignaturaId: asignatura.id
      });
      await new Promise<void>((resolve, reject) => {
        saveTx.oncomplete = () => resolve();
        saveTx.onerror = () => reject(saveTx.error);
        saveTx.onabort = () => reject(saveTx.error ?? new Error('No se pudo actualizar la copia local.'));
      });
      await quitarCambioPendiente(db, cambio.idCambio);
    }
    syncStatus.textContent = cambios.length
      ? `${cambios.length} cambio(s) sincronizado(s).`
      : 'No hay cambios pendientes de sincronización.';
  }

  function sincronizarPendientes(db: IDBDatabase): Promise<void> {
    if (pendingSync) return pendingSync;
    pendingSync = enviarCambiosPendientes(db).finally(() => {
      pendingSync = undefined;
    });
    return pendingSync;
  }

  async function vaciarBandejaEnLinea(): Promise<void> {
    if (!isAuthenticated() || !navigator.onLine) return;
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
      const asignaturas = await listarAsignaturas(db);
      const asignatura = asignaturas.find(item => item.nombre === deliverySubjectInput.value.trim());
      const existente = id === undefined
        ? undefined
        : (await listarEntregas(db)).find(item => item.id === id);
      const { entrega } = await guardarEntregaYEncolar(db, {
        ...(id === undefined ? {} : { id }),
        ...(existente?.backendId === undefined ? {} : { backendId: existente.backendId }),
        ...(existente?.evaluationBackendId === undefined ? {} : { evaluationBackendId: existente.evaluationBackendId }),
        ...(asignatura?.id === undefined ? {} : { asignaturaId: asignatura.id }),
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
      if (isAuthenticated() && navigator.onLine) {
        syncStatus.textContent = 'Guardado localmente; sincronizando con el servidor…';
        void vaciarBandejaEnLinea();
      } else {
        syncStatus.textContent = 'Guardado localmente. Inicia sesión y conéctate para sincronizarlo.';
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
    void databaseReady.then(db => {
      if (!db || !isAuthenticated()) return;
      return cargarDatosRemotos(db);
    }).catch(error => {
      console.error('No se pudieron sincronizar los datos al recuperar la conexión:', error);
      syncStatus.textContent = error instanceof Error
        ? `Sincronización pendiente: ${error.message}`
        : 'No se pudieron sincronizar los datos al recuperar la conexión.';
    });
  });
  window.addEventListener('auth-changed', () => {
    void databaseReady.then(db => {
      if (db && isAuthenticated()) {
        void cargarDatosRemotos(db).catch(error => {
          console.error('No se pudieron cargar datos del servidor:', error);
          syncStatus.textContent = error instanceof Error
            ? `Sesión iniciada, pero no se cargaron los datos remotos: ${error.message}`
            : 'Sesión iniciada, pero no se cargaron los datos remotos.';
        });
      }
    });
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
        syncStatus.textContent = isAuthenticated()
          ? `${pendientes.length} cambio(s) esperando sincronización.`
          : `${pendientes.length} cambio(s) local(es); inicia sesión para sincronizarlos.`;
      }
      if (isAuthenticated()) {
        await cargarDatosRemotos(db);
      }
    } catch (error) {
      console.error('No se pudieron cargar las entregas locales:', error);
      syncStatus.textContent = 'No se pudieron cargar las entregas guardadas en este dispositivo.';
    }

  });
}

interface RemoteSubject {
  id: number;
  name: string;
  evaluations?: RemoteEvaluation[];
}

interface RemoteNote {
  id: number;
  title: string | null;
  content: string;
}

interface RemoteEvaluation {
  id: number;
  name: string;
  grade: number | null;
}

interface RemoteTask {
  id: number;
  subjectId: number;
  title: string;
  description: string | null;
  dueDate: string;
  priority: string;
  taskType: string;
  currentStateName: string;
}

interface RemoteSchedule {
  id: number;
  subjectId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string | null;
}

interface RemoteStudySession {
  id: number;
  subjectId: number;
  sessionDate: string;
  durationMinutes: number;
  cycleType: string;
}
