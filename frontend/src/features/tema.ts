import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'cmu-theme';

type Theme = 'light' | 'dark';

interface ThemePreference {
  theme: Theme;
  selectedByUser: boolean;
}

function readStoredTheme(): Theme | null {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  } catch (error) {
    console.warn('No se pudo leer la preferencia de tema:', error);
    return null;
  }
}

function getInitialPreference(): ThemePreference {
  const savedTheme = readStoredTheme();
  return {
    theme: savedTheme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    selectedByUser: savedTheme !== null
  };
}

export function useTema(): { theme: Theme; toggleTheme: () => void } {
  const [preference, setPreference] = useState(getInitialPreference);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preference.theme;
    root.style.colorScheme = preference.theme;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = preference.theme === 'dark' ? '#191919' : '#ffffff';
  }, [preference.theme]);

  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (event: MediaQueryListEvent): void => {
      setPreference(current => current.selectedByUser
        ? current
        : { ...current, theme: event.matches ? 'dark' : 'light' });
    };
    systemTheme.addEventListener('change', updateSystemTheme);
    return () => systemTheme.removeEventListener('change', updateSystemTheme);
  }, []);

  const toggleTheme = (): void => {
    const nextTheme: Theme = preference.theme === 'dark' ? 'light' : 'dark';
    setPreference({ theme: nextTheme, selectedByUser: true });
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn('No se pudo guardar la preferencia de tema:', error);
    }
  };

  return { theme: preference.theme, toggleTheme };
}
