import { getCurrentUsername } from '../services/api';

export interface NotaPrivada {
  id?: number;
  ownerUsername?: string;
  materiaNombre: string;
  titulo: string;
  fechaCreacion: string;
  contenidoCifrado: ArrayBuffer;
  iv: Uint8Array;
  sal?: Uint8Array;
}

export interface ApunteMateria {
  id?: number;
  ownerUsername?: string;
  backendId?: number;
  syncPending?: boolean;
  asignaturaId?: number;
  asignatura: string;
  contenido: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface PerfilEstudiante {
  id: string;
  nombre: string;
  nombreUsuario: string;
  foto?: Blob;
  actualizadoEn: string;
  syncPending?: boolean;
}

export interface CredencialOffline {
  username: string;
  firstName: string;
  lastName: string;
  salt: Uint8Array;
  verifier: Uint8Array;
  passwordKey: CryptoKey;
  passwordIv: Uint8Array;
  encryptedPassword: ArrayBuffer;
  pendingRegistration: boolean;
}

export interface MetasEstudio {
  id: string;
  ownerUsername?: string;
  minutosSemanales: number;
  actualizadoEn: string;
  syncPending?: boolean;
}

export interface Asignatura {
  id?: number;
  ownerUsername?: string;
  backendId?: number;
  syncPending?: boolean;
  nombre: string;
  creadoEn: string;
}

export interface ClaseHorario {
  id?: number;
  ownerUsername?: string;
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
  ownerUsername?: string;
  backendId?: number;
  asignatura: string;
  tipo: 'pomodoro' | 'cronometro';
  inicio: string;
  fin: string;
  duracionSegundos: number;
}

export interface RegistroApp {
  id?: number;
  ownerUsername?: string;
  clave: string;
  tipo: 'clase' | 'entrega' | 'parcial' | 'bloque-estudio';
  titulo: string;
  fechaObjetivo?: string;
  eliminadoEn?: string;
}

export interface EvidenciaLocal {
  ownerUsername?: string;
  propietarioTipo: 'perfil' | 'entrega' | 'asignatura';
  propietarioId: string;
  creadoEn: string;
  imagen: Blob;
}

export interface EntregaAcademica {
  id?: number;
  ownerUsername?: string;
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
  actualizadoEn: string;
}

export interface CambioPendiente {
  idCambio: string;
  ownerUsername?: string;
  entidad: 'entrega';
  operacion: 'crear' | 'actualizar';
  payload: EntregaAcademica;
  creadoEn: string;
}

export function describirErrorConexionBaseDatos(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : String(error);
  if (
    (error instanceof DOMException && error.name === 'InvalidStateError') ||
    /database connection is closing|database is closing/i.test(message)
  ) {
    return 'El almacenamiento local se está actualizando. La aplicación se recargará; vuelve a intentarlo en unos segundos. Tus datos guardados no se borraron.';
  }
  return undefined;
}

function usuarioActual(): string | undefined {
  return getCurrentUsername();
}

function requerirUsuarioActual(): string {
  const username = usuarioActual();
  if (!username) throw new Error('Inicia sesión para acceder a los datos guardados en este dispositivo.');
  return username;
}

function perteneceAlUsuario(record: { ownerUsername?: string }, username: string): boolean {
  return record.ownerUsername === username;
}

function verificarPropietario(
  record: { ownerUsername?: string },
  username: string
): void {
  if (record.ownerUsername !== undefined && record.ownerUsername !== username) {
    throw new Error('No puedes modificar datos de otra cuenta.');
  }
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

    const peticion = window.indexedDB.open('centro-mando-db', 9);

    peticion.onupgradeneeded = event => {
      const db = peticion.result;
      const versionAnterior = event.oldVersion;

      if (versionAnterior < 1) {
        if (!db.objectStoreNames.contains('asignaturas')) {
          const storeAsignaturas = db.createObjectStore('asignaturas', { keyPath: 'id', autoIncrement: true });
          storeAsignaturas.createIndex('porNombre', ['ownerUsername', 'nombre'], { unique: true });
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
          registros.createIndex('porClave', ['ownerUsername', 'clave'], { unique: true });
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
        horarios.createIndex('porAsignatura', ['ownerUsername', 'asignaturaId'], { unique: false });
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

      if (versionAnterior < 6 && !db.objectStoreNames.contains('authCredentials')) {
        db.createObjectStore('authCredentials', { keyPath: 'username' });
      }

      if (versionAnterior < 7) {
        const transaction = peticion.transaction;
        if (!transaction) throw new Error('No se pudo actualizar el almacenamiento local.');

        for (const storeName of ['entregas', 'metas', 'outbox']) {
          if (!db.objectStoreNames.contains(storeName)) continue;
          const request = transaction.objectStore(storeName).openCursor();
          request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor) return;

            const record = cursor.value as Record<string, unknown>;
            let changed = false;
            const fields = storeName === 'entregas'
              ? ['calificacion', 'notaMaxima']
              : storeName === 'metas' ? ['promedioDeseado'] : [];
            for (const field of fields) {
              if (Object.prototype.hasOwnProperty.call(record, field)) {
                delete record[field];
                changed = true;
              }
            }
            if (storeName === 'outbox') {
              const payload = record.payload;
              if (typeof payload === 'object' && payload !== null) {
                const delivery = payload as Record<string, unknown>;
                for (const field of ['calificacion', 'notaMaxima']) {
                  if (Object.prototype.hasOwnProperty.call(delivery, field)) {
                    delete delivery[field];
                    changed = true;
                  }
                }
              }
            }
            if (changed) cursor.update(record);
            cursor.continue();
          };
        }
      }

      if (versionAnterior < 8 && db.objectStoreNames.contains('perfil')) {
        const transaction = peticion.transaction;
        if (!transaction) throw new Error('No se pudo migrar el perfil local.');
        const store = transaction.objectStore('perfil');
        const request = store.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          const profile = cursor.value as PerfilEstudiante;
          if (profile.id === 'estudiante' && profile.nombreUsuario.trim()) {
            cursor.delete();
            store.put({ ...profile, id: profile.nombreUsuario });
          }
          cursor.continue();
        };
      }

      if (versionAnterior < 9) {
        const transaction = peticion.transaction;
        if (!transaction) throw new Error('No se pudo aislar los datos locales por cuenta.');

        const updateIndex = (
          storeName: string,
          indexName: string,
          keyPath: string | string[],
          unique: boolean
        ): void => {
          if (!db.objectStoreNames.contains(storeName)) return;
          const store = transaction.objectStore(storeName);
          if (store.indexNames.contains(indexName)) store.deleteIndex(indexName);
          store.createIndex(indexName, keyPath, { unique });
        };
        updateIndex('asignaturas', 'porNombre', ['ownerUsername', 'nombre'], true);
        updateIndex('registros', 'porClave', ['ownerUsername', 'clave'], true);
        updateIndex('horarioClases', 'porAsignatura', ['ownerUsername', 'asignaturaId'], false);

        const credentialsRequest = transaction.objectStore('authCredentials').getAll();
        credentialsRequest.onsuccess = () => {
          const credentials = credentialsRequest.result as CredencialOffline[];
          const migrateLegacyData = (legacyUsername: string): void => {
            const dataStores = [
              'asignaturas',
              'entregas',
              'sesionesEstudio',
              'notasPrivadas',
              'registros',
              'evidencias',
              'outbox',
              'horarioClases',
              'apuntesMateria',
              'metas'
            ];
            for (const storeName of dataStores) {
              if (!db.objectStoreNames.contains(storeName)) continue;
              const store = transaction.objectStore(storeName);
              const request = store.openCursor();
              request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) return;
                const record = cursor.value as Record<string, unknown>;
                if (storeName === 'outbox' &&
                    typeof record.payload === 'object' &&
                    record.payload !== null) {
                  record.payload = {
                    ...(record.payload as Record<string, unknown>),
                    ownerUsername: legacyUsername
                  };
                }
                if (storeName === 'metas' && record.id === 'actual') {
                  store.put({
                    ...record,
                    id: `${legacyUsername}:actual`,
                    ownerUsername: legacyUsername
                  });
                  cursor.delete();
                } else if (record.ownerUsername === undefined) {
                  cursor.update({ ...record, ownerUsername: legacyUsername });
                }
                cursor.continue();
              };
            }
          };
          if (credentials.length === 1) {
            migrateLegacyData(credentials[0].username);
          } else if (credentials.length === 0 && db.objectStoreNames.contains('perfil')) {
            const profileRequest = transaction.objectStore('perfil').getAll();
            profileRequest.onsuccess = () => {
              const usernames = new Set(
                (profileRequest.result as PerfilEstudiante[])
                  .map(profile => profile.nombreUsuario.trim())
                  .filter(Boolean)
              );
              if (usernames.size === 1) migrateLegacyData([...usernames][0]);
            };
          }
        };
      }
    };

    peticion.onsuccess = () => {
      const db = peticion.result;
      db.onversionchange = () => {
        db.close();
        console.warn('La base de datos local cambió de versión; se cerró esta conexión para permitir la migración.');
        window.setTimeout(() => window.location.reload(), 1200);
      };
      resolve(db);
    };
    peticion.onerror = () => reject(peticion.error);
    peticion.onblocked = () => reject(new Error('Cierra otras pestañas de la app para actualizar la base de datos.'));
  });
}

