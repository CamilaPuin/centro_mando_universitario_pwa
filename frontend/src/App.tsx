import { useEffect, useMemo, useState } from 'react';
import { inicializarAutenticacion } from './features/auth';
import { inicializarNavegacion } from './features/navegacion';
import { inicializarNotificaciones } from './features/notificaciones';
import { inicializarPomodoro } from './features/pomodoro';
import { inicializarPerfil } from './features/profile';
import { inicializarPwa } from './features/pwa';
import { inicializarSincronizacion } from './features/sync';
import { inicializarTema } from './features/tema';
import { abrirBaseDeDatos } from './utils/db';
import { NavegacionTabs } from './ui/NavegacionTabs';
import { Encabezado } from './ui/Encabezado';
import { ModuloAsignaturas } from './ui/modulos/asignaturas';
import { ModuloCalendario } from './ui/modulos/calendario';
import { DialogoCuenta } from './ui/modulos/cuenta';
import { ModuloDispositivo } from './ui/modulos/dispositivo';
import { ModuloEntregas } from './ui/modulos/entregas';
import { ModuloNotas } from './ui/modulos/notas';
import { ModuloPomodoro } from './ui/modulos/pomodoro';
import { ModuloProgreso } from './ui/modulos/progreso';
import { ModuloResumen } from './ui/modulos/resumen';

export function App() {
  const [tabActiva, setTabActiva] = useState('tab-resumen');
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
    inicializarTema();
    inicializarPwa();
    const limpiarNavegacion = inicializarNavegacion();
    inicializarAutenticacion();

    const actualizarNavegacionSecundaria = (tabId: string): void => {
      document.querySelectorAll<HTMLButtonElement>('#mobile-nav-menu [data-tab]').forEach(menuItem => {
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
      const button = target.closest<HTMLButtonElement>('[data-tab]');
      if (!button) return;

      const tabId = button.getAttribute('data-tab');
      const view = tabId ? document.getElementById(tabId) : null;
      if (!tabId || !view?.classList.contains('tab-view')) return;

      setTabActiva(tabId);
      actualizarNavegacionSecundaria(tabId);
      window.dispatchEvent(new Event('close-header-menus'));

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

    return () => {
      root?.removeEventListener('click', handleTabClick);
      limpiarNavegacion();
      limpiarSincronizacion();
    };
  }, []);

  return (
    <div className="app-container">
      <Encabezado />
      <main id="main-content">
        <NavegacionTabs tabActiva={tabActiva} />
        <ModuloResumen activo={tabActiva === 'tab-resumen'} databaseReady={databaseReady} />
        <ModuloAsignaturas activo={tabActiva === 'tab-asignaturas'} databaseReady={databaseReady} />
        <ModuloEntregas activo={tabActiva === 'tab-entregas'} databaseReady={databaseReady} />
        <ModuloCalendario activo={tabActiva === 'tab-calendario'} databaseReady={databaseReady} />
        <ModuloProgreso activo={tabActiva === 'tab-progreso'} databaseReady={databaseReady} />
        <ModuloNotas activo={tabActiva === 'tab-notas'} databaseReady={databaseReady} />
        <ModuloPomodoro activo={tabActiva === 'tab-pomodoro'} />
        <ModuloDispositivo activo={tabActiva === 'tab-dispositivo'} />
      </main>
      <DialogoCuenta />
      <footer className="app-footer">
        Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
      </footer>
    </div>
  );
}
