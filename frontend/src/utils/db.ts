export interface NotaPrivada {
  id?: number;
  materiaNombre: string;
  titulo: string;
  fechaCreacion: string;
  contenidoCifrado: ArrayBuffer;
  iv: Uint8Array;
  sal?: Uint8Array;
}

export interface ApunteMateria {
  id?: number;
  backendId?: number;
  syncPending?: boolean;
  asignaturaId?: number;
  asignatura: string;
  contenido: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface PerfilEstudiante {
  id: 'estudiante';
  nombre: string;
  nombreUsuario: string;
  foto?: Blob;
  actualizadoEn: string;
}

export interface MetasEstudio {
  id: 'actual';
  minutosSemanales: number;
  promedioDeseado: number;
  actualizadoEn: string;
  syncPending?: boolean;
}

export interface Asignatura {
  id?: number;
  backendId?: number;
  syncPending?: boolean;
  nombre: string;
  creadoEn: string;
}

export interface ClaseHorario {
  id?: number;
  backendId?: number;
  syncPending?: boolean;
  asignaturaId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  aula: string;
}

export interface SesionEstudio {
  id?: number;
  backendId?: number;
  asignatura: string;
  tipo: 'pomodoro' | 'cronometro';
  inicio: string;
  fin: string;
  duracionSegundos: number;
}

export interface RegistroApp {
  id?: number;
  clave: string;
  tipo: 'clase' | 'entrega' | 'parcial' | 'bloque-estudio';
  titulo: string;
  fechaObjetivo?: string;
  eliminadoEn?: string;
}

export interface EvidenciaLocal {
  propietarioTipo: 'perfil' | 'entrega' | 'asignatura';
  propietarioId: string;
  creadoEn: string;
  imagen: Blob;
}

export interface EntregaAcademica {
  id?: number;
  backendId?: number;
  evaluationBackendId?: number;
  asignaturaId?: number;
  titulo: string;
  asignatura: string;
  fechaEntrega: string;
  detalle: string;
  estado: 'pendiente' | 'en-progreso' | 'entregada';
  categoria?: 'tarea' | 'proyecto' | 'examen' | 'otro';
  prioridad?: 'baja' | 'media' | 'alta';
  calificacion?: number;
  notaMaxima?: number;
  actualizadoEn: string;
}

export interface CambioPendiente {
  idCambio: string;
  entidad: 'entrega';
  operacion: 'crear' | 'actualizar';
  payload: EntregaAcademica;
  creadoEn: string;
}

export function abrirBaseDeDatos(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (
      !('indexedDB' in window) ||
      typeof window.indexedDB === 'undefined' ||
      typeof window.indexedDB.open !== 'function'
    ) {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }

    const peticion = window.indexedDB.open('centro-mando-db', 5);

    peticion.onupgradeneeded = event => {
      const db = peticion.result;
      const versionAnterior = event.oldVersion;

      if (versionAnterior < 1) {
        if (!db.objectStoreNames.contains('asignaturas')) {
          const storeAsignaturas = db.createObjectStore('asignaturas', { keyPath: 'id', autoIncrement: true });
          storeAsignaturas.createIndex('porNombre', 'nombre', { unique: true });
        }
        if (!db.objectStoreNames.contains('entregas')) {
          const storeEntregas = db.createObjectStore('entregas', { keyPath: 'id', autoIncrement: true });
          storeEntregas.createIndex('porEstado', 'estado', { unique: false });
        }
        if (!db.objectStoreNames.contains('sesionesEstudio')) {
          db.createObjectStore('sesionesEstudio', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('notasPrivadas')) {
          const storeNotas = db.createObjectStore('notasPrivadas', { keyPath: 'id', autoIncrement: true });
          storeNotas.createIndex('porMateria', 'materiaNombre', { unique: false });
        }
      }

      if (versionAnterior < 2) {
        if (!db.objectStoreNames.contains('registros')) {
          const registros = db.createObjectStore('registros', { keyPath: 'id', autoIncrement: true });
          registros.createIndex('porClave', 'clave', { unique: true });
        }
        if (!db.objectStoreNames.contains('evidencias')) {
          db.createObjectStore('evidencias', { keyPath: 'id', autoIncrement: true });
        }
      }

      if (versionAnterior < 3 && !db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'idCambio' });
      }

      if (versionAnterior < 4 && !db.objectStoreNames.contains('horarioClases')) {
        const horarios = db.createObjectStore('horarioClases', { keyPath: 'id', autoIncrement: true });
        horarios.createIndex('porDia', 'diaSemana', { unique: false });
        horarios.createIndex('porAsignatura', 'asignaturaId', { unique: false });
      }

      if (versionAnterior < 5) {
        if (!db.objectStoreNames.contains('apuntesMateria')) {
          const apuntes = db.createObjectStore('apuntesMateria', { keyPath: 'id', autoIncrement: true });
          apuntes.createIndex('porAsignatura', 'asignatura', { unique: false });
          apuntes.createIndex('porActualizacion', 'actualizadoEn', { unique: false });
        }
        if (!db.objectStoreNames.contains('perfil')) {
          db.createObjectStore('perfil', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metas')) {
          db.createObjectStore('metas', { keyPath: 'id' });
        }
      }
    };

    peticion.onsuccess = () => {
      const db = peticion.result;
      db.onversionchange = () => {
        db.close();
        console.warn('La base de datos local cambió de versión; se cerró esta conexión para permitir la migración.');
      };
      resolve(db);
    };
    peticion.onerror = () => reject(peticion.error);
    peticion.onblocked = () => reject(new Error('Cierra otras pestañas de la app para actualizar la base de datos.'));
  });
}

