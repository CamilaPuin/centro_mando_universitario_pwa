import { useEffect, useRef, useState, type ReactElement } from 'react';

function obtenerFechaFormateada(): string {
  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);
}

type MenuAbierto = 'herramientas' | 'navegacion' | 'perfil' | null;

interface EncabezadoProps {
  tabActiva: string;
  theme: 'light' | 'dark';
  authUsername?: string;
  authSessionMessage: string;
  authOffline: boolean;
  profileName: string;
  profileInitial: string;
  profilePhotoUrl?: string;
  online: boolean;
  installAvailable: boolean;
  showIosInstallHelp: boolean;
  installError: string;
  onNavigate: (tabId: string, focusTargetId?: string) => void;
  onAuthAction: () => void;
  onInstall: () => void;
  onToggleTheme: () => void;
}

export function Encabezado({
  tabActiva,
  theme,
  authUsername,
  authSessionMessage,
  authOffline,
  profileName,
  profileInitial,
  profilePhotoUrl,
  online,
  installAvailable,
  showIosInstallHelp,
  installError,
  onNavigate,
  onAuthAction,
  onInstall,
  onToggleTheme
}: EncabezadoProps): ReactElement {
  const [menuAbierto, setMenuAbierto] = useState<MenuAbierto>(null);
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
  const herramientasMenu = useRef<HTMLDivElement>(null);
  const navegacionMenu = useRef<HTMLDivElement>(null);
  const perfilMenu = useRef<HTMLDivElement>(null);
  const herramientasButton = useRef<HTMLButtonElement>(null);
  const navegacionButton = useRef<HTMLButtonElement>(null);
  const perfilButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const cerrarMenu = (): void => setMenuAbierto(null);
    const cerrarAlHacerClickFuera = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const dentroDeMenu = [
        herramientasMenu,
        navegacionMenu,
        perfilMenu
      ].some(menu => menu.current?.contains(target));
      if (!dentroDeMenu) cerrarMenu();
    };
    const cerrarAlPresionarEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || menuAbierto === null) return;
      const botonActivo = menuAbierto === 'herramientas'
        ? herramientasButton
        : menuAbierto === 'navegacion' ? navegacionButton : perfilButton;
      cerrarMenu();
      botonActivo.current?.focus();
    };

    window.addEventListener('close-header-menus', cerrarMenu);
    document.addEventListener('pointerdown', cerrarAlHacerClickFuera);
    document.addEventListener('keydown', cerrarAlPresionarEscape);
    return () => {
      window.removeEventListener('close-header-menus', cerrarMenu);
      document.removeEventListener('pointerdown', cerrarAlHacerClickFuera);
      document.removeEventListener('keydown', cerrarAlPresionarEscape);
    };
  }, [menuAbierto]);

  const alternarMenu = (menu: Exclude<MenuAbierto, null>): void => {
    setMenuAbierto(actual => actual === menu ? null : menu);
  };
  const navegar = (tabId: string, focusTargetId?: string): void => {
    setMenuAbierto(null);
    onNavigate(tabId, focusTargetId);
  };
  const etiquetaTema = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  const showProfilePhoto = Boolean(profilePhotoUrl) && !profilePhotoFailed;

  useEffect(() => {
    setProfilePhotoFailed(false);
  }, [profilePhotoUrl]);

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
          <span id="network-status" className={`badge ${online ? 'online' : 'offline'}`}>
            <span className="badge-dot" />
            <span>{online ? 'En línea' : 'Sin conexión'}</span>
          </span>
          <button
            id="theme-toggle"
            className="header-menu-button theme-toggle-button"
            type="button"
            aria-label={etiquetaTema}
            title={etiquetaTema}
            onClick={onToggleTheme}
          >
            <svg className="theme-icon theme-icon-sun" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
            <svg className="theme-icon theme-icon-moon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
            </svg>
          </button>
          <button
            id="install-app"
            className="install-button"
            type="button"
            hidden={!installAvailable}
            onClick={onInstall}
          >
            Instalar
          </button>
          {installError && <p className="device-status" role="status">{installError}</p>}
          <div className="header-menu tools-menu" ref={herramientasMenu}>
            <button
              ref={herramientasButton}
              id="tools-menu-button"
              className="header-menu-button"
              type="button"
              aria-current={tabActiva === 'tab-pomodoro' || tabActiva === 'tab-notas' ? 'page' : undefined}
              aria-expanded={menuAbierto === 'herramientas'}
              aria-controls="tools-menu"
              onClick={() => alternarMenu('herramientas')}
            >
              <span>Más</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
            <div id="tools-menu" className="header-popover" hidden={menuAbierto !== 'herramientas'}>
              <p className="popover-heading">Herramientas</p>
              <button className="popover-item" type="button" onClick={() => navegar('tab-pomodoro')}>
                Pomodoro y cronómetro
              </button>
              <button className="popover-item" type="button" onClick={() => navegar('tab-notas')}>
                Apuntes por materia
              </button>
            </div>
          </div>
          <div className="header-menu mobile-nav-menu" ref={navegacionMenu}>
            <button
              ref={navegacionButton}
              id="mobile-menu-button"
              className="header-menu-button hamburger-button"
              type="button"
              aria-label={menuAbierto === 'navegacion'
                ? 'Cerrar menú de navegación'
                : 'Abrir menú de navegación'}
              aria-expanded={menuAbierto === 'navegacion'}
              aria-controls="mobile-nav-menu"
              onClick={() => alternarMenu('navegacion')}
            >
              <span className="hamburger-icon" aria-hidden="true"><span /><span /><span /></span>
              <span>Menú</span>
            </button>
            <div
              id="mobile-nav-menu"
              className="header-popover mobile-nav-popover"
              hidden={menuAbierto !== 'navegacion'}
            >
              <p className="popover-heading">Navegación</p>
              <button className="popover-item" type="button" aria-current={tabActiva === 'tab-resumen' ? 'page' : undefined} onClick={() => navegar('tab-resumen')}>Hoy</button>
              <button className="popover-item" type="button" aria-current={tabActiva === 'tab-asignaturas' ? 'page' : undefined} onClick={() => navegar('tab-asignaturas')}>Materias y horario</button>
              <button className="popover-item" type="button" aria-current={tabActiva === 'tab-entregas' ? 'page' : undefined} onClick={() => navegar('tab-entregas')}>Entregas</button>
              <button className="popover-item" type="button" aria-current={tabActiva === 'tab-calendario' ? 'page' : undefined} onClick={() => navegar('tab-calendario')}>Calendario</button>
              <button className="popover-item" type="button" aria-current={tabActiva === 'tab-progreso' ? 'page' : undefined} onClick={() => navegar('tab-progreso')}>Progreso</button>
              <button className="popover-item" type="button" aria-current={tabActiva === 'tab-pomodoro' ? 'page' : undefined} onClick={() => navegar('tab-pomodoro')}>Pomodoro y cronómetro</button>
              <button className="popover-item" type="button" aria-current={tabActiva === 'tab-notas' ? 'page' : undefined} onClick={() => navegar('tab-notas')}>Apuntes</button>
              <button className="popover-item" type="button" aria-current={tabActiva === 'tab-dispositivo' ? 'page' : undefined} onClick={() => navegar('tab-dispositivo')}>Perfil y recordatorios</button>
            </div>
          </div>
          <div className="header-menu profile-menu" ref={perfilMenu}>
            <button
              ref={perfilButton}
              id="profile-menu-button"
              className="profile-menu-button"
              type="button"
              aria-current={tabActiva === 'tab-dispositivo' ? 'page' : undefined}
              aria-label="Abrir menú de perfil"
              aria-expanded={menuAbierto === 'perfil'}
              aria-controls="profile-menu"
              onClick={() => alternarMenu('perfil')}
            >
              <span className="profile-menu-avatar" aria-hidden="true">
                <span id="profile-menu-initial" className="profile-menu-initial" hidden={showProfilePhoto}>
                  {profileInitial}
                </span>
                <img
                  id="profile-menu-photo"
                  className="profile-menu-photo"
                  alt=""
                  src={profilePhotoUrl}
                  hidden={!showProfilePhoto}
                  onError={() => setProfilePhotoFailed(true)}
                />
              </span>
              <span id="profile-menu-name" className="profile-menu-name">{profileName}</span>
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
            <div id="profile-menu" className="header-popover profile-popover" hidden={menuAbierto !== 'perfil'}>
              <p className="popover-heading">Tu cuenta</p>
              <p
                id="auth-session-status"
                className={`auth-session-status${authOffline ? ' offline-session' : ''}`}
                role="status"
                aria-live="polite"
              >
                {authSessionMessage}
              </p>
              <button className="popover-item" type="button" onClick={() => navegar('tab-dispositivo')}>
                Perfil y recordatorios
              </button>
              <button
                id="auth-button"
                className="popover-item"
                type="button"
                aria-label={authUsername ? `Cerrar sesión de ${authUsername}` : 'Iniciar sesión'}
                onClick={onAuthAction}
              >
                {authUsername ? 'Cerrar sesión' : 'Iniciar sesión / Crear cuenta'}
              </button>
            </div>
          </div>
        </div>
      </header>
      <div id="offline-banner" className="offline-banner" role="status" aria-live="polite" hidden={online}>
        Sin conexión. Tus cambios se guardan y, si has iniciado sesión, se sincronizarán automáticamente cuando vuelva la conexión.
      </div>
      <p id="ios-install-help" className="ios-install-help" role="note" hidden={!showIosInstallHelp}>
        Para instalar en iOS: toca Compartir ➔ Añadir a la pantalla de inicio
      </p>
    </>
  );
}
