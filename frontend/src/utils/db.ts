export interface NotaPrivada {
  id?: number;
  materiaNombre: string;
  titulo: string;
  fechaCreacion: string;
  contenidoCifrado: ArrayBuffer;
  iv: Uint8Array;
}

export function abrirBaseDeDatos(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open('centro-mando-db', 1);

    peticion.onupgradeneeded = event => {
      const db = peticion.result;
      const version = event.oldVersion;

      if (version < 1) {
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
    };

    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
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