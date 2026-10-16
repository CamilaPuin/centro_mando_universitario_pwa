import {
  asegurarRegistro,
  eliminarRegistro,
  guardarEvidencia,
  guardarFechaParcial,
  obtenerUltimaFotoPerfil,
  restaurarRegistro,
  type RegistroApp
} from '../utils/db';
import { abrirCamara, capturarFoto, describirErrorCamara, detenerCamara } from './dispositivo';
import { detectarSacudida, hayLecturasReales, pedirPermisoSensores } from './sensores';

interface NodoEliminado {
  elemento: HTMLElement;
  padre: HTMLElement;
  siguiente: Node | null;
}

interface UltimaEliminada {
  registro: RegistroApp;
  nodos: NodoEliminado[];
}

export function inicializarHerramientasDispositivo(
  baseDatos: Promise<IDBDatabase | undefined>
): void {
  const botonDeshacer = document.getElementById('btn-undo-delete') as HTMLButtonElement;
  const estadoShake = document.getElementById('shake-status') as HTMLParagraphElement;
  const estadoCamara = document.getElementById('camera-status') as HTMLParagraphElement;
  const dialogoCamara = document.getElementById('dlg-camara') as HTMLDialogElement;
  const videoCamara = document.getElementById('camera-video') as HTMLVideoElement;
  const fotoPerfil = document.getElementById('profile-photo-preview') as HTMLImageElement;
  const archivoFoto = document.getElementById('profile-photo-file') as HTMLInputElement;

  let ultimaEliminada: UltimaEliminada | undefined;
  let deshacerEnCurso = false;
  let streamCamara: MediaStream | undefined;
  let urlFotoPerfil: string | undefined;
  let limpiarDetectorSacudida: (() => void) | undefined;
  const registrosPorClave = new Map<string, RegistroApp>();

  function mostrarFotoPerfil(blob: Blob): void {
    if (typeof URL.createObjectURL !== 'function' || typeof URL.revokeObjectURL !== 'function') {
      estadoCamara.textContent = 'La foto se guardó, pero este navegador no permite mostrar una vista previa.';
      return;
    }
    if (urlFotoPerfil) URL.revokeObjectURL(urlFotoPerfil);
    urlFotoPerfil = URL.createObjectURL(blob);
    fotoPerfil.src = urlFotoPerfil;
    fotoPerfil.hidden = false;
  }

  async function guardarFotoPerfil(blob: Blob): Promise<void> {
    const db = await baseDatos;
    if (!db) {
      estadoCamara.textContent = 'El almacenamiento local no está disponible. La foto no se pudo guardar.';
      return;
    }

    try {
      await guardarEvidencia(db, {
        propietarioTipo: 'perfil',
        propietarioId: 'estudiante',
        creadoEn: new Date().toISOString(),
        imagen: blob
      });
      mostrarFotoPerfil(blob);
      estadoCamara.textContent = 'Foto guardada localmente en el perfil de este dispositivo.';
    } catch (error) {
      console.error('Error al guardar la foto de perfil:', error);
      estadoCamara.textContent = 'No se pudo guardar la foto. Comprueba el espacio disponible e inténtalo de nuevo.';
    }
  }

  function calcularTiempoRestante(fechaObjetivo: Date, ahora = new Date()): string {
    const diferenciaMs = fechaObjetivo.getTime() - ahora.getTime();
    if (!Number.isFinite(diferenciaMs)) return 'La fecha del parcial no es válida.';
    if (diferenciaMs <= 0) return 'El parcial ya llegó o pasó.';

    const minutosTotales = Math.floor(diferenciaMs / 60_000);
    const dias = Math.floor(minutosTotales / (24 * 60));
    const horas = Math.floor((minutosTotales % (24 * 60)) / 60);
    const minutos = minutosTotales % 60;
    return `Faltan ${dias} días, ${horas} horas y ${minutos} minutos.`;
  }

  function actualizarCuentaRegresiva(): void {
    const entradaFecha = document.getElementById('exam-date') as HTMLInputElement;
    const cuentaRegresiva = document.getElementById('exam-countdown') as HTMLParagraphElement;
    if (!entradaFecha.value) {
      cuentaRegresiva.textContent = 'Selecciona la fecha del próximo parcial.';
      return;
    }
    cuentaRegresiva.textContent = calcularTiempoRestante(new Date(entradaFecha.value));
  }

  function restaurarNodos(nodos: NodoEliminado[]): void {
    nodos.forEach(({ elemento, padre, siguiente }) => {
      if (siguiente?.parentNode === padre) {
        padre.insertBefore(elemento, siguiente);
      } else {
        padre.append(elemento);
      }
    });
  }

  function actualizarContadoresRegistros(): void {
    document.querySelectorAll<HTMLElement>('.kanban-col').forEach(columna => {
      const cards = columna.querySelectorAll('.kanban-cards > .record-entry').length;
      const contador = columna.querySelector<HTMLElement>('.kanban-col-header .panel-badge');
      if (contador) contador.textContent = String(cards);
    });

    const bloquesAgenda = document.querySelectorAll('#tab-resumen .agenda-list > .record-entry').length;
    const contadorAgenda = document.querySelector<HTMLElement>(
      '#tab-resumen .dashboard-panel .panel-header .panel-badge'
    );
    if (contadorAgenda) contadorAgenda.textContent = `${bloquesAgenda} bloques`;
  }

  async function deshacerUltimaEliminacion(origen: 'botón' | 'sacudida'): Promise<void> {
    const db = await baseDatos;
    if (!db || !ultimaEliminada || deshacerEnCurso) {
      estadoShake.textContent = 'No hay elementos eliminados para restaurar.';
      return;
    }

    deshacerEnCurso = true;
    try {
      const restaurado = await restaurarRegistro(db, ultimaEliminada.registro);
      restaurarNodos(ultimaEliminada.nodos);
      actualizarContadoresRegistros();
      registrosPorClave.set(restaurado.clave, restaurado);
      if (restaurado.tipo === 'parcial' && restaurado.fechaObjetivo) {
        const entradaFecha = document.getElementById('exam-date') as HTMLInputElement;
        entradaFecha.value = restaurado.fechaObjetivo;
        actualizarCuentaRegresiva();
      }
      ultimaEliminada = undefined;
      botonDeshacer.disabled = true;
      estadoShake.textContent = origen === 'sacudida'
        ? 'Elemento restaurado al detectar la sacudida.'
        : 'Elemento restaurado.';
    } catch (error) {
      console.error('Error al deshacer la eliminación:', error);
      estadoShake.textContent = 'No se pudo restaurar el elemento. Inténtalo de nuevo con el botón.';
    } finally {
      deshacerEnCurso = false;
    }
  }

  async function inicializarRegistros(db: IDBDatabase): Promise<void> {
    const entradas = Array.from(document.querySelectorAll<HTMLElement>('.record-entry'));
    for (const entrada of entradas) {
      const clave = entrada.dataset.recordKey;
      const tipo = entrada.dataset.recordType;
      if (!clave || !tipo || registrosPorClave.has(clave)) continue;

      const tipoRegistro: RegistroApp['tipo'] =
        tipo === 'clase' || tipo === 'entrega' || tipo === 'parcial' || tipo === 'bloque-estudio'
          ? tipo
          : 'entrega';
      const titulo = entrada.querySelector<HTMLElement>(
        '.agenda-subject, .delivery-title, h4, .panel-title'
      )?.textContent?.trim() ?? clave;
      const registro = await asegurarRegistro(db, { clave, tipo: tipoRegistro, titulo });
      registrosPorClave.set(clave, registro);

      if (registro.tipo === 'parcial' && registro.fechaObjetivo) {
        const entradaFecha = document.getElementById('exam-date') as HTMLInputElement;
        entradaFecha.value = registro.fechaObjetivo;
        actualizarCuentaRegresiva();
        const botonEliminarParcial = document.querySelector<HTMLButtonElement>(
          '[data-delete-key="parcial-proximo"]'
        );
        if (botonEliminarParcial) botonEliminarParcial.disabled = false;
      }
    }
  }

  document.addEventListener('click', async event => {
    if (deshacerEnCurso) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const boton = target.closest<HTMLButtonElement>('[data-delete-key]');
    if (!boton || boton.disabled) return;

    const clave = boton.dataset.deleteKey;
    const registro = clave ? registrosPorClave.get(clave) : undefined;
    const db = await baseDatos;
    if (!db || !registro?.id) {
      estadoShake.textContent = 'El registro no está listo para eliminarse. Comprueba el almacenamiento local.';
      return;
    }

    try {
      const eliminado = await eliminarRegistro(db, registro.id);
      if (!eliminado) {
        estadoShake.textContent = 'El registro ya no existe en el almacenamiento local.';
        return;
      }

      const elementos = Array.from(document.querySelectorAll<HTMLElement>('.record-entry'))
        .filter(elemento => elemento.dataset.recordKey === clave);
      const nodos = elementos.flatMap(elemento => {
        const padre = elemento.parentElement;
        return padre ? [{ elemento, padre, siguiente: elemento.nextSibling }] : [];
      });
      nodos.forEach(({ elemento }) => elemento.remove());
      actualizarContadoresRegistros();
      registrosPorClave.delete(eliminado.clave);
      ultimaEliminada = { registro: eliminado, nodos };
      botonDeshacer.disabled = false;
      estadoShake.textContent =
        `${eliminado.titulo} eliminado. Puedes deshacerlo con el botón o agitando el dispositivo.`;
    } catch (error) {
      console.error('Error al eliminar el registro:', error);
      estadoShake.textContent = 'No se pudo eliminar el registro del almacenamiento local.';
    }
  });

  botonDeshacer.addEventListener('click', () => {
    void deshacerUltimaEliminacion('botón');
  });

  document.getElementById('btn-calculate-deadline')?.addEventListener('click', async () => {
    const entradaFecha = document.getElementById('exam-date') as HTMLInputElement;
    const cuentaRegresiva = document.getElementById('exam-countdown') as HTMLParagraphElement;
    const fecha = new Date(entradaFecha.value);
    if (!entradaFecha.value || !Number.isFinite(fecha.getTime())) {
      cuentaRegresiva.textContent = 'Selecciona una fecha y hora válidas para el parcial.';
      return;
    }

    actualizarCuentaRegresiva();
    const db = await baseDatos;
    if (!db) return;

    try {
      const parcial = await guardarFechaParcial(db, entradaFecha.value);
      registrosPorClave.set(parcial.clave, parcial);
      const botonEliminarParcial = document.querySelector<HTMLButtonElement>(
        '[data-delete-key="parcial-proximo"]'
      );
      if (botonEliminarParcial) botonEliminarParcial.disabled = false;
    } catch (error) {
      console.error('Error al guardar la fecha del parcial:', error);
      cuentaRegresiva.textContent += ' No se pudo guardar el parcial en el dispositivo.';
    }
  });

  window.setInterval(actualizarCuentaRegresiva, 60_000);

  document.getElementById('btn-toggle-shake')?.addEventListener('click', async event => {
    const boton = event.currentTarget as HTMLButtonElement;
    if (limpiarDetectorSacudida) {
      limpiarDetectorSacudida();
      limpiarDetectorSacudida = undefined;
      boton.textContent = 'Activar agitar para deshacer';
      estadoShake.textContent = 'Gesto desactivado. Puedes deshacer con el botón visible.';
      return;
    }

    if (!('DeviceMotionEvent' in window)) {
      estadoShake.textContent = 'Este dispositivo o navegador no expone sensores de movimiento. Usa el botón Deshacer.';
      return;
    }

    const permiso = await pedirPermisoSensores();
    if (permiso === 'denied') {
      estadoShake.textContent = 'Permiso de movimiento denegado. Puedes deshacer con el botón visible.';
      return;
    }

    const haySensor = await hayLecturasReales();
    limpiarDetectorSacudida = detectarSacudida(() => {
      void deshacerUltimaEliminacion('sacudida');
    });
    boton.textContent = 'Desactivar agitar para deshacer';
    estadoShake.textContent = haySensor
      ? 'Agitar para deshacer está activo.'
      : 'No se detectaron lecturas de movimiento. El botón Deshacer sigue disponible.';
  });

  document.getElementById('btn-open-camera')?.addEventListener('click', async () => {
    const selectorFoto = () => archivoFoto.click();
    if (!window.isSecureContext) {
      estadoCamara.textContent =
        'Para usar la cámara abre la app mediante HTTPS o localhost. También puedes elegir una imagen.';
      return;
    }

    if (
      !('mediaDevices' in navigator) ||
      typeof navigator.mediaDevices === 'undefined' ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof dialogoCamara.showModal !== 'function'
    ) {
      estadoCamara.textContent = 'La cámara no está disponible aquí. Elige una imagen del dispositivo.';
      selectorFoto();
      return;
    }

    try {
      streamCamara = await abrirCamara('user');
      videoCamara.srcObject = streamCamara;
      dialogoCamara.showModal();
      await videoCamara.play();
      estadoCamara.textContent = 'Cámara activa. La foto se guardará solo cuando pulses Capturar.';
    } catch (error) {
      if (dialogoCamara.open) {
        dialogoCamara.close();
      } else {
        detenerCamara(streamCamara);
        streamCamara = undefined;
        videoCamara.srcObject = null;
      }
      estadoCamara.textContent = describirErrorCamara(error);
    }
  });

  document.getElementById('btn-choose-photo')?.addEventListener('click', () => archivoFoto.click());

  archivoFoto.addEventListener('change', async () => {
    const archivo = archivoFoto.files?.[0];
    if (archivo && archivo.type.startsWith('image/')) {
      await guardarFotoPerfil(archivo);
    } else if (archivo) {
      estadoCamara.textContent = 'El archivo seleccionado no es una imagen.';
    }
    archivoFoto.value = '';
  });

  document.getElementById('btn-capture-photo')?.addEventListener('click', async () => {
    try {
      const foto = await capturarFoto(videoCamara);
      await guardarFotoPerfil(foto);
      dialogoCamara.close();
    } catch (error) {
      console.error('Error al capturar la foto:', error);
      estadoCamara.textContent = error instanceof Error ? error.message : 'No se pudo capturar la foto.';
    }
  });

  const cerrarCamara = () => {
    detenerCamara(streamCamara);
    streamCamara = undefined;
    videoCamara.pause();
    videoCamara.srcObject = null;
  };
  dialogoCamara.addEventListener('close', cerrarCamara);
  document.getElementById('btn-cancel-camera')?.addEventListener('click', () => dialogoCamara.close());

  void baseDatos.then(async db => {
    if (!db) {
      estadoShake.textContent = 'El almacenamiento local no está disponible; puedes seguir usando las funciones del resto de la app.';
      return;
    }

    try {
      await inicializarRegistros(db);
      const foto = await obtenerUltimaFotoPerfil(db);
      if (foto) mostrarFotoPerfil(foto);
    } catch (error) {
      console.error('Error al inicializar las herramientas del dispositivo:', error);
      estadoShake.textContent = 'No fue posible cargar los datos locales de las herramientas.';
    }
  });

  window.addEventListener('pagehide', () => {
    cerrarCamara();
    if (urlFotoPerfil) {
      URL.revokeObjectURL(urlFotoPerfil);
      urlFotoPerfil = undefined;
    }
    limpiarDetectorSacudida?.();
  });
}
