export function renderizarDialogoCuenta(): string {
  return `
    <dialog id="auth-dialog" class="auth-dialog">
      <form id="auth-form" class="delivery-form">
        <h2>Inicia sesión o crea tu cuenta</h2>
        <p>Usa tu cuenta para mantener tus materias, entregas y avances sincronizados entre dispositivos. Puedes seguir usando la app sin iniciar sesión.</p>
        <div class="form-group">
          <label for="auth-first-name">Nombre <span id="auth-first-name-required" class="required-mark" aria-hidden="true" hidden>*</span></label>
          <input id="auth-first-name" class="form-control" maxlength="100" autocomplete="given-name" placeholder="Ej. Camila" />
        </div>
        <div class="form-group">
          <label for="auth-last-name">Apellido <span id="auth-last-name-required" class="required-mark" aria-hidden="true" hidden>*</span></label>
          <input id="auth-last-name" class="form-control" maxlength="100" autocomplete="family-name" placeholder="Ej. Puin" />
        </div>
        <div class="form-group">
          <label for="auth-username">Usuario <span class="required-mark" aria-hidden="true">*</span></label>
          <input id="auth-username" class="form-control" maxlength="50" autocomplete="username" required placeholder="Tu nombre de usuario" />
        </div>
        <div class="form-group">
          <label for="auth-password">Contraseña <span class="required-mark" aria-hidden="true">*</span></label>
          <input id="auth-password" class="form-control" type="password" minlength="8" maxlength="100" autocomplete="current-password" required placeholder="Mínimo 8 caracteres" />
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
