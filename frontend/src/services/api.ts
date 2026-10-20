import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'centro-mando-api-token';
const USERNAME_KEY = 'centro-mando-api-username';

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit;
  authenticated?: boolean;
}

export interface AuthSession {
  token: string;
  username: string;
}

export function getAuthSession(): AuthSession | undefined {
  const token = localStorage.getItem(TOKEN_KEY);
  const username = localStorage.getItem(USERNAME_KEY);
  return token && username ? { token, username } : undefined;
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== undefined;
}

function saveAuthSession(token: string, username: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
  window.dispatchEvent(new Event('auth-changed'));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
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
    if (!token) throw new Error('Inicia sesión para sincronizar tus datos con el servidor.');
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, headers });
  if (!response.ok) {
    if (response.status === 401 && authenticated) clearAuthSession();
    let message = `Error del servidor (HTTP ${response.status}).`;
    try {
      const errorBody: unknown = await response.json();
      if (typeof errorBody === 'object' && errorBody !== null) {
        const body = errorBody as { message?: unknown; error?: unknown; detail?: unknown };
        const detail = body.message ?? body.detail ?? body.error;
        if (typeof detail === 'string' && detail.trim()) message = detail;
      }
    } catch {
      // The response may not have a JSON body.
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