export function obtenerCredencialOffline(
  db: IDBDatabase,
  username: string
): Promise<CredencialOffline | undefined> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('authCredentials', 'readonly')
      .objectStore('authCredentials')
      .get(username);
    request.onsuccess = () => resolve(request.result as CredencialOffline | undefined);
    request.onerror = () => reject(request.error);
  });
}

export function guardarCredencialOffline(
  db: IDBDatabase,
  credential: CredencialOffline
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('authCredentials', 'readwrite');
    tx.objectStore('authCredentials').put(credential);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la credencial local.'));
  });
}

export function listarApuntes(db: IDBDatabase): Promise<ApunteMateria[]> {
  const username = usuarioActual();
  if (!username) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const request = db.transaction('apuntesMateria', 'readonly').objectStore('apuntesMateria').getAll();
    request.onsuccess = () => resolve(
      usuarioActual() === username
        ? (request.result as ApunteMateria[]).filter(apunte => perteneceAlUsuario(apunte, username))
        : []
    );
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
  const username = requerirUsuarioActual();
  verificarPropietario(apunte, username);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('apuntesMateria', 'readwrite');
    const store = tx.objectStore('apuntesMateria');
    const ahora = new Date().toISOString();
    const guardado: ApunteMateria = {
      ...apunte,
      ownerUsername: username,
      asignatura: apunte.asignatura.trim(),
      contenido: apunte.contenido.trim(),
      creadoEn: apunte.creadoEn ?? ahora,
      actualizadoEn: ahora
    };
    const guardar = (): void => {
      const request = guardado.id === undefined ? store.add(guardado) : store.put(guardado);
      request.onsuccess = () => {
        guardado.id = request.result as number;
      };
      request.onerror = () => reject(request.error);
    };
    if (guardado.id === undefined) {
      guardar();
    } else {
      const existingRequest = store.get(guardado.id);
      existingRequest.onsuccess = () => {
        if (existingRequest.result && !perteneceAlUsuario(existingRequest.result as ApunteMateria, username)) {
          tx.abort();
          reject(new Error('No puedes modificar datos de otra cuenta.'));
          return;
        }
        guardar();
      };
      existingRequest.onerror = () => reject(existingRequest.error);
    }
    tx.oncomplete = () => resolve(guardado);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar el apunte.'));
  });
}

