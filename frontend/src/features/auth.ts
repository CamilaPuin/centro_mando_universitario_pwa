import {
  clearAuthSession,
  getCurrentUsername,
  isAuthenticated,
  iniciarSesion,
  iniciarSesionLocal,
  isOfflineSession,
  isUserSessionActive,
  registrarCuenta,
  apiRequest
} from '../services/api';
import {
  guardarCredencialOffline,
  guardarPerfil,
  obtenerCredencialOffline,
  obtenerPerfil,
  describirErrorConexionBaseDatos,
  type CredencialOffline
} from '../utils/db';
import {
  crearCredencialLocal,
  descifrarContrasenaLocal,
  verificarCredencialLocal
} from '../utils/auth-crypto';

interface PerfilRemoto {
  username: string;
  firstName: string;
  lastName: string;
  photo: string | null;
}

function blobFromBase64(value: string): Blob {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes]);
}

export function inicializarAutenticacion(
  databaseReady: Promise<IDBDatabase | undefined>
): void {
  const button = document.getElementById('auth-button') as HTMLButtonElement | null;
  const form = document.getElementById('auth-form') as HTMLFormElement | null;
  const modeButton = document.getElementById('auth-mode-toggle') as HTMLButtonElement | null;
  const firstName = document.getElementById('auth-first-name') as HTMLInputElement | null;
  const lastName = document.getElementById('auth-last-name') as HTMLInputElement | null;
  const firstNameRequired = document.getElementById('auth-first-name-required');
  const lastNameRequired = document.getElementById('auth-last-name-required');
  const username = document.getElementById('auth-username') as HTMLInputElement | null;
  const password = document.getElementById('auth-password') as HTMLInputElement | null;
  const status = document.getElementById('auth-status');
  const sessionStatus = document.getElementById('auth-session-status');
  if (!button || !form || !modeButton || !firstName || !lastName ||
      !firstNameRequired || !lastNameRequired || !sessionStatus ||
      !username || !password || !status) return;
  const authStatus = status;
  const authSessionStatus = sessionStatus;

  let registerMode = false;
  let syncingCredentials = false;

  const updateButton = (): void => {
    const activeUsername = getCurrentUsername();
    button.textContent = activeUsername ? 'Cerrar sesión' : 'Iniciar sesión';
    button.setAttribute('aria-label', activeUsername ? `Cerrar sesión de ${activeUsername}` : 'Iniciar sesión');
    authSessionStatus.textContent = activeUsername
      ? !navigator.onLine
        ? `Sesión local de ${activeUsername}. Los cambios se sincronizarán al recuperar la conexión.`
        : isOfflineSession()
          ? `Validando la sesión de ${activeUsername} en línea…`
          : `Sesión iniciada para ${activeUsername}.`
      : 'Inicia sesión para acceder a tu cuenta.';
    authSessionStatus.classList.toggle('offline-session', !navigator.onLine);
  };

  const updateMode = (): void => {
    firstName.closest('.form-group')?.toggleAttribute('hidden', !registerMode);
    lastName.closest('.form-group')?.toggleAttribute('hidden', !registerMode);
    firstName.required = registerMode;
    lastName.required = registerMode;
    firstNameRequired.hidden = !registerMode;
    lastNameRequired.hidden = !registerMode;
    password.autocomplete = registerMode ? 'new-password' : 'current-password';
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.textContent = registerMode ? 'Crear cuenta' : 'Iniciar sesión';
    modeButton.textContent = registerMode ? 'Ya tengo una cuenta' : 'Crear cuenta nueva';
  };

  const updateLoginNotice = (): void => {
    authStatus.textContent = navigator.onLine
      ? ''
      : 'Sin conexión: inicia sesión con una cuenta que ya hayas usado en este dispositivo, o crea una cuenta pendiente.';
  };

  async function guardarCredencial(
    db: IDBDatabase,
    usernameValue: string,
    passwordValue: string,
    firstNameValue: string,
    lastNameValue: string,
    pendingRegistration: boolean
  ): Promise<CredencialOffline> {
    const encrypted = await crearCredencialLocal(passwordValue);
    const credential: CredencialOffline = {
      username: usernameValue,
      firstName: firstNameValue,
      lastName: lastNameValue,
      ...encrypted,
      pendingRegistration
    };
    await guardarCredencialOffline(db, credential);
    return credential;
  }

  async function cargarPerfilRemoto(db: IDBDatabase): Promise<void> {
    const remote = await apiRequest<PerfilRemoto>('/users/me');
    const local = await obtenerPerfil(db, remote.username);
    const localForAccount = local?.nombreUsuario === remote.username ? local : undefined;
    let photo = localForAccount?.syncPending ? localForAccount.foto : undefined;
    if (!photo && remote.photo) {
      photo = blobFromBase64(remote.photo);
    }
    photo ??= localForAccount?.foto;
    await guardarPerfil(db, {
      nombre: `${remote.firstName} ${remote.lastName}`.trim(),
      nombreUsuario: remote.username,
      ...(photo ? { foto: photo } : {}),
      ...(localForAccount?.syncPending ? { syncPending: true } : {})
    });
    window.dispatchEvent(new Event('profile-updated'));
  }

  async function obtenerCredencial(db: IDBDatabase, usernameValue: string): Promise<CredencialOffline> {
    const credential = await obtenerCredencialOffline(db, usernameValue);
    if (!credential) {
      throw new Error('Para iniciar sesión sin conexión, primero debes usar esta cuenta en este dispositivo con internet.');
    }
    return credential;
  }

  async function sincronizarCredenciales(): Promise<void> {
    if (syncingCredentials || !navigator.onLine || !isUserSessionActive() || !isOfflineSession()) return;
    const db = await databaseReady;
    const activeUsername = getCurrentUsername();
    if (!db || !activeUsername) return;
    const credential = await obtenerCredencialOffline(db, activeUsername);
    if (!credential) return;

    syncingCredentials = true;
    try {
      const savedPassword = await descifrarContrasenaLocal(credential);
      if (credential.pendingRegistration) {
        try {
          await iniciarSesion(credential.username, savedPassword);
        } catch {
          await registrarCuenta({
            username: credential.username,
            password: savedPassword,
            firstName: credential.firstName,
            lastName: credential.lastName
          });
        }
        credential.pendingRegistration = false;
        await guardarCredencialOffline(db, credential);
      } else {
        await iniciarSesion(credential.username, savedPassword);
      }
      await cargarPerfilRemoto(db);
      window.dispatchEvent(new Event('sync-requested'));
      authStatus.textContent = 'Cuenta sincronizada. Tus datos se actualizarán automáticamente.';
    } catch (error) {
      const storageMessage = describirErrorConexionBaseDatos(error);
      const message = storageMessage ??
        (error instanceof Error
          ? `No se pudo sincronizar la cuenta: ${error.message}`
          : 'No se pudo sincronizar la cuenta.');
      authStatus.textContent = message;
      authSessionStatus.textContent = message;
    } finally {
      syncingCredentials = false;
      updateButton();
    }
  }

  button.addEventListener('click', () => {
    window.dispatchEvent(new Event('close-header-menus'));
    if (isUserSessionActive()) {
      clearAuthSession();
      authStatus.textContent = 'Sesión cerrada. Inicia sesión para continuar.';
      registerMode = false;
      updateMode();
      password.value = '';
      updateButton();
      return;
    }
    updateLoginNotice();
  });

  modeButton.addEventListener('click', () => {
    registerMode = !registerMode;
    updateMode();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const user = username.value.trim();
    const pass = password.value;
    if (!user || !pass) {
      authStatus.textContent = 'Escribe tu usuario y contraseña.';
      return;
    }
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.disabled = true;
    authStatus.textContent = registerMode ? 'Creando cuenta…' : 'Iniciando sesión…';

    void (async () => {
      try {
        const db = await databaseReady;
        if (!db) throw new Error('El almacenamiento local no está disponible.');
        const first = firstName.value.trim();
        const last = lastName.value.trim();

        if (registerMode && !navigator.onLine) {
          await guardarCredencial(db, user, pass, first, last, true);
          await guardarPerfil(db, {
            nombre: `${first} ${last}`.trim(),
            nombreUsuario: user
          });
          iniciarSesionLocal(user);
          authStatus.textContent = 'Cuenta guardada en este dispositivo. Se creará y sincronizará cuando vuelva internet.';
        } else if (registerMode) {
          await registrarCuenta({ username: user, password: pass, firstName: first, lastName: last });
          await guardarCredencial(db, user, pass, first, last, false);
          await cargarPerfilRemoto(db);
          authStatus.textContent = 'Cuenta creada y sincronizada.';
        } else {
          if (navigator.onLine) {
            const existing = await obtenerCredencialOffline(db, user);
            if (existing?.pendingRegistration &&
                await verificarCredencialLocal(pass, existing.salt, existing.verifier)) {
              iniciarSesionLocal(user);
              await sincronizarCredenciales();
              if (!isAuthenticated()) throw new Error('No se pudo completar la sincronización de la cuenta.');
            } else {
              await iniciarSesion(user, pass);
              if (existing) {
                const encrypted = await crearCredencialLocal(pass);
                await guardarCredencialOffline(db, {
                  ...existing,
                  ...encrypted,
                  pendingRegistration: false
                });
              } else {
                await guardarCredencial(db, user, pass, '', '', false);
              }
              await cargarPerfilRemoto(db);
              authStatus.textContent = 'Sesión iniciada.';
            }
          } else {
            const credential = await obtenerCredencial(db, user);
            if (!await verificarCredencialLocal(pass, credential.salt, credential.verifier)) {
              throw new Error('El usuario o la contraseña no coinciden con la cuenta guardada en este dispositivo.');
            }
            iniciarSesionLocal(user);
            if (credential.pendingRegistration) {
              authStatus.textContent = 'Sesión local iniciada. La cuenta se creará al recuperar la conexión.';
            } else {
              authStatus.textContent = 'Sesión local iniciada. Tus cambios se sincronizarán al reconectarte.';
            }
          }
        }

        registerMode = false;
        updateMode();
        password.value = '';
        updateButton();
        if (navigator.onLine) void sincronizarCredenciales();
      } catch (error) {
        authStatus.textContent = describirErrorConexionBaseDatos(error) ??
          (error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
      } finally {
        if (submit) submit.disabled = false;
      }
    })();
  });

  window.addEventListener('auth-changed', updateButton);
  window.addEventListener('online', () => {
    updateButton();
    void sincronizarCredenciales();
  });
  window.addEventListener('offline', updateButton);
  window.addEventListener('auth-token-expired', () => void sincronizarCredenciales());

  updateMode();
  updateButton();
  updateLoginNotice();
}
