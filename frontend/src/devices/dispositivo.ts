export async function abrirCamara(facingMode = 'user'): Promise<MediaStream> {
  if (
    !('mediaDevices' in navigator) ||
    typeof navigator.mediaDevices === 'undefined' ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    throw new DOMException('La cámara no está disponible en este navegador.', 'NotSupportedError');
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  });
}

export function detenerCamara(stream: MediaStream | undefined): void {
  stream?.getTracks().forEach(track => track.stop());
}

export function capturarFoto(videoEl: HTMLVideoElement, anchoMax = 640): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (videoEl.videoWidth <= 0 || videoEl.videoHeight <= 0) {
      reject(new Error('La cámara todavía no está lista para capturar una imagen.'));
      return;
    }

    const limiteAncho = Number.isFinite(anchoMax) ? Math.max(1, anchoMax) : 640;
    const escala = Math.min(1, limiteAncho / videoEl.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(videoEl.videoWidth * escala);
    canvas.height = Math.round(videoEl.videoHeight * escala);

    const contexto = canvas.getContext('2d');
    if (!contexto) {
      reject(new Error('No fue posible preparar la imagen capturada.'));
      return;
    }

    contexto.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('El navegador no pudo codificar la fotografía.'));
      }
    }, 'image/jpeg', 0.8);
  });
}

export function describirErrorCamara(err: unknown): string {
  const nombre = err instanceof DOMException || err instanceof Error ? err.name : '';

  switch (nombre) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'No se permitió el acceso a la cámara. Autoriza el permiso en el navegador o elige una imagen del dispositivo.';
    case 'NotFoundError':
      return 'No se encontró una cámara disponible. Puedes elegir una imagen del dispositivo.';
    case 'NotReadableError':
      return 'La cámara está ocupada por otra aplicación o no se puede leer. Ciérrala e inténtalo de nuevo.';
    case 'OverconstrainedError':
      return 'La cámara no admite la configuración solicitada. Prueba con otra cámara o elige una imagen.';
    case 'TypeError':
    case 'NotSupportedError':
      return 'La cámara no está disponible en este contexto. Usa HTTPS o localhost, o elige una imagen.';
    default:
      return 'No fue posible abrir la cámara. Puedes elegir una imagen del dispositivo.';
  }
}