export function eliminarApunte(db: IDBDatabase, id: number): Promise<void> {
  const username = usuarioActual();
  if (!username) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('apuntesMateria', 'readwrite');
    const store = tx.objectStore('apuntesMateria');
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result && perteneceAlUsuario(request.result as ApunteMateria, username)) {
        store.delete(id);
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo eliminar el apunte.'));
  });
}

export function obtenerPerfil(db: IDBDatabase, username: string): Promise<PerfilEstudiante | undefined> {
  if (usuarioActual() !== username) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const request = db.transaction('perfil', 'readonly').objectStore('perfil').get(username);
    request.onsuccess = () => resolve(
      usuarioActual() === username
        ? request.result as PerfilEstudiante | undefined
        : undefined
    );
    request.onerror = () => reject(request.error);
  });
}

export function guardarPerfil(
  db: IDBDatabase,
  perfil: Omit<PerfilEstudiante, 'id' | 'actualizadoEn'>
): Promise<PerfilEstudiante> {
  if (requerirUsuarioActual() !== perfil.nombreUsuario) {
    return Promise.reject(new Error('No puedes modificar el perfil de otra cuenta.'));
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('perfil', 'readwrite');
    const guardado: PerfilEstudiante = {
      ...perfil,
      id: perfil.nombreUsuario,
      actualizadoEn: new Date().toISOString()
    };
    const request = tx.objectStore('perfil').put(guardado);
    request.onsuccess = () => resolve(guardado);
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function obtenerMetas(db: IDBDatabase): Promise<MetasEstudio | undefined> {
  const username = usuarioActual();
  if (!username) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const request = db.transaction('metas', 'readonly').objectStore('metas').get(`${username}:actual`);
    request.onsuccess = () => {
      const stored = request.result as MetasEstudio | undefined;
      resolve(usuarioActual() === username && stored ? { ...stored, id: 'actual' } : undefined);
    };
    request.onerror = () => reject(request.error);
  });
}

