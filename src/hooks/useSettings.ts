import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { resolveTheme } from '../constants/themes';
import { storageService } from '../services/storageService';
import { ThemeConfig, UserSettings } from '../types';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    storageService.getSettings().then((loaded) => {
      setSettings(loaded);
      setIsLoaded(true);
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes['sahsi_bookmark_settings']) {
        setSettings({ ...DEFAULT_SETTINGS, ...changes['sahsi_bookmark_settings'].newValue });
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemIsDark(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const updateSettings = async (partial: Partial<UserSettings>) => {
    const updated = await storageService.saveSettings(partial);
    setSettings(updated);
  };

  const resetSettings = async () => {
    const reset = await storageService.resetSettings();
    setSettings(reset);
  };

  const activeTheme: ThemeConfig = resolveTheme(
    settings.themeId,
    settings.customOpacity,
    settings.customBlur
  );

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
    activeTheme,
    systemIsDark,
  };
}
