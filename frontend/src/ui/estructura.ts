export function renderizarEncabezado(fechaFormateada: string): string {
  return `
    <header class="top-nav">
      <div class="brand-section">
        <img src="icons/icon-192.png" alt="Centro de Mando Universitario" class="brand-logo" />
        <div>
          <div class="brand-title">Centro de Mando Universitario</div>
          <div class="brand-subtitle">Gestión académica personal</div>
        </div>
      </div>
      <div class="nav-meta">
        <div class="date-pill"><span>${fechaFormateada}</span></div>
        <span id="network-status" class="badge online">
          <span class="badge-dot"></span>
          <span>En línea</span>
        </span>
        <button id="theme-toggle" class="header-menu-button theme-toggle-button" type="button"
                aria-label="Cambiar a modo oscuro" title="Cambiar a modo oscuro">
          <svg class="theme-icon theme-icon-sun" aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
          <svg class="theme-icon theme-icon-moon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
          </svg>
        </button>
        <button id="install-app" class="install-button" type="button" hidden>Instalar</button>
        <div class="header-menu tools-menu">
          <button id="tools-menu-button" class="header-menu-button" type="button"
                  aria-expanded="false" aria-controls="tools-menu">
            <span>Más</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </button>
          <div id="tools-menu" class="header-popover" hidden>
            <p class="popover-heading">Herramientas</p>
            <button class="popover-item" type="button" data-tab="tab-pomodoro">Pomodoro y cronómetro</button>
            <button class="popover-item" type="button" data-tab="tab-notas">Apuntes por materia</button>
          </div>
        </div>
        <div class="header-menu mobile-nav-menu">
          <button id="mobile-menu-button" class="header-menu-button hamburger-button" type="button"
                  aria-label="Abrir menú de navegación" aria-expanded="false" aria-controls="mobile-nav-menu">
            <span class="hamburger-icon" aria-hidden="true"><span></span><span></span><span></span></span>
            <span>Menú</span>
          </button>
          <div id="mobile-nav-menu" class="header-popover mobile-nav-popover" hidden>
            <p class="popover-heading">Navegación</p>
            <button class="popover-item" type="button" data-tab="tab-resumen">Hoy</button>
            <button class="popover-item" type="button" data-tab="tab-asignaturas">Materias y horario</button>
            <button class="popover-item" type="button" data-tab="tab-entregas">Entregas</button>
            <button class="popover-item" type="button" data-tab="tab-calendario">Calendario</button>
            <button class="popover-item" type="button" data-tab="tab-progreso">Progreso</button>
            <button class="popover-item" type="button" data-tab="tab-pomodoro">Pomodoro y cronómetro</button>
            <button class="popover-item" type="button" data-tab="tab-notas">Apuntes</button>
            <button class="popover-item" type="button" data-tab="tab-dispositivo">Perfil y recordatorios</button>
          </div>
        </div>
        <div class="header-menu profile-menu">
          <button id="profile-menu-button" class="profile-menu-button" type="button"
                  aria-label="Abrir menú de perfil" aria-expanded="false" aria-controls="profile-menu">
            <span class="profile-menu-avatar" aria-hidden="true">
              <span id="profile-menu-initial" class="profile-menu-initial">P</span>
              <img id="profile-menu-photo" class="profile-menu-photo" alt="" hidden />
            </span>
            <span id="profile-menu-name" class="profile-menu-name">Mi perfil</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path d="m5 7.5 5 5 5-5" />
            </svg>
          </button>
          <div id="profile-menu" class="header-popover profile-popover" hidden>
            <p class="popover-heading">Tu cuenta</p>
            <p id="auth-session-status" class="auth-session-status" role="status" aria-live="polite"></p>
            <button class="popover-item" type="button" data-tab="tab-dispositivo">Perfil y recordatorios</button>
            <button id="auth-button" class="popover-item" type="button">Iniciar sesión o crear cuenta</button>
          </div>
        </div>
      </div>
    </header>
    <div id="offline-banner" class="offline-banner" role="status" aria-live="polite" hidden>
      Sin conexión. Tus cambios se guardan y, si has iniciado sesión, se sincronizarán automáticamente cuando vuelva la conexión.
    </div>
    <p id="ios-install-help" class="ios-install-help" role="note" hidden>
      Para instalar en iOS: toca Compartir ➔ Añadir a la pantalla de inicio
    </p>
  `;
}

export function renderizarNavegacion(): string {
  return `
    <nav class="nav-tabs" aria-label="Secciones principales">
      <button class="tab-btn active" type="button" data-tab="tab-resumen" aria-current="page" aria-controls="tab-resumen">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3.75 10.5 12 3.75l8.25 6.75v9a.75.75 0 0 1-.75.75h-5.25v-6h-4.5v6H4.5a.75.75 0 0 1-.75-.75v-9Z" /></svg>
        <span class="tab-label">Hoy</span>
      </button>
      <button class="tab-btn" type="button" data-tab="tab-asignaturas" aria-controls="tab-asignaturas">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4.5 5.25h10.125A2.625 2.625 0 0 1 17.25 7.875V20.25H7.125A2.625 2.625 0 0 1 4.5 17.625V5.25Zm12.75 3h2.25v12h-2.25M8.25 9h6M8.25 12.75h6" /></svg>
        <span class="tab-label">Materias</span>
      </button>
      <button class="tab-btn" type="button" data-tab="tab-entregas" aria-controls="tab-entregas">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M8.25 5.25h-3A1.5 1.5 0 0 0 3.75 6.75v12A1.5 1.5 0 0 0 5.25 20.25h13.5a1.5 1.5 0 0 0 1.5-1.5v-12a1.5 1.5 0 0 0-1.5-1.5h-3M8.25 5.25a1.5 1.5 0 0 1 1.5-1.5h4.5a1.5 1.5 0 0 1 1.5 1.5v1.5h-7.5v-1.5Zm-.75 7.5 2.25 2.25 6-6" /></svg>
        <span class="tab-label">Entregas</span>
      </button>
      <button class="tab-btn" type="button" data-tab="tab-calendario" aria-controls="tab-calendario">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M7.5 3.75v3m9-3v3m-12 3h15m-15-3h15a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-10.5a1.5 1.5 0 0 1 1.5-1.5Z" /></svg>
        <span class="tab-label">Calendario</span>
      </button>
      <button class="tab-btn" type="button" data-tab="tab-progreso" aria-controls="tab-progreso">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4.5 19.5V12m5 7.5V7.5m5 12V4.5m5 15v-9" /></svg>
        <span class="tab-label">Progreso</span>
      </button>
    </nav>
  `;
}

export function renderizarPie(): string {
  return `
    <footer class="app-footer">
      Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
    </footer>
  `;
}
