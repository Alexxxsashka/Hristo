import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface SaveBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
}

export const SaveBuildModal: React.FC<SaveBuildModalProps> = ({ isOpen, onClose, onSave, defaultName }) => {
  const [name, setName] = useState(defaultName);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-red-600/10"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500">
                  <Save size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{t('save_configuration')}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('store_your_custom_build')}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  {t('build_name')}
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('enter_build_name')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-red-600/50 transition-all font-bold"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                <ShieldCheck size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-[10px] font-medium text-zinc-400 leading-relaxed">
                  {t('config_saved_local_storage')} <span className="text-white font-bold">{t('armory')}</span>.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-[2] py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  {t('save_configuration')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
