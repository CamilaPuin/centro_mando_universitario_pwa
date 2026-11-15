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

export function getCurrentUsername(): string | undefined {
  return activeUsername;
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
  } catch (error) {
    throw new Error(
      `No se pudo acceder al almacenamiento de sesión del navegador: ${
        error instanceof Error ? error.message : 'almacenamiento no disponible.'
      }`
    );
  }
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== undefined;
}

function saveAuthSession(token: string, username: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    throw new Error(
      `El backend autenticó la cuenta, pero no se pudo guardar la sesión para usarla en la PWA: ${
        error instanceof Error ? error.message : 'almacenamiento no disponible.'
      }`
    );
  }
  activeUsername = username;
  remoteSessionActive = true;
  window.dispatchEvent(new Event('auth-changed'));
}

export function iniciarSesionLocal(username: string): void {
  activeUsername = username;
  remoteSessionActive = false;
  window.dispatchEvent(new Event('auth-changed'));
}

function clearRemoteSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch (error) {
    throw new Error(
      `No se pudo borrar el token local: ${
        error instanceof Error ? error.message : 'almacenamiento no disponible.'
      }`
    );
  }
  remoteSessionActive = false;
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch (error) {
    throw new Error(
      `No se pudo borrar la sesión local: ${
        error instanceof Error ? error.message : 'almacenamiento no disponible.'
      }`
    );
  }
  activeUsername = undefined;
  remoteSessionActive = false;
  window.dispatchEvent(new Event('auth-changed'));
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
  if (authenticated) {
    const token = getAuthSession()?.token;
    if (!token) throw new Error('Inicia sesión para sincronizar tus datos entre dispositivos.');
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, headers });
  } catch (error) {
    if (!navigator.onLine) {
      throw new Error('No hay conexión. Puedes continuar con la sesión local y sincronizar al reconectarte.');
    }
    throw new Error(
      `No se pudo conectar con el backend: ${
        error instanceof Error ? error.message : 'revisa la dirección de la API y que el servidor esté activo.'
      }`
    );
  }
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      clearRemoteSession();
      window.dispatchEvent(new Event('auth-token-expired'));
    }
    const isRegistrationRequest = path === '/users/register';
    let message = response.status === 405 && isRegistrationRequest
      ? 'No se pudo crear tu cuenta porque el servicio de registro no está disponible en este momento. Inténtalo más tarde.'
      : `No se pudo completar la solicitud (código ${response.status}).`;
    if (response.status !== 405) {
      try {
        const errorBody: unknown = await response.json();
        if (typeof errorBody === 'object' && errorBody !== null) {
          const body = errorBody as { message?: unknown; error?: unknown; detail?: unknown };
          const detail = body.message ?? body.detail ?? body.error;
          if (typeof detail === 'string' && detail.trim()) message = detail;
        }
      } catch {
        // Fall back to the generic message when the response is not JSON.
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return await response.json() as T;
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
