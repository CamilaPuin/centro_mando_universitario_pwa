import type { ReactElement } from 'react';

export function DialogoCuenta(): ReactElement {
  return (
    <dialog id="auth-dialog" className="auth-dialog">
      <form id="auth-form" className="delivery-form">
        <h2>Inicia sesión o crea tu cuenta</h2>
        <p>
          Usa tu cuenta para mantener tus materias, entregas y avances sincronizados entre dispositivos.
          Puedes seguir usando la app sin iniciar sesión.
        </p>
        <div className="form-group">
          <label htmlFor="auth-first-name">
            Nombre <span id="auth-first-name-required" className="required-mark" aria-hidden="true" hidden>*</span>
          </label>
          <input
            id="auth-first-name"
            className="form-control"
            maxLength={100}
            autoComplete="given-name"
            placeholder="Ej. Camila"
          />
        </div>
        <div className="form-group">
          <label htmlFor="auth-last-name">
            Apellido <span id="auth-last-name-required" className="required-mark" aria-hidden="true" hidden>*</span>
          </label>
          <input
            id="auth-last-name"
            className="form-control"
            maxLength={100}
            autoComplete="family-name"
            placeholder="Ej. Puin"
          />
        </div>
        <div className="form-group">
          <label htmlFor="auth-username">
            Usuario <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="auth-username"
            className="form-control"
            maxLength={50}
            autoComplete="username"
            required
            placeholder="Tu nombre de usuario"
          />
        </div>
        <div className="form-group">
          <label htmlFor="auth-password">
            Contraseña <span className="required-mark" aria-hidden="true">*</span>
          </label>
          <input
            id="auth-password"
            className="form-control"
            type="password"
            minLength={8}
            maxLength={100}
            autoComplete="current-password"
            required
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <p id="auth-status" className="device-status" role="status" aria-live="polite" />
        <div className="profile-actions">
          <button className="btn btn-save" type="submit">Iniciar sesión</button>
          <button id="auth-mode-toggle" className="btn btn-load" type="button">Crear cuenta nueva</button>
          <button className="btn btn-load" type="button" data-close-auth>Cerrar</button>
        </div>
      </form>
    </dialog>
  );
}
