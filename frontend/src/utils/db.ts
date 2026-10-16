export interface NotaPrivada {
  id?: number;
  materiaNombre: string;
  titulo: string;
  fechaCreacion: string;
  contenidoCifrado: ArrayBuffer;
  iv: Uint8Array;
  sal?: Uint8Array;
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

    const peticion = window.indexedDB.open('centro-mando-db', 2);

    peticion.onupgradeneeded = () => {
      const db = peticion.result;

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
      if (!db.objectStoreNames.contains('registros')) {
        const registros = db.createObjectStore('registros', { keyPath: 'id', autoIncrement: true });
        registros.createIndex('porClave', 'clave', { unique: true });
      }
      if (!db.objectStoreNames.contains('evidencias')) {
        db.createObjectStore('evidencias', { keyPath: 'id', autoIncrement: true });
      }
    };

    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
    peticion.onblocked = () => reject(new Error('Cierra otras pestañas de la app para actualizar la base de datos.'));
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