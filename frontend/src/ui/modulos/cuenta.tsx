import type { ReactElement } from 'react';

interface PantallaCuentaProps {
  oculta: boolean;
}

export function PantallaCuenta({ oculta }: PantallaCuentaProps): ReactElement {
  return (
    <section id="auth-screen" className="auth-screen" hidden={oculta}>
      <div className="auth-panel">
        <img src="icons/icon-192.png" alt="" className="auth-logo" />
        <h1 id="auth-screen-title">Centro de Mando Universitario</h1>
        <p className="auth-description">Inicia sesión o crea una cuenta para acceder a tu espacio académico. Si no tienes conexión, puedes iniciar sesión o crear una cuenta pendiente en este dispositivo.</p>
        <form id="auth-form" className="delivery-form auth-form">
          <div className="form-group" hidden>
            <label htmlFor="auth-first-name">Nombre <span id="auth-first-name-required" className="required-mark" aria-hidden="true" hidden>*</span></label>
            <input id="auth-first-name" className="form-control" maxLength={100} autoComplete="given-name" placeholder="Ej. Camila" />
          </div>
          <div className="form-group" hidden>
            <label htmlFor="auth-last-name">Apellido <span id="auth-last-name-required" className="required-mark" aria-hidden="true" hidden>*</span></label>
            <input id="auth-last-name" className="form-control" maxLength={100} autoComplete="family-name" placeholder="Ej. Puin" />
          </div>
          <div className="form-group">
            <label htmlFor="auth-username">Usuario <span className="required-mark" aria-hidden="true">*</span></label>
            <input id="auth-username" className="form-control" maxLength={50} autoComplete="username" required placeholder="Tu nombre de usuario" />
          </div>
          <div className="form-group">
            <label htmlFor="auth-password">Contraseña <span className="required-mark" aria-hidden="true">*</span></label>
            <input id="auth-password" className="form-control" type="password" minLength={8} maxLength={100} autoComplete="current-password" required placeholder="Mínimo 8 caracteres" />
          </div>
          <p id="auth-status" className="device-status" role="status" aria-live="polite"></p>
          <div className="profile-actions">
            <button className="btn btn-save" type="submit">Iniciar sesión</button>
            <button id="auth-mode-toggle" className="btn btn-load" type="button">Crear cuenta nueva</button>
          </div>
        </form>
      </div>
    </section>
  );
}
