import {
  abrirBaseDeDatos,
  agregarNotaPrivada,
  obtenerNotasPrivadas,
  type NotaPrivada
} from '../utils/db';
import { derivarClave, cifrarTexto, descifrarTexto } from '../utils/crypto';

export function inicializarNotas(): Promise<IDBDatabase | undefined> {
  let db: IDBDatabase | undefined;
  const cryptoOutput = document.getElementById('crypto-output') as HTMLDivElement;
  const btnGuardar = document.getElementById('btn-guardar') as HTMLButtonElement;
  const btnCargar = document.getElementById('btn-cargar') as HTMLButtonElement;
  btnGuardar.disabled = true;
  btnCargar.disabled = true;
  cryptoOutput.classList.add('is-loading');
  cryptoOutput.setAttribute('aria-busy', 'true');
  cryptoOutput.textContent = 'Preparando el almacenamiento local…';

  let databaseReady: Promise<IDBDatabase | undefined>;
  if (
    'indexedDB' in window &&
    typeof window.indexedDB !== 'undefined' &&
    typeof window.indexedDB.open === 'function'
  ) {
    databaseReady = abrirBaseDeDatos().then(database => {
      db = database;
      console.log('IndexedDB conectada correctamente para Centro de Mando');
      cryptoOutput.classList.remove('is-loading');
      cryptoOutput.removeAttribute('aria-busy');
      cryptoOutput.textContent = 'Almacenamiento local listo. Tus notas se guardan en este dispositivo.';
      btnGuardar.disabled = false;
      btnCargar.disabled = false;
      return database;
    }).catch(err => {
      console.error('Error al abrir la BD:', err);
      cryptoOutput.classList.remove('is-loading');
      cryptoOutput.removeAttribute('aria-busy');
      cryptoOutput.classList.add('state-error');
      cryptoOutput.textContent = 'No fue posible abrir el almacenamiento local. Las notas no están disponibles.';
      return undefined;
    });
  } else {
    cryptoOutput.classList.remove('is-loading');
    cryptoOutput.removeAttribute('aria-busy');
    cryptoOutput.classList.add('state-error');
    cryptoOutput.textContent = 'Este navegador no admite IndexedDB; las notas privadas no están disponibles.';
    databaseReady = Promise.resolve(undefined);
  }

  const passInput = document.getElementById('pass-key') as HTMLInputElement;
  const notaInput = document.getElementById('nota-input') as HTMLTextAreaElement;
  const materiaSelect = document.getElementById('nota-materia') as HTMLSelectElement;
  const output = cryptoOutput;

  btnGuardar.addEventListener('click', async () => {
    const password = passInput.value;
    const textoNota = notaInput.value;
    const materia = materiaSelect.value;

    if (!password || !textoNota) {
      output.className = 'crypto-result state-error';
      output.innerHTML = 'Escribe la contraseña y el contenido de la nota primero.';
      return;
    }

    if (!db) {
      output.className = 'crypto-result state-error';
      output.textContent = 'El almacenamiento local no está disponible en este navegador.';
      return;
    }

    try {
      const salt = new Uint8Array(16);
      if (
        !('crypto' in window) ||
        typeof window.crypto === 'undefined' ||
        typeof window.crypto.getRandomValues !== 'function'
      ) {
        throw new Error('La generación segura de números aleatorios no está disponible.');
      }
      window.crypto.getRandomValues(salt);
      const clave = await derivarClave(password, salt);
      const { cifrado, iv } = await cifrarTexto(clave, textoNota);

      const nuevaNota: NotaPrivada = {
        materiaNombre: materia,
        titulo: `Nota de ${materia}`,
        fechaCreacion: new Date().toISOString(),
        contenidoCifrado: cifrado,
        iv,
        sal: salt
      };

      await agregarNotaPrivada(db, nuevaNota);
      output.className = 'crypto-result state-success';
      output.replaceChildren();
      const mensajeGuardado = document.createElement('strong');
      mensajeGuardado.textContent = 'Nota cifrada con AES-GCM 256 bits y almacenada con éxito.';
      const detallesGuardado = document.createElement('small');
      detallesGuardado.textContent = `Materia: ${materia} • ${new Date().toLocaleTimeString()}`;
      output.append(mensajeGuardado, document.createElement('br'), detallesGuardado);
      notaInput.value = '';
    } catch (error) {
      console.error(error);
      output.className = 'crypto-result state-error';
      output.textContent = error instanceof Error
        ? `Error al cifrar la nota: ${error.message}`
        : 'Error al cifrar la nota.';
    }
  });

  btnCargar.addEventListener('click', async () => {
    const password = passInput.value;

    if (!password) {
      output.className = 'crypto-result state-error';
      output.innerHTML = 'Ingresa la contraseña maestra para descifrar.';
      return;
    }

    if (!db) {
      output.className = 'crypto-result state-error';
      output.textContent = 'El almacenamiento local no está disponible en este navegador.';
      return;
    }

    try {
      const notas = await obtenerNotasPrivadas(db);
      if (notas.length === 0) {
        output.className = 'crypto-result state-muted';
        output.innerHTML = 'No hay notas guardadas aún en la base de datos.';
        return;
      }

      const ultimaNota = notas[notas.length - 1];
      if (!ultimaNota.sal) {
        output.className = 'crypto-result state-error';
        output.textContent =
          'Esta nota se guardó con una versión anterior que no almacenaba la sal de cifrado; no es posible recuperarla. Las notas nuevas sí podrán descifrarse.';
        return;
      }

      const clave = await derivarClave(password, ultimaNota.sal);
      const textoDescifrado = await descifrarTexto(clave, {
        cifrado: ultimaNota.contenidoCifrado,
        iv: ultimaNota.iv
      });

      output.className = 'crypto-result state-info';
      const notaDescifrada = document.createElement('div');
      notaDescifrada.className = 'decrypted-note';
      const etiquetaNota = document.createElement('div');
      etiquetaNota.className = 'decrypted-note-label';
      etiquetaNota.textContent = `Nota Descifrada (${ultimaNota.materiaNombre}):`;
      const cuerpoNota = document.createElement('div');
      cuerpoNota.className = 'decrypted-note-body';
      cuerpoNota.textContent = textoDescifrado;
      const fechaNota = document.createElement('div');
      fechaNota.className = 'decrypted-note-date';
      fechaNota.textContent = `Fecha: ${new Date(ultimaNota.fechaCreacion).toLocaleString()}`;
      notaDescifrada.append(etiquetaNota, cuerpoNota, fechaNota);
      output.replaceChildren(notaDescifrada);
    } catch (error) {
      console.error(error);
      output.className = 'crypto-result state-error';
      output.textContent = error instanceof DOMException && error.name === 'OperationError'
        ? 'Contraseña incorrecta o la nota está dañada; no se pudo descifrar.'
        : error instanceof Error
          ? `No se pudo descifrar la nota: ${error.message}`
          : 'Contraseña incorrecta o error al descifrar.';
    }
  });
  return databaseReady;
}
