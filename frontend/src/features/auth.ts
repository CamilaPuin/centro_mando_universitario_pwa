import { useEffect, useState } from 'react';
import {
  clearAuthSession,
  getAuthSession,
  iniciarSesion,
  registrarCuenta,
  type AuthSession
} from '../services/api';

type SessionSnapshot = {
  session?: AuthSession;
  error?: string;
};

export type CredencialesCuenta =
  | { modo: 'inicio'; username: string; password: string }
  | { modo: 'registro'; username: string; password: string; firstName: string; lastName: string };

function readSession(): SessionSnapshot {
  try {
    return { session: getAuthSession() };
  } catch (error) {
    console.error('No se pudo leer la sesión del navegador:', error);
    return {
      error: error instanceof Error
        ? `No se pudo leer la sesión del navegador: ${error.message}`
        : 'No se pudo leer la sesión del navegador.'
    };
  }
}

export function useEstadoAutenticacion(): {
  session: AuthSession | undefined;
  sessionMessage: string;
  offline: boolean;
} {
  const [snapshot, setSnapshot] = useState(readSession);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const refresh = (): void => {
      setSnapshot(readSession());
      setOnline(navigator.onLine);
    };
    const handleOnline = (): void => {
      setSnapshot(readSession());
      setOnline(true);
    };
    const handleOffline = (): void => {
      setSnapshot(readSession());
      setOnline(false);
    };

    window.addEventListener('auth-changed', refresh);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('auth-changed', refresh);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sessionMessage = snapshot.error ?? (
    snapshot.session
      ? online
        ? `Sesión guardada para ${snapshot.session.username}. Se validará con el backend al sincronizar.`
        : `Sesión local de ${snapshot.session.username}. Puedes seguir usando los datos guardados; se sincronizarán al reconectarte.`
      : online
        ? 'Inicia sesión para sincronizar tus datos.'
        : 'Modo sin conexión: puedes continuar con los datos guardados en este dispositivo.'
  );

  return { session: snapshot.session, sessionMessage, offline: !online };
}

export async function autenticarCuenta(credenciales: CredencialesCuenta): Promise<void> {
  if (credenciales.modo === 'registro') {
    await registrarCuenta({
      username: credenciales.username,
      password: credenciales.password,
      firstName: credenciales.firstName,
      lastName: credenciales.lastName
    });
  } else {
    await iniciarSesion(credenciales.username, credenciales.password);
  }
}

export function cerrarSesion(): void {
  clearAuthSession();
}
