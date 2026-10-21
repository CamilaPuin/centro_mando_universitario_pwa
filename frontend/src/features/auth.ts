import {
  clearAuthSession,
  getAuthSession,
  iniciarSesion,
  registrarCuenta
} from '../services/api';

export function inicializarAutenticacion(): void {
  const button = document.getElementById('auth-button') as HTMLButtonElement | null;
  const dialog = document.getElementById('auth-dialog') as HTMLDialogElement | null;
  const form = document.getElementById('auth-form') as HTMLFormElement | null;
  const modeButton = document.getElementById('auth-mode-toggle') as HTMLButtonElement | null;
  const firstName = document.getElementById('auth-first-name') as HTMLInputElement | null;
  const lastName = document.getElementById('auth-last-name') as HTMLInputElement | null;
  const username = document.getElementById('auth-username') as HTMLInputElement | null;
  const password = document.getElementById('auth-password') as HTMLInputElement | null;
  const status = document.getElementById('auth-status');
  const sessionStatus = document.getElementById('auth-session-status');
  if (!button || !dialog || !form || !modeButton || !firstName || !lastName ||
      !username || !password || !status || !sessionStatus) return;

  let registerMode = false;

  const updateButton = (): void => {
    const session = getAuthSession();
    button.textContent = session ? `Cerrar sesión (${session.username})` : 'Conectar con el servidor';
    button.setAttribute('aria-label', session ? `Cerrar sesión de ${session.username}` : 'Iniciar sesión');
    sessionStatus.textContent = session
      ? navigator.onLine
        ? `Sesión guardada para ${session.username}. Se validará con el backend al sincronizar.`
        : `Sesión local de ${session.username}. Puedes seguir usando los datos guardados; se sincronizarán al reconectarte.`
      : navigator.onLine
        ? 'Inicia sesión para sincronizar tus datos.'
        : 'Modo sin conexión: puedes continuar con los datos guardados en este dispositivo.';
    sessionStatus.classList.toggle('offline-session', !navigator.onLine);
  };
  const updateMode = (): void => {
    firstName.closest('.form-group')?.toggleAttribute('hidden', !registerMode);
    lastName.closest('.form-group')?.toggleAttribute('hidden', !registerMode);
    firstName.required = registerMode;
    lastName.required = registerMode;
    password.autocomplete = registerMode ? 'new-password' : 'current-password';
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.textContent = registerMode ? 'Crear cuenta y conectar' : 'Iniciar sesión';
    modeButton.textContent = registerMode ? 'Ya tengo una cuenta' : 'Crear cuenta nueva';
  };
  const openAuthDialog = (): void => {
    status.textContent = navigator.onLine
      ? ''
      : 'No hay conexión para iniciar sesión. Puedes usar la app en modo local y conectarte después para autenticarte y sincronizar.';
    dialog.showModal();
  };

  button.addEventListener('click', () => {
    if (getAuthSession()) {
      try {
        clearAuthSession();
        updateButton();
        sessionStatus.textContent = 'Sesión cerrada. Tus datos locales siguen disponibles.';
      } catch (error) {
        sessionStatus.textContent = error instanceof Error ? error.message : 'No se pudo cerrar la sesión.';
      }
      return;
    }
    openAuthDialog();
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
      status.textContent = 'Escribe tu usuario y contraseña.';
      return;
    }
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.disabled = true;
    status.textContent = registerMode ? 'Creando cuenta…' : 'Iniciando sesión…';
    void (async () => {
      try {
        if (registerMode) {
          await registrarCuenta({
            username: user,
            password: pass,
            firstName: firstName.value.trim(),
            lastName: lastName.value.trim()
          });
        } else {
          await iniciarSesion(user, pass);
        }
        dialog.close();
        password.value = '';
        updateButton();
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : 'No se pudo conectar con el servidor.';
      } finally {
        if (submit) submit.disabled = false;
      }
    })();
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-close-auth]').forEach(close => {
    close.addEventListener('click', () => dialog.close());
  });
  window.addEventListener('auth-changed', updateButton);
  window.addEventListener('online', updateButton);
  window.addEventListener('offline', updateButton);
  updateMode();
  updateButton();
  if (!getAuthSession()) openAuthDialog();
}
