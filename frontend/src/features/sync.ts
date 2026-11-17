import {
  guardarApunte,
  guardarAsignatura,
  guardarClaseHorario,
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
import {
  apiRequest,
  getCurrentUsername,
  isAuthenticated,
  type ApiRequestOptions
} from '../services/api';
import {
  EVENTO_SOLICITAR_SINCRONIZACION,
  publicarEstadoSincronizacion
} from './entregas';

export function inicializarSincronizacion(
  databaseReady: Promise<IDBDatabase | undefined>
): () => void {
  let remoteRefresh: Promise<void> | undefined;
  let pendingSync: Promise<void> | undefined;

  async function requestForUser<T>(
    username: string,
    path: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    if (getCurrentUsername() !== username) {
      throw new Error('La sesión cambió durante la sincronización. Vuelve a intentarlo con la cuenta activa.');
    }
    const result = await apiRequest<T>(path, options);
    if (getCurrentUsername() !== username) {
      throw new Error('La sesión cambió durante la sincronización. Vuelve a intentarlo con la cuenta activa.');
    }
    return result;
  }

  async function actualizarDatosRemotos(db: IDBDatabase): Promise<void> {
    if (!isAuthenticated() || !navigator.onLine) return;
    const username = getCurrentUsername();
    if (!username) return;
    const subjectsFromApi = await requestForUser<RemoteSubject[]>(username, '/subjects');
    let cachedSubjects = await listarAsignaturas(db);
    for (const cached of cachedSubjects) {
      if (cached.backendId && !cached.syncPending) continue;
      let remote = subjectsFromApi.find(subject => subject.id === cached.backendId) ??
        subjectsFromApi.find(subject =>
          subject.name.trim().toLocaleLowerCase() === cached.nombre.trim().toLocaleLowerCase()
        );
      if (!remote) {
        remote = await requestForUser<RemoteSubject>(username, '/subjects', {
          method: 'POST',
          body: JSON.stringify({ name: cached.nombre, teacher: '', schedule: '', credits: 3 })
        });
        subjectsFromApi.push(remote);
      } else if (cached.backendId && cached.syncPending) {
        await requestForUser(username, `/subjects/${remote.id}`, {
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
        ownerUsername: username,
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
      const remoteNote = await requestForUser<RemoteNote>(username, `/subjects/${subject.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Apunte', content: note.contenido })
      });
      if (note.backendId) {
        await requestForUser<void>(username, `/subjects/notes/${note.backendId}`, { method: 'DELETE' });
      }
      await guardarApunte(db, { ...note, backendId: remoteNote.id, syncPending: false });
    }
    const remoteNotes = await Promise.all(subjectsFromApi.map(async subject => ({
      subject,
      notes: await requestForUser<RemoteNote[]>(username, `/subjects/${subject.id}/notes`)
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
          ownerUsername: username,
          ...(cached ? { creadoEn: cached.creadoEn } : {})
        });
      }
    }

    const schedulesFromApi = await requestForUser<RemoteSchedule[]>(username, '/calendar/class-schedules');
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
        remote = await requestForUser<RemoteSchedule>(username, '/calendar/class-schedules', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        schedulesFromApi.push(remote);
      } else if (cached.backendId && cached.syncPending) {
        remote = await requestForUser<RemoteSchedule>(username, `/calendar/class-schedules/${remote.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }
      await guardarClaseHorario(db, { ...cached, backendId: remote.id, syncPending: false });
    }
    cachedSchedules = await listarClasesHorario(db);
    await sincronizarPendientes(db);
    const [tasksFromApi, remoteSessions, remoteGoal] = await Promise.all([
      requestForUser<RemoteTask[]>(username, '/tasks'),
      requestForUser<RemoteStudySession[]>(username, '/study/sessions'),
      requestForUser<{ targetWeeklyMinutes: number }>(username, '/statistics/goals')
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
        remote = await requestForUser<RemoteStudySession>(username, '/study/sessions', {
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
          if (request.result?.ownerUsername === username) {
            store.put({ ...request.result, backendId: remoteSessionId });
          }
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
        remoteTask = await requestForUser<RemoteTask>(username, '/tasks', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        tasksFromApi.push(remoteTask);
      }
      const state = delivery.estado === 'entregada'
        ? 'DONE'
        : delivery.estado === 'en-progreso' ? 'IN_PROGRESS' : 'PENDING';
      await requestForUser<void>(username, `/tasks/${remoteTask.id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ state })
      });
      remoteTask.currentStateName = state;
      const evaluation = subjectsFromApi.find(item => item.id === subject.backendId)
        ?.evaluations?.find(item => item.name === delivery.titulo);
      let evaluationBackendId = evaluation?.id;
      if (delivery.categoria === 'examen' || evaluationBackendId) {
        const evaluationDate = delivery.fechaEntrega.length > 19
          ? delivery.fechaEntrega.slice(0, 19)
          : delivery.fechaEntrega;
        const evaluationPayload = {
          name: delivery.titulo,
          evaluationDate
        };
        const remoteEvaluation = evaluationBackendId
          ? await requestForUser<{ id: number }>(username, `/subjects/${subject.backendId}/evaluations/${evaluationBackendId}`, {
              method: 'PUT',
              body: JSON.stringify(evaluationPayload)
            })
          : await requestForUser<{ id: number }>(username, `/subjects/${subject.backendId}/evaluations`, {
              method: 'POST',
              body: JSON.stringify(evaluationPayload)
            });
        evaluationBackendId = remoteEvaluation.id;
      }
      const transaction = db.transaction('entregas', 'readwrite');
      transaction.objectStore('entregas').put({
        ...delivery,
        ownerUsername: username,
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
      ? await requestForUser<{ targetWeeklyMinutes: number }>(username, '/statistics/goals', {
          method: 'PUT',
          body: JSON.stringify({
            targetWeeklyMinutes: localGoal.minutosSemanales
          })
        })
      : remoteGoal;
    if (localGoal?.syncPending) {
      await guardarMetas(db, {
        minutosSemanales: goalFromApi.targetWeeklyMinutes,
        syncPending: false,
        ...(localGoal.ownerUsername ? { ownerUsername: localGoal.ownerUsername } : {})
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
        aula: schedule.location ?? '',
        ownerUsername: username
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
        ...((evaluation?.id ?? cached?.evaluationBackendId) === undefined
          ? {}
          : { evaluationBackendId: evaluation?.id ?? cached?.evaluationBackendId }),
        actualizadoEn: cached?.actualizadoEn ?? new Date().toISOString(),
        ownerUsername: username
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
        duracionSegundos: session.durationMinutes * 60,
        ownerUsername: username
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
      id: `${username}:actual`,
      ownerUsername: username,
      minutosSemanales: goalFromApi.targetWeeklyMinutes,
      actualizadoEn: new Date().toISOString()
    });
    await new Promise<void>((resolve, reject) => {
      goalsTransaction.oncomplete = () => resolve();
      goalsTransaction.onerror = () => reject(goalsTransaction.error);
      goalsTransaction.onabort = () => reject(goalsTransaction.error ?? new Error('No se pudo guardar la copia de metas.'));
    });

    window.dispatchEvent(new Event('asignaturas-actualizadas'));
    window.dispatchEvent(new Event('horario-actualizado'));
    window.dispatchEvent(new Event('entregas-actualizadas'));
    window.dispatchEvent(new Event('sesion-estudio-guardada'));
    publicarEstadoSincronizacion('Tus datos están actualizados.');
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
      publicarEstadoSincronizacion('Inicia sesión para sincronizar tus cambios entre dispositivos.');
      return;
    }
    const username = getCurrentUsername();
    if (!username) return;
    const asignaturas = await listarAsignaturas(db);
    const cambios = await listarCambiosPendientes(db);
    for (const cambio of cambios) {
      const entrega = cambio.payload;
      const asignatura = asignaturas.find(item =>
        item.id === entrega.asignaturaId || item.nombre === entrega.asignatura
      );
      if (!asignatura?.backendId) {
        throw new Error(`No se encontró la asignatura "${entrega.asignatura}". Revisa tus materias e inténtalo de nuevo.`);
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
        ? await requestForUser<{ id: number }>(username, `/tasks/${entrega.backendId}`, {
            method: 'PUT',
            body: JSON.stringify(task)
          })
        : await requestForUser<{ id: number }>(username, '/tasks', {
            method: 'POST',
            body: JSON.stringify(task)
          });
      cambio.payload = { ...entrega, backendId: remoteTask.id };
      const taskMarkerTx = db.transaction(['entregas', 'outbox'], 'readwrite');
      taskMarkerTx.objectStore('entregas').put({
        ...entrega,
        ownerUsername: username,
        backendId: remoteTask.id
      });
      taskMarkerTx.objectStore('outbox').put({ ...cambio, ownerUsername: username });
      await new Promise<void>((resolve, reject) => {
        taskMarkerTx.oncomplete = () => resolve();
        taskMarkerTx.onerror = () => reject(taskMarkerTx.error);
        taskMarkerTx.onabort = () => reject(taskMarkerTx.error ?? new Error('No se pudo guardar el vínculo con la tarea remota.'));
      });
      const state = entrega.estado === 'entregada'
        ? 'DONE'
        : entrega.estado === 'en-progreso' ? 'IN_PROGRESS' : 'PENDING';
      await requestForUser<void>(username, `/tasks/${remoteTask.id}/state`, {
        method: 'PATCH',
        body: JSON.stringify({ state })
      });
      let evaluationBackendId = entrega.evaluationBackendId;
      if (entrega.categoria === 'examen' || evaluationBackendId) {
        const evaluationDate = entrega.fechaEntrega.length > 19
          ? entrega.fechaEntrega.slice(0, 19)
          : entrega.fechaEntrega;
        const evaluationPayload = {
          name: entrega.titulo,
          evaluationDate
        };
        const evaluation = evaluationBackendId
          ? await requestForUser<{ id: number }>(username, `/subjects/${asignatura.backendId}/evaluations/${evaluationBackendId}`, {
              method: 'PUT',
              body: JSON.stringify(evaluationPayload)
            })
          : await requestForUser<{ id: number }>(username, `/subjects/${asignatura.backendId}/evaluations`, {
              method: 'POST',
              body: JSON.stringify(evaluationPayload)
            });
        evaluationBackendId = evaluation.id;
        cambio.payload = { ...cambio.payload, evaluationBackendId };
        const evaluationMarkerTx = db.transaction('outbox', 'readwrite');
        evaluationMarkerTx.objectStore('outbox').put({ ...cambio, ownerUsername: username });
        await new Promise<void>((resolve, reject) => {
          evaluationMarkerTx.oncomplete = () => resolve();
          evaluationMarkerTx.onerror = () => reject(evaluationMarkerTx.error);
          evaluationMarkerTx.onabort = () => reject(evaluationMarkerTx.error ?? new Error('No se pudo guardar el vínculo con la evaluación remota.'));
        });
      }
      const saveTx = db.transaction('entregas', 'readwrite');
      saveTx.objectStore('entregas').put({
        ...entrega,
        ownerUsername: username,
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
    publicarEstadoSincronizacion(cambios.length
      ? 'Tus cambios están actualizados en todos tus dispositivos.'
      : 'Todo está actualizado.');
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
      await cargarDatosRemotos(db);
    } catch (error) {
      console.error('Error al sincronizar los cambios pendientes:', error);
      publicarEstadoSincronizacion(error instanceof Error
        ? `No se pudo completar la sincronización. Se volverá a intentar automáticamente: ${error.message}`
        : 'No se pudo completar la sincronización. Se volverá a intentar automáticamente.');
    }
  }

  const sincronizarAlConectarse = (): void => {
    void vaciarBandejaEnLinea();
  };
  const sincronizarAlCambiarAutenticacion = (): void => {
    void databaseReady.then(db => {
      if (db && isAuthenticated() && navigator.onLine) void vaciarBandejaEnLinea();
    });
  };
  const sincronizarPorSolicitud = (): void => {
    void vaciarBandejaEnLinea();
  };
  window.addEventListener('online', sincronizarAlConectarse);
  window.addEventListener('auth-changed', sincronizarAlCambiarAutenticacion);
  window.addEventListener(EVENTO_SOLICITAR_SINCRONIZACION, sincronizarPorSolicitud);

  void databaseReady.then(async db => {
    if (!db) return;
    try {
      const pendientes = await listarCambiosPendientes(db);
      if (pendientes.length) {
        publicarEstadoSincronizacion(isAuthenticated()
          ? 'Tus cambios pendientes se sincronizarán automáticamente.'
          : 'Inicia sesión para sincronizar tus cambios entre dispositivos.');
      }
      if (isAuthenticated()) {
        await cargarDatosRemotos(db);
      }
    } catch (error) {
      console.error('No se pudieron cargar las entregas locales:', error);
      publicarEstadoSincronizacion('No se pudieron cargar las entregas guardadas en este dispositivo.');
    }
  });

  return () => {
    window.removeEventListener('online', sincronizarAlConectarse);
    window.removeEventListener('auth-changed', sincronizarAlCambiarAutenticacion);
    window.removeEventListener(EVENTO_SOLICITAR_SINCRONIZACION, sincronizarPorSolicitud);
  };
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
