import React from 'react';
import { useConfiguratorStore } from '../store/configuratorStore';
import { Product } from '../types';
import { X, CheckCircle2, AlertTriangle, XCircle, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { firebaseService } from '../services/firebaseService';

interface CompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompatibilityModal: React.FC<CompatibilityModalProps> = ({ isOpen, onClose }) => {
  const { activeProduct, checkCompatibility } = useConfiguratorStore();
  const [allModules, setAllModules] = React.useState<Product[]>([]);
  const { t } = useTranslation();

  React.useEffect(() => {
    if (isOpen) {
      firebaseService.getProducts()
        .then(data => {
          if (data) {
            setAllModules(data.filter((p: Product) => p.type === 'module'));
          }
        });
    }
  }, [isOpen]);

  if (!activeProduct) return null;

  const slots = activeProduct.slots || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">{t('compatibility_report')}</h2>
                <p className="text-zinc-500 text-sm font-mono mt-1 uppercase tracking-widest">{t('platform')}: {activeProduct.name}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
              {/* Slots Status */}
              <section>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Box size={14} className="text-red-600" />
                  {t('available_slots')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {slots.map(slot => (
                    <div key={slot} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-300 capitalize">{slot.replace(/([A-Z])/g, ' $1')}</span>
                      <CheckCircle2 size={16} className="text-red-600" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Parts Compatibility */}
              <section>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">{t('parts_analysis')}</h3>
                <div className="space-y-2">
                  {allModules.map(part => {
                    const status = checkCompatibility(part);
                    return (
                      <div key={part.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            status.compatible ? 'bg-red-600/10 text-red-600' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {status.compatible ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{part.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{part.category} • {part.attachmentSlot}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${
                            status.compatible ? 'text-red-600' : 'text-red-500'
                          }`}>
                            {status.compatible ? t('compatible') : status.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="p-8 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all"
              >
                {t('close_report')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