export function guardarMetas(
  db: IDBDatabase,
  metas: Omit<MetasEstudio, 'id' | 'actualizadoEn'>
): Promise<MetasEstudio> {
  const username = requerirUsuarioActual();
  verificarPropietario(metas, username);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metas', 'readwrite');
    const guardadas: MetasEstudio = {
      ...metas,
      id: `${username}:actual`,
      ownerUsername: username,
      actualizadoEn: new Date().toISOString()
    };
    const request = tx.objectStore('metas').put(guardadas);
    request.onsuccess = () => resolve({ ...guardadas, id: 'actual' });
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function listarAsignaturas(db: IDBDatabase): Promise<Asignatura[]> {
  const username = usuarioActual();
  if (!username) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const request = db.transaction('asignaturas', 'readonly').objectStore('asignaturas').getAll();
    request.onsuccess = () => resolve(
      usuarioActual() === username
        ? (request.result as Asignatura[]).filter(asignatura => perteneceAlUsuario(asignatura, username))
        : []
    );
    request.onerror = () => reject(request.error);
  });
}

export function guardarAsignatura(
  db: IDBDatabase,
  asignatura: Omit<Asignatura, 'creadoEn'> & { creadoEn?: string }
): Promise<Asignatura> {
  const username = requerirUsuarioActual();
  verificarPropietario(asignatura, username);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('asignaturas', 'readwrite');
    const store = tx.objectStore('asignaturas');
    const guardada: Asignatura = {
      ...asignatura,
      ownerUsername: username,
      nombre: asignatura.nombre.trim(),
      creadoEn: asignatura.creadoEn ?? new Date().toISOString()
    };
    const guardar = (): void => {
      const request = guardada.id === undefined ? store.add(guardada) : store.put(guardada);
      request.onsuccess = () => {
        guardada.id = request.result as number;
      };
      request.onerror = () => reject(request.error);
    };
    if (guardada.id === undefined) {
      guardar();
    } else {
      const existingRequest = store.get(guardada.id);
      existingRequest.onsuccess = () => {
        if (existingRequest.result && !perteneceAlUsuario(existingRequest.result as Asignatura, username)) {
          tx.abort();
          reject(new Error('No puedes modificar datos de otra cuenta.'));
          return;
        }
        guardar();
      };
      existingRequest.onerror = () => reject(existingRequest.error);
    }
    tx.oncomplete = () => resolve(guardada);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la asignatura.'));
  });
}

