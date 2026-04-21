import { create } from 'zustand';
import { SiteSettings } from '../types';
import { databaseService } from '../services/databaseService';

interface SettingsState {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const data = await databaseService.getSiteSettings();
      set({ settings: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch site settings', isLoading: false });
    }
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...newSettings } : (newSettings as SiteSettings)
    }));
  }
}));
