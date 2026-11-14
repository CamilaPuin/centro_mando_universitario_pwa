import type { ReactElement } from 'react';

function obtenerFechaFormateada(): string {
  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);
}

export function Encabezado(): ReactElement {
  return (
    <>
      <header className="top-nav">
        <div className="brand-section">
          <img src="icons/icon-192.png" alt="Centro de Mando Universitario" className="brand-logo" />
          <div>
            <div className="brand-title">Centro de Mando Universitario</div>
            <div className="brand-subtitle">Gestión académica personal</div>
          </div>
        </div>
        <div className="nav-meta">
          <div className="date-pill"><span>{obtenerFechaFormateada()}</span></div>
          <span id="network-status" className="badge online">
            <span className="badge-dot" />
            <span>En línea</span>
          </span>
          <button
            id="theme-toggle"
            className="header-menu-button theme-toggle-button"
            type="button"
            aria-label="Cambiar a modo oscuro"
            title="Cambiar a modo oscuro"
          >
            <svg className="theme-icon theme-icon-sun" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
            <svg className="theme-icon theme-icon-moon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
            </svg>
          </button>
          <button id="install-app" className="install-button" type="button" hidden>Instalar</button>
          <div className="header-menu tools-menu">
            <button
              id="tools-menu-button"
              className="header-menu-button"
              type="button"
              aria-expanded="false"
              aria-controls="tools-menu"
            >
              <span>Más</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
            <div id="tools-menu" className="header-popover" hidden>
              <p className="popover-heading">Herramientas</p>
              <button className="popover-item" type="button" data-tab="tab-pomodoro">Pomodoro y cronómetro</button>
              <button className="popover-item" type="button" data-tab="tab-notas">Apuntes por materia</button>
            </div>
          </div>
          <div className="header-menu mobile-nav-menu">
            <button
              id="mobile-menu-button"
              className="header-menu-button hamburger-button"
              type="button"
              aria-label="Abrir menú de navegación"
              aria-expanded="false"
              aria-controls="mobile-nav-menu"
            >
              <span className="hamburger-icon" aria-hidden="true"><span /><span /><span /></span>
              <span>Menú</span>
            </button>
            <div id="mobile-nav-menu" className="header-popover mobile-nav-popover" hidden>
              <p className="popover-heading">Navegación</p>
              <button className="popover-item" type="button" data-tab="tab-resumen">Hoy</button>
              <button className="popover-item" type="button" data-tab="tab-asignaturas">Materias y horario</button>
              <button className="popover-item" type="button" data-tab="tab-entregas">Entregas</button>
              <button className="popover-item" type="button" data-tab="tab-calendario">Calendario</button>
              <button className="popover-item" type="button" data-tab="tab-progreso">Progreso</button>
              <button className="popover-item" type="button" data-tab="tab-pomodoro">Pomodoro y cronómetro</button>
              <button className="popover-item" type="button" data-tab="tab-notas">Apuntes</button>
              <button className="popover-item" type="button" data-tab="tab-dispositivo">Perfil y recordatorios</button>
            </div>
          </div>
          <div className="header-menu profile-menu">
            <button
              id="profile-menu-button"
              className="profile-menu-button"
              type="button"
              aria-label="Abrir menú de perfil"
              aria-expanded="false"
              aria-controls="profile-menu"
            >
              <span className="profile-menu-avatar" aria-hidden="true">
                <span id="profile-menu-initial" className="profile-menu-initial">P</span>
                <img id="profile-menu-photo" className="profile-menu-photo" alt="" hidden />
              </span>
              <span id="profile-menu-name" className="profile-menu-name">Mi perfil</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
            <div id="profile-menu" className="header-popover profile-popover" hidden>
              <p className="popover-heading">Tu cuenta</p>
              <p id="auth-session-status" className="auth-session-status" role="status" aria-live="polite" />
              <button className="popover-item" type="button" data-tab="tab-dispositivo">
                Perfil y recordatorios
              </button>
              <button id="auth-button" className="popover-item" type="button">
                Iniciar sesión o crear cuenta
              </button>
            </div>
          </div>
        </div>
      </header>
      <div id="offline-banner" className="offline-banner" role="status" aria-live="polite" hidden>
        Sin conexión. Tus cambios se guardan y, si has iniciado sesión, se sincronizarán automáticamente cuando vuelva la conexión.
      </div>
      <p id="ios-install-help" className="ios-install-help" role="note" hidden>
        Para instalar en iOS: toca Compartir ➔ Añadir a la pantalla de inicio
      </p>
    </>
  );
}
