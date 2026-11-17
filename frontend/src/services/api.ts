import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'centro-mando-api-token';
const USERNAME_KEY = 'centro-mando-api-username';
let activeUsername: string | undefined;
let remoteSessionActive = false;

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit;
  authenticated?: boolean;
}

export interface AuthSession {
  token: string;
  username: string;
}

function dispatchAuthChanged(): void {
  window.dispatchEvent(new Event('auth-changed'));
  for (const eventName of [
    'asignaturas-actualizadas',
    'entregas-actualizadas',
    'horario-actualizado',
    'sesion-estudio-guardada'
  ]) {
    window.dispatchEvent(new Event(eventName));
  }
}

export function getCurrentUsername(): string | undefined {
  return activeUsername;
}

export function restaurarSesionGuardada(): void {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const username = localStorage.getItem(USERNAME_KEY);
    if (token && username) {
      activeUsername = username;
      remoteSessionActive = true;
    }
  } catch {
    activeUsername = undefined;
    remoteSessionActive = false;
  }
}

export function isUserSessionActive(): boolean {
  return activeUsername !== undefined;
}

export function isOfflineSession(): boolean {
  return activeUsername !== undefined && !remoteSessionActive;
}

export function getAuthSession(): AuthSession | undefined {
  if (!remoteSessionActive) return undefined;
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const username = localStorage.getItem(USERNAME_KEY);
    return token && username ? { token, username } : undefined;
  } catch {
    throw new Error('No se pudo acceder a la sesión guardada en este dispositivo.');
  }
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== undefined;
}

function saveAuthSession(token: string, username: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    throw new Error('No se pudo guardar la sesión en este dispositivo.');
  }
  activeUsername = username;
  remoteSessionActive = true;
  dispatchAuthChanged();
}

export function iniciarSesionLocal(username: string): void {
  activeUsername = username;
  remoteSessionActive = false;
  dispatchAuthChanged();
}

function clearRemoteSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch {
    throw new Error('No se pudo cerrar la sesión guardada en este dispositivo.');
  }
  remoteSessionActive = false;
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch {
    throw new Error('No se pudo cerrar la sesión guardada en este dispositivo.');
  }
  activeUsername = undefined;
  remoteSessionActive = false;
  dispatchAuthChanged();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { authenticated = true, headers: suppliedHeaders, ...requestOptions } = options;
  const headers = new Headers(suppliedHeaders);
  if (requestOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const authSession = authenticated ? getAuthSession() : undefined;
  if (authenticated) {
    const token = authSession?.token;
    if (!token) throw new Error('Inicia sesión para sincronizar tus datos entre dispositivos.');
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, headers });
  } catch {
    if (!navigator.onLine) {
      throw new Error('No hay conexión. Puedes continuar con la sesión local y sincronizar al reconectarte.');
    }
    throw new Error('No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.');
  }
  if (authenticated &&
      (getCurrentUsername() !== authSession?.username ||
       getAuthSession()?.token !== authSession?.token)) {
    throw new Error('La sesión cambió durante la solicitud. Vuelve a intentarlo con la cuenta activa.');
  }
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      clearRemoteSession();
      window.dispatchEvent(new Event('auth-token-expired'));
    }
    throw new Error(mensajeDeErrorApi(response.status, path, authenticated));
  }

  if (response.status === 204) return undefined as T;
  try {
    return await response.json() as T;
  } catch {
    throw new Error('No se pudo procesar la respuesta. Inténtalo de nuevo más tarde.');
  }
}

function mensajeDeErrorApi(status: number, path: string, authenticated: boolean): string {
  if (status === 405 && path === '/users/register') {
    return 'No se pudo crear tu cuenta porque el servicio de registro no está disponible en este momento. Inténtalo más tarde.';
  }
  if (status === 401) {
    return path === '/users/login'
      ? 'No se pudo iniciar sesión. Revisa el usuario y la contraseña.'
      : authenticated
        ? 'Tu sesión ha vencido. Inicia sesión de nuevo para sincronizar tus datos.'
        : 'No se pudieron validar tus datos. Revísalos e inténtalo de nuevo.';
  }
  if (status === 400 || status === 422) {
    return 'No se pudo guardar la información. Revisa los datos e inténtalo de nuevo.';
  }
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No encontramos la información solicitada. Actualiza la pantalla e inténtalo de nuevo.';
  if (status === 409) return 'La información ya cambió. Actualiza la pantalla e inténtalo de nuevo.';
  if (status === 429) return 'Hay muchas solicitudes en este momento. Espera un poco e inténtalo de nuevo.';
  if (status >= 500) return 'El servicio no está disponible en este momento. Inténtalo de nuevo más tarde.';
  return 'No se pudo completar la solicitud. Inténtalo de nuevo.';
}

export async function iniciarSesion(username: string, password: string): Promise<void> {
  const result = await apiRequest<{ token: string }>('/users/login', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ username, password })
  });
  if (!result.token) throw new Error('La API no devolvió un token de sesión válido.');
  saveAuthSession(result.token, username);
}

export async function registrarCuenta(input: {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  await apiRequest('/users/register', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify(input)
  });
  await iniciarSesion(input.username, input.password);
}
