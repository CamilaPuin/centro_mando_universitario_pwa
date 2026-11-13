import { useEffect, useMemo, useState } from 'react';
import { cerrarSesion, useEstadoAutenticacion } from './features/auth';
import { usePerfilLocal } from './features/profile';
import { usePwa } from './features/pwa';
import { inicializarSincronizacion } from './features/sync';
import { useTema } from './features/tema';
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
  const [focusAfterNavigation, setFocusAfterNavigation] = useState<string>();
  const [dialogoCuentaAbierto, setDialogoCuentaAbierto] = useState(false);
  const [errorAccionCuenta, setErrorAccionCuenta] = useState('');
  const { theme, toggleTheme } = useTema();
  const { session, sessionMessage, offline } = useEstadoAutenticacion();
  const databaseReady = useMemo(() =>
    'indexedDB' in window &&
    typeof window.indexedDB !== 'undefined' &&
    typeof window.indexedDB.open === 'function'
      ? abrirBaseDeDatos().catch(error => {
          console.error('No se pudo abrir el almacenamiento local:', error);
          return undefined;
        })
      : Promise.resolve(undefined), []);
  const profile = usePerfilLocal(databaseReady);
  const pwa = usePwa();

  const accionarCuenta = (): void => {
    window.dispatchEvent(new Event('close-header-menus'));
    setErrorAccionCuenta('');
    if (!session) {
      setDialogoCuentaAbierto(true);
      return;
    }
    try {
      cerrarSesion();
    } catch (error) {
      console.error('No se pudo cerrar la sesión:', error);
      setErrorAccionCuenta(error instanceof Error
        ? error.message
        : 'No se pudo cerrar la sesión.');
    }
  };

  const navegarA = (tabId: string, focusTargetId?: string): void => {
    setTabActiva(tabId);
    setFocusAfterNavigation(focusTargetId);
    window.dispatchEvent(new Event('close-header-menus'));
    if (tabId !== 'tab-pomodoro') window.dispatchEvent(new Event('salir-modo-enfoque'));
  };

  useEffect(() => {
    if (!focusAfterNavigation) return;
    document.getElementById(focusAfterNavigation)?.focus();
    setFocusAfterNavigation(undefined);
  }, [tabActiva, focusAfterNavigation]);

  useEffect(() => {
    const limpiarSincronizacion = inicializarSincronizacion(databaseReady);

    return () => {
      limpiarSincronizacion();
    };
  }, []);

  return (
    <div className="app-container">
      <Encabezado
        tabActiva={tabActiva}
        theme={theme}
        authUsername={session?.username}
        authSessionMessage={errorAccionCuenta || sessionMessage}
        authOffline={offline}
        profileName={profile.displayName}
        profileInitial={profile.initial}
        profilePhotoUrl={profile.photoUrl}
        online={pwa.online}
        installAvailable={pwa.installAvailable}
        showIosInstallHelp={pwa.showIosInstallHelp}
        installError={pwa.installError}
        onNavigate={navegarA}
        onAuthAction={accionarCuenta}
        onInstall={() => { void pwa.install(); }}
        onToggleTheme={toggleTheme}
      />
      <main id="main-content">
        <NavegacionTabs tabActiva={tabActiva} onNavigate={navegarA} />
        <ModuloResumen
          activo={tabActiva === 'tab-resumen'}
          databaseReady={databaseReady}
          onNavigate={navegarA}
        />
        <ModuloAsignaturas activo={tabActiva === 'tab-asignaturas'} databaseReady={databaseReady} />
        <ModuloEntregas activo={tabActiva === 'tab-entregas'} databaseReady={databaseReady} />
        <ModuloCalendario activo={tabActiva === 'tab-calendario'} databaseReady={databaseReady} />
        <ModuloProgreso activo={tabActiva === 'tab-progreso'} databaseReady={databaseReady} />
        <ModuloNotas activo={tabActiva === 'tab-notas'} databaseReady={databaseReady} />
        <ModuloPomodoro activo={tabActiva === 'tab-pomodoro'} databaseReady={databaseReady} />
        <ModuloDispositivo
          activo={tabActiva === 'tab-dispositivo'}
          databaseReady={databaseReady}
          profile={profile}
        />
      </main>
      <DialogoCuenta
        open={dialogoCuentaAbierto}
        online={!offline}
        onClose={() => setDialogoCuentaAbierto(false)}
      />
      <footer className="app-footer">
        Centro de Mando Universitario Personal • PWA de Gestión Académica • 2026
      </footer>
    </div>
  );
}
