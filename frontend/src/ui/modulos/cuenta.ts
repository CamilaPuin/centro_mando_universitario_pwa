export function renderizarDialogoCuenta(): string {
  return `
    <dialog id="auth-dialog" class="auth-dialog">
      <form id="auth-form" class="delivery-form">
        <h2>Inicia sesión o crea tu cuenta</h2>
        <p>El ingreso valida tu cuenta con el backend y requiere conexión. Sin internet puedes seguir usando los datos locales; se sincronizarán cuando vuelvas a conectarte.</p>
        <div class="form-group">
          <label for="auth-first-name">Nombre:</label>
          <input id="auth-first-name" class="form-control" maxlength="100" autocomplete="given-name" />
        </div>
        <div class="form-group">
          <label for="auth-last-name">Apellido:</label>
          <input id="auth-last-name" class="form-control" maxlength="100" autocomplete="family-name" />
        </div>
        <div class="form-group">
          <label for="auth-username">Usuario:</label>
          <input id="auth-username" class="form-control" maxlength="50" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label for="auth-password">Contraseña:</label>
          <input id="auth-password" class="form-control" type="password" minlength="8" maxlength="100" autocomplete="current-password" required />
        </div>
        <p id="auth-status" class="device-status" role="status" aria-live="polite"></p>
        <div class="profile-actions">
          <button class="btn btn-save" type="submit">Iniciar sesión</button>
          <button id="auth-mode-toggle" class="btn btn-load" type="button">Crear cuenta nueva</button>
          <button class="btn btn-load" type="button" data-close-auth>Cerrar</button>
        </div>
      </form>
    </dialog>
  `;
}
