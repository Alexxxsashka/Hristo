import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MousePointer2, Move, RotateCw, ZoomIn, Info } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  const controls = [
    { icon: <RotateCw size={20} />, title: t('rotate'), description: t('rotate_description') },
    { icon: <Move size={20} />, title: t('pan'), description: t('pan_description') },
    { icon: <ZoomIn size={20} />, title: t('zoom'), description: t('zoom_description') },
    { icon: <MousePointer2 size={20} />, title: t('select_part'), description: t('select_part_description') },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center text-red-500">
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('how_to_use')}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('configurator_controls')}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 gap-6">
              {controls.map((control, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-red-500 group-hover:border-red-600/30 transition-all">
                    {control.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{control.title}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">{control.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 text-center">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                {t('system_v_2_5_stable')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
