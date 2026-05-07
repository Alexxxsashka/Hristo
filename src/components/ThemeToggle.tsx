import React from 'react';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all group relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ y: theme === 'dark' ? 0 : 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col items-center gap-10"
      >
        <Moon size={18} className="group-hover:text-blue-400 transition-colors" />
        <Sun size={18} className="group-hover:text-amber-400 transition-colors" />
      </motion.div>
      
      {/* Visual Indicator of theme change */}
      {theme === 'light' && (
        <motion.div
          layoutId="theme-active"
          className="absolute inset-0 bg-white/5 pointer-events-none"
        />
      )}
    </button>
  );
};