export function listarApuntes(db: IDBDatabase): Promise<ApunteMateria[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('apuntesMateria', 'readonly').objectStore('apuntesMateria').getAll();
    request.onsuccess = () => resolve(request.result as ApunteMateria[]);
    request.onerror = () => reject(request.error);
  });
}

export function guardarApunte(
  db: IDBDatabase,
  apunte: Omit<ApunteMateria, 'creadoEn' | 'actualizadoEn'> & {
    creadoEn?: string;
    actualizadoEn?: string;
  }
): Promise<ApunteMateria> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('apuntesMateria', 'readwrite');
    const store = tx.objectStore('apuntesMateria');
    const ahora = new Date().toISOString();
    const guardado: ApunteMateria = {
      ...apunte,
      asignatura: apunte.asignatura.trim(),
      contenido: apunte.contenido.trim(),
      creadoEn: apunte.creadoEn ?? ahora,
      actualizadoEn: ahora
    };
    const request = guardado.id === undefined ? store.add(guardado) : store.put(guardado);
    request.onsuccess = () => {
      guardado.id = request.result as number;
    };
    tx.oncomplete = () => resolve(guardado);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar el apunte.'));
  });
}

export function eliminarApunte(db: IDBDatabase, id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('apuntesMateria', 'readwrite');
    tx.objectStore('apuntesMateria').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo eliminar el apunte.'));
  });
}

export function obtenerPerfil(db: IDBDatabase): Promise<PerfilEstudiante | undefined> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('perfil', 'readonly').objectStore('perfil').get('estudiante');
    request.onsuccess = () => resolve(request.result as PerfilEstudiante | undefined);
    request.onerror = () => reject(request.error);
  });
}

export function guardarPerfil(
  db: IDBDatabase,
  perfil: Omit<PerfilEstudiante, 'id' | 'actualizadoEn'>
): Promise<PerfilEstudiante> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('perfil', 'readwrite');
    const guardado: PerfilEstudiante = {
      ...perfil,
      id: 'estudiante',
      actualizadoEn: new Date().toISOString()
    };
    const request = tx.objectStore('perfil').put(guardado);
    request.onsuccess = () => resolve(guardado);
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function obtenerMetas(db: IDBDatabase): Promise<MetasEstudio | undefined> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('metas', 'readonly').objectStore('metas').get('actual');
    request.onsuccess = () => resolve(request.result as MetasEstudio | undefined);
    request.onerror = () => reject(request.error);
  });
}

export function guardarMetas(
  db: IDBDatabase,
  metas: Omit<MetasEstudio, 'id' | 'actualizadoEn'>
): Promise<MetasEstudio> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metas', 'readwrite');
    const guardadas: MetasEstudio = {
      ...metas,
      id: 'actual',
      actualizadoEn: new Date().toISOString()
    };
    const request = tx.objectStore('metas').put(guardadas);
    request.onsuccess = () => resolve(guardadas);
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function listarAsignaturas(db: IDBDatabase): Promise<Asignatura[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('asignaturas', 'readonly').objectStore('asignaturas').getAll();
    request.onsuccess = () => resolve(request.result as Asignatura[]);
    request.onerror = () => reject(request.error);
  });
}

export function guardarAsignatura(
  db: IDBDatabase,
  asignatura: Omit<Asignatura, 'creadoEn'> & { creadoEn?: string }
): Promise<Asignatura> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('asignaturas', 'readwrite');
    const store = tx.objectStore('asignaturas');
    const guardada: Asignatura = {
      ...asignatura,
      nombre: asignatura.nombre.trim(),
      creadoEn: asignatura.creadoEn ?? new Date().toISOString()
    };
    const request = guardada.id === undefined ? store.add(guardada) : store.put(guardada);
    request.onsuccess = () => {
      guardada.id = request.result as number;
    };
    tx.oncomplete = () => resolve(guardada);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la asignatura.'));
  });
}