export function eliminarAsignatura(db: IDBDatabase, id: number): Promise<void> {
  const username = requerirUsuarioActual();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['asignaturas', 'horarioClases'], 'readwrite');
    const asignaturas = tx.objectStore('asignaturas');
    const horarios = tx.objectStore('horarioClases');
    const assignmentRequest = asignaturas.get(id);
    assignmentRequest.onsuccess = () => {
      if (!assignmentRequest.result ||
          !perteneceAlUsuario(assignmentRequest.result as Asignatura, username)) {
        tx.abort();
        reject(new Error('No se encontró la asignatura de esta cuenta.'));
        return;
      }
      const request = horarios.index('porAsignatura').getAll([username, id]);
      request.onsuccess = () => {
        if (request.result.length > 0) {
          tx.abort();
          reject(new Error('Elimina primero las clases de esta asignatura del horario.'));
          return;
        }
        asignaturas.delete(id);
      };
      request.onerror = () => reject(request.error);
    };
    assignmentRequest.onerror = () => reject(assignmentRequest.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function listarClasesHorario(db: IDBDatabase): Promise<ClaseHorario[]> {
  const username = usuarioActual();
  if (!username) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const request = db.transaction('horarioClases', 'readonly').objectStore('horarioClases').getAll();
    request.onsuccess = () => resolve(
      usuarioActual() === username
        ? (request.result as ClaseHorario[]).filter(clase => perteneceAlUsuario(clase, username))
        : []
    );
    request.onerror = () => reject(request.error);
  });
}

export function guardarClaseHorario(db: IDBDatabase, clase: ClaseHorario): Promise<ClaseHorario> {
  const username = requerirUsuarioActual();
  verificarPropietario(clase, username);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('horarioClases', 'readwrite');
    const store = tx.objectStore('horarioClases');
    const ownedClass = { ...clase, ownerUsername: username };
    const guardar = (): void => {
      const request = ownedClass.id === undefined
        ? store.add(ownedClass)
        : store.put(ownedClass);
      request.onsuccess = () => {
        ownedClass.id = request.result as number;
        clase.id = ownedClass.id;
        clase.ownerUsername = username;
      };
      request.onerror = () => reject(request.error);
    };
    if (ownedClass.id === undefined) {
      guardar();
    } else {
      const existingRequest = store.get(ownedClass.id);
      existingRequest.onsuccess = () => {
        if (existingRequest.result &&
            !perteneceAlUsuario(existingRequest.result as ClaseHorario, username)) {
          tx.abort();
          reject(new Error('No puedes modificar datos de otra cuenta.'));
          return;
        }
        guardar();
      };
      existingRequest.onerror = () => reject(existingRequest.error);
    }
    tx.oncomplete = () => resolve(clase);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la clase.'));
  });
}

export function eliminarClaseHorario(db: IDBDatabase, id: number): Promise<void> {
  const username = usuarioActual();
  if (!username) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('horarioClases', 'readwrite');
    const store = tx.objectStore('horarioClases');
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result && perteneceAlUsuario(request.result as ClaseHorario, username)) {
        store.delete(id);
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo eliminar la clase del horario.'));
  });
}

