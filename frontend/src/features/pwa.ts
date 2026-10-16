export function inicializarPwa(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
        .then(reg => console.log('Workbox SW registrado:', reg.scope))
        .catch(err => console.error('Error al registrar SW:', err));
    });
  }

  function actualizarEstadoRed() {
    const badge = document.getElementById('network-status');
    const offlineBanner = document.getElementById('offline-banner');
    if (!badge) return;
    if (navigator.onLine) {
      badge.className = 'badge online';
      badge.innerHTML = `<span class="badge-dot"></span><span>En línea</span>`;
      if (offlineBanner) offlineBanner.hidden = true;
    } else {
      badge.className = 'badge offline';
      badge.innerHTML = `<span class="badge-dot"></span><span>Sin conexión (Offline)</span>`;
      if (offlineBanner) offlineBanner.hidden = false;
    }
  }
  window.addEventListener('online', actualizarEstadoRed);
  window.addEventListener('offline', actualizarEstadoRed);
  actualizarEstadoRed();

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
  }

  let deferredInstallPrompt: BeforeInstallPromptEvent | undefined;
  const installButton = document.getElementById('install-app') as HTMLButtonElement | null;
  const iosInstallHelp = document.getElementById('ios-install-help') as HTMLParagraphElement | null;

  if (installButton) installButton.hidden = true;
  if (iosInstallHelp) iosInstallHelp.hidden = true;

  const isIosDevice =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    
    if (installButton) installButton.hidden = false;
    if (iosInstallHelp) iosInstallHelp.hidden = true;
  });

  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;

      const installPrompt = deferredInstallPrompt;
      deferredInstallPrompt = undefined;
      installButton.hidden = true;

      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      console.info('Resultado de instalación:', choice.outcome);
    });
  }

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = undefined;
    if (installButton) installButton.hidden = true;
    if (iosInstallHelp) iosInstallHelp.hidden = true;
  });

  if (isIosDevice && isSafari && iosInstallHelp) {
    iosInstallHelp.hidden = false;
  }

}
