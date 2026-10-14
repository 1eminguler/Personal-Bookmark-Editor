import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { UserSettings } from '../types';

const SETTINGS_KEY = 'sahsi_bookmark_settings';

export const storageService = {
  async getSettings(): Promise<UserSettings> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(SETTINGS_KEY);
        if (result && result[SETTINGS_KEY]) {
          return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
        }
      } else if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(SETTINGS_KEY);
        if (item) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(item) };
        }
      }
    } catch (e) {
      console.warn('Storage read failed, falling back to defaults', e);
    }
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Storage save failed', e);
    }
    return updated;
  },

  async resetSettings(): Promise<UserSettings> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (e) {
      console.error('Storage reset failed', e);
    }
    return DEFAULT_SETTINGS;
  },
};