export function guardarSesionEstudio(db: IDBDatabase, sesion: SesionEstudio): Promise<number> {
  const username = requerirUsuarioActual();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sesionesEstudio', 'readwrite');
    const request = tx.objectStore('sesionesEstudio').add({ ...sesion, ownerUsername: username });
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function listarSesionesEstudio(db: IDBDatabase): Promise<SesionEstudio[]> {
  const username = usuarioActual();
  if (!username) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const request = db.transaction('sesionesEstudio', 'readonly').objectStore('sesionesEstudio').getAll();
    request.onsuccess = () => resolve(
      usuarioActual() === username
        ? (request.result as SesionEstudio[]).filter(sesion => perteneceAlUsuario(sesion, username))
        : []
    );
    request.onerror = () => reject(request.error);
  });
}

export function guardarEntregaYEncolar(
  db: IDBDatabase,
  entrega: Omit<EntregaAcademica, 'id' | 'actualizadoEn'> & { id?: number }
): Promise<{ entrega: EntregaAcademica; cambio: CambioPendiente }> {
  const username = requerirUsuarioActual();
  verificarPropietario(entrega, username);
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
      ownerUsername: username,
      actualizadoEn: new Date().toISOString()
    };
    const operacion = payload.id === undefined ? 'crear' : 'actualizar';
    const cambio: CambioPendiente = {
      idCambio: window.crypto.randomUUID(),
      ownerUsername: username,
      entidad: 'entrega',
      operacion,
      payload,
      creadoEn: new Date().toISOString()
    };

    const guardar = (): void => {
      const request = operacion === 'crear' ? entregas.add(payload) : entregas.put(payload);
      request.onsuccess = () => {
        payload.id = request.result as number;
        cambio.payload = payload;
        const encolar = outbox.add(cambio);
        encolar.onerror = () => reject(encolar.error);
      };
      request.onerror = () => reject(request.error);
    };
    if (operacion === 'crear') {
      guardar();
    } else {
      const existingRequest = entregas.get(payload.id as number);
      existingRequest.onsuccess = () => {
        if (!existingRequest.result ||
            !perteneceAlUsuario(existingRequest.result as EntregaAcademica, username)) {
          tx.abort();
          reject(new Error('No se encontró la entrega de esta cuenta.'));
          return;
        }
        guardar();
      };
      existingRequest.onerror = () => reject(existingRequest.error);
    }
    tx.oncomplete = () => resolve({ entrega: payload, cambio });
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo guardar la entrega y su sincronización.'));
  });
}

export function listarEntregas(db: IDBDatabase): Promise<EntregaAcademica[]> {
  const username = usuarioActual();
  if (!username) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const request = db.transaction('entregas', 'readonly').objectStore('entregas').getAll();
    request.onsuccess = () => resolve(
      usuarioActual() === username
        ? (request.result as EntregaAcademica[]).filter(entrega => perteneceAlUsuario(entrega, username))
        : []
    );
    request.onerror = () => reject(request.error);
  });
}

export function listarCambiosPendientes(db: IDBDatabase): Promise<CambioPendiente[]> {
  const username = usuarioActual();
  if (!username) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const request = db.transaction('outbox', 'readonly').objectStore('outbox').getAll();
    request.onsuccess = () => resolve(
      usuarioActual() === username
        ? (request.result as CambioPendiente[]).filter(cambio => perteneceAlUsuario(cambio, username))
        : []
    );
    request.onerror = () => reject(request.error);
  });
}

export function quitarCambioPendiente(db: IDBDatabase, idCambio: string): Promise<void> {
  const username = usuarioActual();
  if (!username) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    const store = tx.objectStore('outbox');
    const request = store.get(idCambio);
    request.onsuccess = () => {
      if (request.result && perteneceAlUsuario(request.result as CambioPendiente, username)) {
        store.delete(idCambio);
      }
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo retirar el cambio.'));
  });
}

export function agregarNotaPrivada(db: IDBDatabase, nota: NotaPrivada): Promise<number> {
  const username = requerirUsuarioActual();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notasPrivadas', 'readwrite');
    const peticion = tx.objectStore('notasPrivadas').add({ ...nota, ownerUsername: username });
    peticion.onsuccess = () => resolve(peticion.result as number);
    peticion.onerror = () => reject(peticion.error);
  });
}

