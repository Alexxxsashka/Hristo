import { create } from 'zustand';

type Language = 'EN' | 'HR';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'EN',
  setLanguage: (lang) => set({ language: lang }),
}));
