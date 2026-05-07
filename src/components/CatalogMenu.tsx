import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LayoutGrid, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '../types';
import { databaseService } from '../services/databaseService';
import { useTranslation } from '../hooks/useTranslation';

interface CatalogMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogMenu: React.FC<CatalogMenuProps> = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      databaseService.getCategories()
        .then(data => {
          if (data) {
            setCategories(data);
            if (data.length > 0) {
              // Only reset activeCategory if it's currently null or no longer exists
              const mainCats = data.filter((c: Category) => !c.parent);
              const currentActive = data.find(c => c.id === activeCategory?.id);
              if (currentActive) {
                setActiveCategory(currentActive);
              } else {
                setActiveCategory(mainCats[0]);
              }
            }
          }
        });
    }
  }, [isOpen]);

  const mainCategories = categories.filter(c => !c.parent);
  const subCategories = categories.filter(c => c.parent === activeCategory?.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] z-[111] shadow-2xl max-h-screen overflow-y-auto"
          >
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:h-[70vh]">
              {/* Sidebar / Main Categories */}
              <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] bg-[var(--bg-tertiary)] overflow-y-auto py-6">
                <div className="px-6 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#ab1017]">
                    <LayoutGrid size={20} />
                    <span className="font-black uppercase tracking-widest text-sm">{t('catalog')}</span>
                  </div>
                  <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide">
                  {mainCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category)}
                      onMouseEnter={() => window.innerWidth >= 1024 && setActiveCategory(category)}
                      className={`shrink-0 lg:w-full flex items-center justify-between px-6 py-3 text-xs lg:text-sm font-bold uppercase tracking-wider transition-all border-r lg:border-r-0 border-[var(--border-color)] last:border-r-0 ${
                        activeCategory?.id === category.id
                          ? 'bg-[#ab1017] text-white'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {language === 'HR' && category.nameHr ? category.nameHr : category.name}
                      <ChevronRight size={16} className={`hidden lg:block ${activeCategory?.id === category.id ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Content / Subcategories */}
              <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-[var(--bg-secondary)]">
                {activeCategory && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="lg:col-span-2">
                      <h3 className="text-xl lg:text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-6 lg:mb-8 flex items-center gap-3">
                        {language === 'HR' && activeCategory.nameHr ? activeCategory.nameHr : activeCategory.name}
                        <Link 
                          to={`/shop/${activeCategory.slug}`} 
                          onClick={onClose}
                          className="text-[10px] font-bold text-[#ab1017] hover:underline tracking-widest uppercase"
                        >
                          {t('view_all')}
                        </Link>
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 lg:gap-y-8">
                        {subCategories.length > 0 ? (
                          subCategories.map(sub => (
                            <div key={sub.id} className="space-y-4">
                              <Link
                                to={`/shop/${activeCategory.slug}/${sub.slug}`}
                                onClick={onClose}
                                className="block text-base lg:text-lg font-bold text-[var(--text-primary)] hover:text-[#ab1017] transition-all uppercase tracking-tight"
                              >
                                {language === 'HR' && sub.nameHr ? sub.nameHr : sub.name}
                              </Link>
                            </div>
                          ))
                        ) : (
                          <p className="text-[var(--text-secondary)] font-mono text-xs lg:text-sm uppercase tracking-widest">
                            {t('no_subcategories_found')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Featured/Image */}
                    <div className="relative group overflow-hidden rounded-2xl border border-[var(--border-color)] aspect-video lg:aspect-auto">
                      <img
                        src={activeCategory.image?.startsWith('http') ? activeCategory.image : (activeCategory.image || '')}
                        alt={activeCategory.name}
                        className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute bottom-6 left-6 lg:bottom-8 lg:left-8">
                        <p className="text-[8px] lg:text-[10px] font-black text-[#ab1017] uppercase tracking-[0.3em] mb-1 lg:mb-2">{t('featured_category')}</p>
                        <h4 className="text-xl lg:text-3xl font-black text-white uppercase tracking-tighter">{language === 'HR' && activeCategory.nameHr ? activeCategory.nameHr : activeCategory.name}</h4>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
