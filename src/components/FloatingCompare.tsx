import React from 'react';
import { Link } from 'react-router-dom';
import { useCompareStore } from '../store/compareStore';
import { BarChart2, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

export const FloatingCompare: React.FC = () => {
  const { compareProducts, removeProduct, clearCompare } = useCompareStore();
  const { t } = useTranslation();
  const count = compareProducts.length;

  return (
    <AnimatePresence>
      {count >= 1 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 flex items-center gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
                <BarChart2 size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('comparison')}</p>
                <p className="text-sm font-black text-white">{t('products_selected', { count })}</p>
              </div>
            </div>

            <div className="flex -space-x-2">
              {compareProducts.map(product => (
                <div key={product.id} className="relative group">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    {product.name.substring(0, 2)}
                  </div>
                  <button 
                    onClick={() => removeProduct(product.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={clearCompare}
                className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest px-2"
              >
                {t('clear')}
              </button>
              {count >= 2 ? (
                <Link 
                  to="/compare"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm transition-all bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                >
                  {t('compare')}
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm bg-zinc-800 text-zinc-500 cursor-not-allowed">
                  {t('compare')}
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
