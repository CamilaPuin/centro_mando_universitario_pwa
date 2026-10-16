export type ResultadoPermisoSensores = 'granted' | 'denied' | 'no-necesario';

interface DeviceMotionEventWithPermission {
  requestPermission?: () => Promise<string>;
}

export async function pedirPermisoSensores(): Promise<ResultadoPermisoSensores> {
  if (!('DeviceMotionEvent' in window) || typeof window.DeviceMotionEvent === 'undefined') {
    return 'no-necesario';
  }

  const constructor = window.DeviceMotionEvent as unknown as DeviceMotionEventWithPermission;
  if (typeof constructor.requestPermission !== 'function') {
    return 'no-necesario';
  }

  try {
    return await constructor.requestPermission() === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export function hayLecturasReales(timeoutMs = 1000): Promise<boolean> {
  if (!('DeviceMotionEvent' in window) || typeof window.DeviceMotionEvent === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise(resolve => {
    let terminado = false;
    const finalizar = (haySensor: boolean) => {
      if (terminado) return;
      terminado = true;
      window.removeEventListener('devicemotion', alMoverse);
      window.clearTimeout(timeout);
      resolve(haySensor);
    };

    const alMoverse = (evento: DeviceMotionEvent) => {
      const aceleracion = evento.accelerationIncludingGravity;
      if (
        aceleracion !== null &&
        aceleracion !== undefined &&
        aceleracion.x !== null &&
        aceleracion.y !== null &&
        aceleracion.z !== null &&
        Number.isFinite(aceleracion.x) &&
        Number.isFinite(aceleracion.y) &&
        Number.isFinite(aceleracion.z)
      ) {
        finalizar(true);
      }
    };

    const timeout = window.setTimeout(() => finalizar(false), timeoutMs);
    window.addEventListener('devicemotion', alMoverse);
  });
}

export function detectarSacudida(
  onSacudida: (desviacion: number) => void,
  { umbral = 12, enfriamientoMs = 1000 }: { umbral?: number; enfriamientoMs?: number } = {}
): () => void {
  if (!('DeviceMotionEvent' in window) || typeof window.DeviceMotionEvent === 'undefined') {
    return () => undefined;
  }

  let ultimaSacudida = 0;
  const alMoverse = (evento: DeviceMotionEvent) => {
    const aceleracion = evento.accelerationIncludingGravity;
    if (
      !aceleracion ||
      aceleracion.x === null ||
      aceleracion.y === null ||
      aceleracion.z === null ||
      !Number.isFinite(aceleracion.x) ||
      !Number.isFinite(aceleracion.y) ||
      !Number.isFinite(aceleracion.z)
    ) {
      return;
    }

    const magnitud = Math.hypot(aceleracion.x, aceleracion.y, aceleracion.z);
    const desviacion = Math.abs(magnitud - 9.81);
    const ahora = Date.now();
    if (desviacion > umbral && ahora - ultimaSacudida >= enfriamientoMs) {
      ultimaSacudida = ahora;
      onSacudida(desviacion);
    }
  };

  window.addEventListener('devicemotion', alMoverse);
  return () => window.removeEventListener('devicemotion', alMoverse);
}
