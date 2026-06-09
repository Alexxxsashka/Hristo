import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const LoadingScreen: React.FC = () => {
  const { active, progress, item, loaded, total } = useProgress();
  const { t } = useTranslation();
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    if (!active && progress === 100) {
      setHasInitiallyLoaded(true);
    }
  }, [active, progress]);

  return (
    <AnimatePresence>
      {active && !hasInitiallyLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <Loader2 size={64} className="text-red-600 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={24} className="text-red-600 animate-pulse" />
              </div>
            </motion.div>

            <div className="flex flex-col items-center gap-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                {t('loading_assets')}
                <span className="text-red-600 tabular-nums">{Math.round(progress)}%</span>
              </h2>
              <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] max-w-xs text-center truncate">
                {item || t('initializing_system')}
              </p>
            </div>

            <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <motion.div
                className="h-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex items-center gap-4 text-[8px] font-black text-zinc-600 uppercase tracking-widest">
              <span>{loaded} / {total} {t('items_loaded')}</span>
            </div>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">System</span>
            </div>
          </div>
        </motion.div>
      )}
      
      {active && hasInitiallyLoaded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-32 right-4 md:bottom-8 md:right-8 z-[100] bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-3 rounded-2xl shadow-2xl flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={20} className="text-red-600" />
          </motion.div>
          <span className="text-xs font-bold text-white uppercase tracking-widest">{Math.round(progress)}%</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
