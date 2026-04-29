import { create } from 'zustand';
import { SiteSettings } from '../types';
import { databaseService } from '../services/databaseService';
import { DEFAULT_SITE_SETTINGS } from '../constants/defaultSettings';
import { syncManager } from '../utils/sync';

interface SettingsState {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const data = await databaseService.getSiteSettings();
      
      // Robust merge: Use default if database value is missing, empty string, or empty array
      const mergedSettings = { ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings;
      
      (Object.keys(DEFAULT_SITE_SETTINGS) as Array<keyof SiteSettings>).forEach(key => {
        const value = data[key];
        if (value === undefined || value === null) {
          // @ts-ignore
          mergedSettings[key] = DEFAULT_SITE_SETTINGS[key];
        }
      });
      
      set({ settings: mergedSettings, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch site settings', isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...newSettings } : (newSettings as SiteSettings)
    }));
    
    try {
      const { settings } = get();
      if (settings) {
        await databaseService.updateSiteSettings(settings);
        syncManager.broadcast('SYNC_SETTINGS');
      }
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
  }
}));

// Subscribe to global sync events
if (typeof window !== 'undefined') {
  syncManager.subscribe((type) => {
    if (type === 'SYNC_SETTINGS') {
      useSettingsStore.getState().fetchSettings();
    }
  });
}
