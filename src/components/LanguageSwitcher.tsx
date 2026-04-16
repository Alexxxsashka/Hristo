import React, { useState, useRef, useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'EN', label: 'English', flag: '🇬🇧' },
    { code: 'HR', label: 'Hrvatski', flag: '🇭🇷' }
  ] as const;

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2 hover:bg-zinc-800 transition-all group"
      >
        <Globe size={14} className="text-zinc-500 group-hover:text-red-500 transition-colors" />
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-white uppercase">
          <span>{currentLang.flag}</span>
          <span>{currentLang.code}</span>
        </div>
        <ChevronDown 
          size={12} 
          className={`text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-40 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[100] p-1"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  language === lang.code 
                    ? 'bg-red-600 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">{lang.flag}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{lang.label}</span>
                </div>
                {language === lang.code && (
                  <div className="w-1 h-1 rounded-full bg-white" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
