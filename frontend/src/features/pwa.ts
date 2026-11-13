import { useCallback, useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export interface PwaController {
  online: boolean;
  installAvailable: boolean;
  showIosInstallHelp: boolean;
  installError: string;
  install: () => Promise<void>;
}

function isIosSafari(): boolean {
  const isIosDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
  return isIosDevice && isSafari;
}

export function usePwa(): PwaController {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [showIosInstallHelp, setShowIosInstallHelp] = useState(isIosSafari);
  const [installError, setInstallError] = useState('');
  const deferredPrompt = useRef<BeforeInstallPromptEvent | undefined>(undefined);

  useEffect(() => {
    const registerServiceWorker = (): void => {
      if (import.meta.env.PROD && 'serviceWorker' in navigator) {
        void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
          .then(registration => console.log('Workbox SW registrado:', registration.scope))
          .catch(error => console.error('Error al registrar SW:', error));
      }
    };
    const updateOnline = (): void => setOnline(true);
    const updateOffline = (): void => setOnline(false);
    const handleInstallPrompt = (event: Event): void => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setInstallAvailable(true);
      setShowIosInstallHelp(false);
      setInstallError('');
    };
    const handleAppInstalled = (): void => {
      deferredPrompt.current = undefined;
      setInstallAvailable(false);
      setShowIosInstallHelp(false);
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true });
    }
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('load', registerServiceWorker);
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<void> => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    deferredPrompt.current = undefined;
    setInstallAvailable(false);
    setInstallError('');
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      console.info('Resultado de instalación:', choice.outcome);
    } catch (error) {
      console.error('No se pudo completar la instalación de la PWA:', error);
      setInstallError(error instanceof Error
        ? `No se pudo completar la instalación: ${error.message}`
        : 'No se pudo completar la instalación.');
    }
  }, []);

  return { online, installAvailable, showIosInstallHelp, installError, install };
}
