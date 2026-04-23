import { useLanguageStore } from '../store/languageStore';
import en from '../i18n/en.json';
import hr from '../i18n/hr.json';

import { formatLabel } from '../utils/formatText';

const translations: Record<string, any> = {
  EN: en,
  HR: hr,
};

export const useTranslation = () => {
  const { language } = useLanguageStore();
  
  const t = (key: string, params?: Record<string, string | number>) => {
    let translation = translations[language][key] || formatLabel(key);
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return translation;
  };

  return { t, language };
};