export function obtenerNotasPrivadas(db: IDBDatabase): Promise<NotaPrivada[]> {
  const username = usuarioActual();
  if (!username) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notasPrivadas', 'readonly');
    const peticion = tx.objectStore('notasPrivadas').getAll();
    peticion.onsuccess = () => resolve(
      usuarioActual() === username
        ? (peticion.result as NotaPrivada[]).filter(nota => perteneceAlUsuario(nota, username))
        : []
    );
    peticion.onerror = () => reject(peticion.error);
  });
}

export function asegurarRegistro(db: IDBDatabase, registro: Omit<RegistroApp, 'id'>): Promise<RegistroApp> {
  const username = requerirUsuarioActual();
  verificarPropietario(registro, username);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros', 'readwrite');
    const store = tx.objectStore('registros');
    const registroConUsuario = { ...registro, ownerUsername: username };
    const buscar = store.index('porClave').get([username, registro.clave]);

    buscar.onsuccess = () => {
      if (buscar.result) {
        resolve(buscar.result as RegistroApp);
        return;
      }

      const agregar = store.add(registroConUsuario);
      agregar.onsuccess = () => resolve({ ...registroConUsuario, id: agregar.result as number });
      agregar.onerror = () => reject(agregar.error);
    };
    buscar.onerror = () => reject(buscar.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function eliminarRegistro(db: IDBDatabase, id: number): Promise<RegistroApp | undefined> {
  const username = usuarioActual();
  if (!username) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros', 'readwrite');
    const store = tx.objectStore('registros');
    const buscar = store.get(id);
    let eliminado: RegistroApp | undefined;

    buscar.onsuccess = () => {
      if (!buscar.result) return;
      const registro = buscar.result as RegistroApp;
      if (!perteneceAlUsuario(registro, username)) return;
      eliminado = registro;
      store.delete(id);
    };
    buscar.onerror = () => reject(buscar.error);
    tx.oncomplete = () => resolve(eliminado);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('No se pudo eliminar el registro.'));
  });
}

export function guardarFechaParcial(db: IDBDatabase, fechaObjetivo: string): Promise<RegistroApp> {
  const username = requerirUsuarioActual();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros', 'readwrite');
    const store = tx.objectStore('registros');
    const buscar = store.index('porClave').get([username, 'parcial-proximo']);

    buscar.onsuccess = () => {
      const existente = buscar.result as RegistroApp | undefined;
      const parcial: RegistroApp = {
        id: existente?.id,
        ownerUsername: username,
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
  const username = requerirUsuarioActual();
  verificarPropietario(registro, username);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros', 'readwrite');
    const store = tx.objectStore('registros');
    const buscar = store.index('porClave').get([username, registro.clave]);
    let restaurado: RegistroApp | undefined;

    buscar.onsuccess = () => {
      if (buscar.result) {
        restaurado = buscar.result as RegistroApp;
        return;
      }

      const registroNuevo = {
        ownerUsername: username,
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
  const username = requerirUsuarioActual();
  verificarPropietario(evidencia, username);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('evidencias', 'readwrite');
    const agregar = tx.objectStore('evidencias').add({ ...evidencia, ownerUsername: username });
    agregar.onsuccess = () => resolve(agregar.result as number);
    agregar.onerror = () => reject(agregar.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function obtenerUltimaFotoPerfil(db: IDBDatabase): Promise<Blob | undefined> {
  const username = usuarioActual();
  if (!username) return Promise.resolve(undefined);
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
      if (usuarioActual() !== username) {
        resolve(undefined);
        return;
      }
      if (perteneceAlUsuario(evidencia, username) &&
          evidencia.propietarioTipo === 'perfil' &&
          (evidencia.propietarioId === username || evidencia.propietarioId === 'estudiante')) {
        resolve(evidencia.imagen);
      } else {
        cursor.continue();
      }
    };
    buscar.onerror = () => reject(buscar.error);
  });
}