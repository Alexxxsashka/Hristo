import { create } from 'zustand';
import { SiteSettings } from '../types';
import { databaseService } from '../services/databaseService';
import { DEFAULT_SITE_SETTINGS } from '../constants/defaultSettings';

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
      // Merge with defaults to ensure all fields have values
      const mergedSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...data,
        // Ensure arrays are merged properly or at least exist
        heroSlides: data.heroSlides?.length ? data.heroSlides : DEFAULT_SITE_SETTINGS.heroSlides,
        promoBanners: data.promoBanners?.length ? data.promoBanners : DEFAULT_SITE_SETTINGS.promoBanners,
        featuredCategoriesList: data.featuredCategoriesList?.length ? data.featuredCategoriesList : DEFAULT_SITE_SETTINGS.featuredCategoriesList,
        footerTags: data.footerTags?.length ? data.footerTags : DEFAULT_SITE_SETTINGS.footerTags,
      } as SiteSettings;
      
      set({ settings: mergedSettings, isLoading: false });
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
