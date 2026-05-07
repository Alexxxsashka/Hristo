import React from 'react';
import { useConfiguratorStore } from '../store/configuratorStore';
import { useCartStore } from '../store/cartStore';
import { ShoppingCart, RotateCcw, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { SaveBuildModal } from './SaveBuildModal';
import { databaseService } from '../services/databaseService';

export const PricePanel: React.FC = () => {
  const { totalPrice, resetConfiguration, selectedParts, activeProduct, saveBuild } = useConfiguratorStore();
  const { addToCart } = useCartStore();
  const { t } = useTranslation();
  const [added, setAdded] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false);

  const partsCount = Object.values(selectedParts).filter(Boolean).length;

  const handleSave = (name: string) => {
    saveBuild(name);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  const handleAddToCart = () => {
    if (!activeProduct) return;

    // 1. Add the base weapon as a separate item
    addToCart({
      productId: activeProduct.id,
      productName: activeProduct.name,
      price: activeProduct.price,
      quantity: 1,
      image: activeProduct.image,
      sku: activeProduct.sku,
      landingCost: activeProduct.landingCost,
      selectedParts: [], // No parts on the base weapon itself anymore
      totalPrice: activeProduct.price
    });

    // 2. Add each attachment separately
    Object.values(selectedParts)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .forEach(part => {
        addToCart({
          productId: part.id,
          productName: part.name,
          price: part.price,
          quantity: 1,
          image: part.image,
          sku: part.sku,
          landingCost: part.landingCost,
          selectedParts: [],
          totalPrice: part.price
        });
      });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="h-auto md:h-24 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] px-4 sm:px-8 py-4 md:py-0 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-300">
      <div className="flex items-center justify-between w-full md:w-auto md:gap-12">
        <div>
          <p className="text-[var(--text-secondary)] text-[8px] md:text-[10px] uppercase font-bold tracking-widest mb-1">{t('total_configuration_price')}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-[var(--text-primary)] font-mono">€{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-red-500 text-[10px] md:text-xs font-bold uppercase">EUR</span>
          </div>
        </div>
        
        <div className="hidden md:block h-10 w-px bg-[var(--border-color)]" />
        
        <div className="text-right md:text-left">
          <p className="text-[var(--text-secondary)] text-[8px] md:text-[10px] uppercase font-bold tracking-widest mb-1">{t('active_attachments')}</p>
          <p className="text-lg md:text-xl font-bold text-[var(--text-primary)]">{partsCount}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:flex md:items-center gap-2 sm:gap-4 w-full md:w-auto">
        <button 
          onClick={() => setIsSaveModalOpen(true)}
          className={`col-span-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 ${isSaving ? 'text-emerald-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'} transition-colors text-[10px] md:text-sm font-bold uppercase tracking-wider bg-[var(--bg-tertiary)] md:bg-transparent rounded-xl md:rounded-none`}
        >
          {isSaving ? <Check size={18} /> : <Save size={18} />}
          {isSaving ? t('saved') : t('save')}
        </button>

        <SaveBuildModal 
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSave}
          defaultName={`${activeProduct?.name} Build`}
        />

        <button 
          onClick={resetConfiguration}
          className="col-span-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-[10px] md:text-sm font-bold uppercase tracking-wider bg-[var(--bg-tertiary)] md:bg-transparent rounded-xl md:rounded-none"
        >
          <RotateCcw size={18} />
          {t('reset')}
        </button>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          disabled={added}
          className={`col-span-2 md:flex-none flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 ${added ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl transition-all shadow-lg shadow-red-900/20 text-[10px] md:text-sm font-black uppercase tracking-widest disabled:cursor-default`}
        >
          <AnimatePresence mode="wait">
            {added ? (
              <motion.div
                key="check"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-3"
              >
                <Check size={20} />
                {t('added_to_cart')}
              </motion.div>
            ) : (
              <motion.div
                key="cart"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-3"
              >
                <ShoppingCart size={20} />
                {t('add_to_cart')}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};