export function eliminarAsignatura(db: IDBDatabase, id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['asignaturas', 'horarioClases'], 'readwrite');
    const horarios = tx.objectStore('horarioClases');
    const request = horarios.index('porAsignatura').getAll(id);
    request.onsuccess = () => {
      if (request.result.length > 0) {
        tx.abort();
        reject(new Error('Elimina primero las clases de esta asignatura del horario.'));
        return;
      }
      tx.objectStore('asignaturas').delete(id);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function listarClasesHorario(db: IDBDatabase): Promise<ClaseHorario[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('horarioClases', 'readonly').objectStore('horarioClases').getAll();
    request.onsuccess = () => resolve(request.result as ClaseHorario[]);
    request.onerror = () => reject(request.error);
  });
}

export function guardarClaseHorario(db: IDBDatabase, clase: ClaseHorario): Promise<ClaseHorario> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('horarioClases', 'readwrite');
    const request = clase.id === undefined
      ? tx.objectStore('horarioClases').add(clase)
      : tx.objectStore('horarioClases').put(clase);
    request.onsuccess = () => {
      clase.id = request.result as number;
    };
    tx.oncomplete = () => resolve(clase);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la clase.'));
  });
}

export function eliminarClaseHorario(db: IDBDatabase, id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('horarioClases', 'readwrite');
    tx.objectStore('horarioClases').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo eliminar la clase del horario.'));
  });
}

export function guardarSesionEstudio(db: IDBDatabase, sesion: SesionEstudio): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sesionesEstudio', 'readwrite');
    const request = tx.objectStore('sesionesEstudio').add(sesion);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function listarSesionesEstudio(db: IDBDatabase): Promise<SesionEstudio[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('sesionesEstudio', 'readonly').objectStore('sesionesEstudio').getAll();
    request.onsuccess = () => resolve(request.result as SesionEstudio[]);
    request.onerror = () => reject(request.error);
  });
}

export function guardarEntregaYEncolar(
  db: IDBDatabase,
  entrega: Omit<EntregaAcademica, 'id' | 'actualizadoEn'> & { id?: number }
): Promise<{ entrega: EntregaAcademica; cambio: CambioPendiente }> {
  return new Promise((resolve, reject) => {
    if (
      !('crypto' in window) ||
      typeof window.crypto === 'undefined' ||
      typeof window.crypto.randomUUID !== 'function'
    ) {
      reject(new Error('Este navegador no permite generar un identificador seguro para sincronizar.'));
      return;
    }

    const tx = db.transaction(['entregas', 'outbox'], 'readwrite');
    const entregas = tx.objectStore('entregas');
    const outbox = tx.objectStore('outbox');
    const payload: EntregaAcademica = {
      ...entrega,
      actualizadoEn: new Date().toISOString()
    };
    const operacion = payload.id === undefined ? 'crear' : 'actualizar';
    const guardar = operacion === 'crear' ? entregas.add(payload) : entregas.put(payload);
    const cambio: CambioPendiente = {
      idCambio: window.crypto.randomUUID(),
      entidad: 'entrega',
      operacion,
      payload,
      creadoEn: new Date().toISOString()
    };

    guardar.onsuccess = () => {
      payload.id = guardar.result as number;
      cambio.payload = payload;
      const encolar = outbox.add(cambio);
      encolar.onerror = () => reject(encolar.error);
    };
    guardar.onerror = () => reject(guardar.error);
    tx.oncomplete = () => resolve({ entrega: payload, cambio });
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la entrega y su sincronización.'));
  });
}

export function listarEntregas(db: IDBDatabase): Promise<EntregaAcademica[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('entregas', 'readonly').objectStore('entregas').getAll();
    request.onsuccess = () => resolve(request.result as EntregaAcademica[]);
    request.onerror = () => reject(request.error);
  });
}

export function listarCambiosPendientes(db: IDBDatabase): Promise<CambioPendiente[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('outbox', 'readonly').objectStore('outbox').getAll();
    request.onsuccess = () => resolve(request.result as CambioPendiente[]);
    request.onerror = () => reject(request.error);
  });
}

export function quitarCambioPendiente(db: IDBDatabase, idCambio: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').delete(idCambio);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo retirar el cambio sincronizado.'));
  });
}

