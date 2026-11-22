import { useEffect, useMemo, useState } from 'react';
import { inicializarAutenticacion } from './features/auth';
import { inicializarNavegacion } from './features/navegacion';
import { inicializarNotificaciones } from './features/notificaciones';
import { inicializarPomodoro } from './features/pomodoro';
import { inicializarPerfil } from './features/profile';
import { inicializarPwa } from './features/pwa';
import { inicializarSincronizacion } from './features/sync';
import { inicializarTema } from './features/tema';
import { isUserSessionActive, restaurarSesionGuardada } from './services/api';
import { abrirBaseDeDatos } from './utils/db';
import { NavegacionTabs } from './ui/NavegacionTabs';
import { Encabezado } from './ui/Encabezado';
import { ModuloAsignaturas } from './ui/modulos/asignaturas';
import { ModuloCalendario } from './ui/modulos/calendario';
import { PantallaCuenta } from './ui/modulos/cuenta';
import { ModuloDispositivo } from './ui/modulos/dispositivo';
import { ModuloEntregas } from './ui/modulos/entregas';
import { ModuloNotas } from './ui/modulos/notas';
import { ModuloPomodoro } from './ui/modulos/pomodoro';
import { ModuloProgreso } from './ui/modulos/progreso';
import { ModuloResumen } from './ui/modulos/resumen';

export function App() {
  const [tabActiva, setTabActiva] = useState('tab-resumen');
  const [sesionActiva, setSesionActiva] = useState(() => {
    restaurarSesionGuardada();
    return isUserSessionActive();
  });
  const databaseReady = useMemo(() =>
    'indexedDB' in window &&
    typeof window.indexedDB !== 'undefined' &&
    typeof window.indexedDB.open === 'function'
      ? abrirBaseDeDatos().catch(error => {
          console.error('No se pudo abrir el almacenamiento local:', error);
          return undefined;
        })
      : Promise.resolve(undefined), []);

  useEffect(() => {
    const actualizarSesion = (): void => setSesionActiva(isUserSessionActive());
    window.addEventListener('auth-changed', actualizarSesion);
    inicializarTema();
    inicializarPwa();
    const limpiarNavegacion = inicializarNavegacion();
    inicializarAutenticacion(databaseReady);

    const actualizarNavegacionSecundaria = (tabId: string): void => {
      document.querySelectorAll<HTMLButtonElement>('#mobile-nav-drawer [data-tab]').forEach(menuItem => {
        if (menuItem.getAttribute('data-tab') === tabId) {
          menuItem.setAttribute('aria-current', 'page');
        } else {
          menuItem.removeAttribute('aria-current');
        }
      });

      document.getElementById('tools-menu-button')?.toggleAttribute(
        'aria-current',
        tabId === 'tab-pomodoro' || tabId === 'tab-notas'
      );
      document.getElementById('profile-menu-button')?.toggleAttribute(
        'aria-current',
        tabId === 'tab-dispositivo'
      );
    };
    actualizarNavegacionSecundaria('tab-resumen');

    const handleTabClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('[data-tab]');
      if (!button) return;

      const tabId = button.getAttribute('data-tab');
      const view = tabId ? document.getElementById(tabId) : null;
      if (!tabId || !view?.classList.contains('tab-view')) return;

      setTabActiva(tabId);
      actualizarNavegacionSecundaria(tabId);
      window.dispatchEvent(new Event('close-header-menus'));

      // Cerrar menú móvil si está abierto
      cerrarMenuMovil();

      const focusTargetId = button.getAttribute('data-focus');
      if (focusTargetId) document.getElementById(focusTargetId)?.focus();
      if (tabId !== 'tab-pomodoro' && document.body.classList.contains('focus-mode')) {
        document.body.classList.remove('focus-mode');
        const focusButton = document.getElementById('btn-focus-mode');
        focusButton?.setAttribute('aria-pressed', 'false');
        if (focusButton) focusButton.textContent = 'Activar modo enfoque';
      }
    };

    const root = document.getElementById('app');
    root?.addEventListener('click', handleTabClick);

    inicializarPomodoro(databaseReady);
    const limpiarSincronizacion = inicializarSincronizacion(databaseReady);
    inicializarNotificaciones(databaseReady);
    inicializarPerfil(databaseReady);

    // Manejar apertura/cierre del menú móvil
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavClose = document.getElementById('mobile-nav-close');

    // Función para cerrar el menú móvil (se declara antes de usarla en handleTabClick)
    const cerrarMenuMovil = (): void => {
      mobileNavDrawer?.setAttribute('aria-hidden', 'true');
      mobileMenuButton?.setAttribute('aria-expanded', 'false');
      mobileNavOverlay?.classList.remove('active');
      document.body.classList.remove('mobile-menu-open');
      mobileMenuButton?.focus();
    };

    // Inicializar estado del drawer
    mobileNavDrawer?.setAttribute('aria-hidden', 'true');

    const abrirMenuMovil = (): void => {
      mobileNavDrawer?.setAttribute('aria-hidden', 'false');
      mobileMenuButton?.setAttribute('aria-expanded', 'true');
      mobileNavOverlay?.classList.add('active');
      document.body.classList.add('mobile-menu-open');
      // Enfocar el botón de cerrar para accesibilidad
      mobileNavClose?.focus();
    };

    // Manejar Escape para cerrar el menú
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) {
        cerrarMenuMovil();
      }
    };

    if (mobileMenuButton && mobileNavDrawer && mobileNavOverlay) {
      mobileMenuButton.addEventListener('click', abrirMenuMovil);
      mobileNavClose?.addEventListener('click', cerrarMenuMovil);
      mobileNavOverlay.addEventListener('click', cerrarMenuMovil);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('auth-changed', actualizarSesion);
      root?.removeEventListener('click', handleTabClick);
      mobileMenuButton?.removeEventListener('click', abrirMenuMovil);
      mobileNavClose?.removeEventListener('click', cerrarMenuMovil);
      mobileNavOverlay?.removeEventListener('click', cerrarMenuMovil);
      document.removeEventListener('keydown', handleKeyDown);
      limpiarNavegacion();
      limpiarSincronizacion();
    };
  }, []);

  return (
    <>
      <div className="app-container" hidden={!sesionActiva}>
        <Encabezado />
        <main id="main-content">
          <NavegacionTabs tabActiva={tabActiva} />
          <ModuloResumen activo={tabActiva === 'tab-resumen'} databaseReady={databaseReady} />
          <ModuloAsignaturas activo={tabActiva === 'tab-asignaturas'} databaseReady={databaseReady} />
          <ModuloEntregas activo={tabActiva === 'tab-entregas'} databaseReady={databaseReady} />
          <ModuloCalendario activo={tabActiva === 'tab-calendario'} databaseReady={databaseReady} />
          <ModuloProgreso activo={tabActiva === 'tab-progreso'} databaseReady={databaseReady} />
          <ModuloNotas activo={tabActiva === 'tab-notas'} databaseReady={databaseReady} />
          <ModuloPomodoro activo={tabActiva === 'tab-pomodoro'} databaseReady={databaseReady} />
          <ModuloDispositivo activo={tabActiva === 'tab-dispositivo'} />
        </main>
        <footer className="app-footer">
          Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
        </footer>
      </div>
      <PantallaCuenta oculta={sesionActiva} />
    </>
  );
}
