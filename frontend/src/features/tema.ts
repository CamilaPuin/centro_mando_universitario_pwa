type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'cmu-theme';

export function inicializarTema(): () => void {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let userSelectedTheme = false;

  const getStoredTheme = (): Theme | null => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
    } catch (error) {
      console.warn('No se pudo leer la preferencia de tema:', error);
      return null;
    }
  };

  const applyTheme = (theme: Theme): void => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (button) {
      const nextThemeLabel = theme === 'dark' ? 'claro' : 'oscuro';
      const label = `Cambiar a modo ${nextThemeLabel}`;
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    }
    if (themeColor) themeColor.content = theme === 'dark' ? '#191919' : '#ffffff';
  };

  const savedTheme = getStoredTheme();
  userSelectedTheme = savedTheme !== null;
  applyTheme(savedTheme ?? (systemTheme.matches ? 'dark' : 'light'));

  const toggleTheme = (): void => {
    const nextTheme: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    userSelectedTheme = true;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn('No se pudo guardar la preferencia de tema:', error);
    }
  };
  const followSystemTheme = (event: MediaQueryListEvent): void => {
    if (!userSelectedTheme) applyTheme(event.matches ? 'dark' : 'light');
  };

  button?.addEventListener('click', toggleTheme);
  systemTheme.addEventListener('change', followSystemTheme);

  return () => {
    button?.removeEventListener('click', toggleTheme);
    systemTheme.removeEventListener('change', followSystemTheme);
  };
}
