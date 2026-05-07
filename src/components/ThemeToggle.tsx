import React from 'react';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="h-9 px-1 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white transition-all group relative flex items-center gap-1 min-w-[60px]"
      aria-label="Toggle theme"
    >
      <div className="flex-1 flex justify-center z-10">
        <Moon size={14} className={`${theme === 'dark' ? 'text-blue-400' : 'text-zinc-500'} transition-colors`} />
      </div>
      <div className="flex-1 flex justify-center z-10">
        <Sun size={14} className={`${theme === 'light' ? 'text-amber-400' : 'text-zinc-500'} transition-colors`} />
      </div>
      
      <motion.div
        animate={{ x: theme === 'dark' ? 0 : 26 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute left-1 w-7 h-7 bg-white/10 rounded-full border border-white/10"
      />
    </button>
  );
};