export function agregarNotaPrivada(db: IDBDatabase, nota: NotaPrivada): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notasPrivadas', 'readwrite');
    const peticion = tx.objectStore('notasPrivadas').add(nota);
    peticion.onsuccess = () => resolve(peticion.result as number);
    peticion.onerror = () => reject(peticion.error);
  });
}

export function obtenerNotasPrivadas(db: IDBDatabase): Promise<NotaPrivada[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notasPrivadas', 'readonly');
    const peticion = tx.objectStore('notasPrivadas').getAll();
    peticion.onsuccess = () => resolve(peticion.result as NotaPrivada[]);
    peticion.onerror = () => reject(peticion.error);
  });
}

export function asegurarRegistro(db: IDBDatabase, registro: Omit<RegistroApp, 'id'>): Promise<RegistroApp> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros', 'readwrite');
    const store = tx.objectStore('registros');
    const buscar = store.index('porClave').get(registro.clave);

    buscar.onsuccess = () => {
      if (buscar.result) {
        resolve(buscar.result as RegistroApp);
        return;
      }

      const agregar = store.add(registro);
      agregar.onsuccess = () => resolve({ ...registro, id: agregar.result as number });
      agregar.onerror = () => reject(agregar.error);
    };
    buscar.onerror = () => reject(buscar.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function eliminarRegistro(db: IDBDatabase, id: number): Promise<RegistroApp | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros', 'readwrite');
    const store = tx.objectStore('registros');
    const buscar = store.get(id);
    let eliminado: RegistroApp | undefined;

    buscar.onsuccess = () => {
      if (!buscar.result) return;
      eliminado = buscar.result as RegistroApp;
      store.delete(id);
    };
    buscar.onerror = () => reject(buscar.error);
    tx.oncomplete = () => resolve(eliminado);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo eliminar el registro.'));
  });
}

export function guardarFechaParcial(db: IDBDatabase, fechaObjetivo: string): Promise<RegistroApp> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros', 'readwrite');
    const store = tx.objectStore('registros');
    const buscar = store.index('porClave').get('parcial-proximo');

    buscar.onsuccess = () => {
      const existente = buscar.result as RegistroApp | undefined;
      const parcial: RegistroApp = {
        id: existente?.id,
        clave: 'parcial-proximo',
        tipo: 'parcial',
        titulo: 'Próximo parcial',
        fechaObjetivo
      };
      const guardar = store.put(parcial);
      guardar.onsuccess = () => {
        parcial.id = guardar.result as number;
        resolve(parcial);
      };
      guardar.onerror = () => reject(guardar.error);
    };
    buscar.onerror = () => reject(buscar.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function restaurarRegistro(db: IDBDatabase, registro: RegistroApp): Promise<RegistroApp> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros', 'readwrite');
    const store = tx.objectStore('registros');
    const buscar = store.index('porClave').get(registro.clave);
    let restaurado: RegistroApp | undefined;

    buscar.onsuccess = () => {
      if (buscar.result) {
        restaurado = buscar.result as RegistroApp;
        return;
      }

      const registroNuevo = {
        clave: registro.clave,
        tipo: registro.tipo,
        titulo: registro.titulo,
        fechaObjetivo: registro.fechaObjetivo
      };
      const agregar = store.add(registroNuevo);
      agregar.onsuccess = () => {
        restaurado = { ...registroNuevo, id: agregar.result as number };
      };
      agregar.onerror = () => reject(agregar.error);
    };
    buscar.onerror = () => reject(buscar.error);
    tx.oncomplete = () => {
      if (restaurado) {
        resolve(restaurado);
      } else {
        reject(new Error('No se pudo restaurar el registro.'));
      }
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo restaurar el registro.'));
  });
}

export function guardarEvidencia(db: IDBDatabase, evidencia: EvidenciaLocal): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('evidencias', 'readwrite');
    const agregar = tx.objectStore('evidencias').add(evidencia);
    agregar.onsuccess = () => resolve(agregar.result as number);
    agregar.onerror = () => reject(agregar.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function obtenerUltimaFotoPerfil(db: IDBDatabase): Promise<Blob | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('evidencias', 'readonly');
    const buscar = tx.objectStore('evidencias').openCursor(null, 'prev');
    buscar.onsuccess = () => {
      const cursor = buscar.result;
      if (!cursor) {
        resolve(undefined);
        return;
      }
      const evidencia = cursor.value as EvidenciaLocal;
      if (evidencia.propietarioTipo === 'perfil' && evidencia.propietarioId === 'estudiante') {
        resolve(evidencia.imagen);
      } else {
        cursor.continue();
      }
    };
    buscar.onerror = () => reject(buscar.error);
  });
}