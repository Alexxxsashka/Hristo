import React, { useState } from 'react';
import { useShopStore } from '../store/shopStore';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { formatLabel } from '../utils/formatText';

export const CategorySidebar: React.FC = () => {
  const { t } = useTranslation();
  const { categories, filters, setFilters, products } = useShopStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const parentCategories = categories.filter(c => !c.parent);
  const activeSubcategoryId = filters.subcategories[0];
  const activeCategoryId = filters.categories[0];
  
  const activeCategory = categories.find(c => c.id === activeSubcategoryId) || 
                         categories.find(c => c.id === activeCategoryId);

  // Get products filtered by category to determine available brands and mount types
  const categoryProducts = products.filter(p => {
    if (filters.categories.length > 0) {
      const matchesCat = filters.categories.some(catId => {
        if (p.category === catId) return true;
        if (p.subcategory === catId) return true;
        const pCat = categories.find(c => c.id === p.category);
        const pSub = categories.find(c => c.id === p.subcategory);
        return pCat?.parent === catId || pSub?.parent === catId;
      });
      if (!matchesCat) return false;
    }
    
    if (filters.subcategories.length > 0) {
      const matchesSub = filters.subcategories.some(subId => {
        return p.subcategory === subId || p.category === subId;
      });
      if (!matchesSub) return false;
    }
    return true;
  });

  const availableBrands = Array.from(new Set(categoryProducts.map(p => p.brand))).filter(Boolean).sort();
  const availableMountTypes = Array.from(new Set(categoryProducts.map(p => p.mountType))).filter(Boolean).sort() as string[];

  const handleCategoryClick = (id: string, isParent: boolean) => {
    if (isParent) {
      const current = filters.categories.includes(id);
      setFilters({ 
        categories: current ? [] : [id],
        subcategories: [], // Reset subcategories when parent changes
        categoryFilters: {} // Reset category filters
      });
    } else {
      const current = filters.subcategories.includes(id);
      setFilters({ 
        subcategories: current ? [] : [id],
        categoryFilters: {} // Reset category filters
      });
    }
  };

  const handleCategoryFilterChange = (filterId: string, value: any) => {
    setFilters({
      categoryFilters: {
        ...filters.categoryFilters,
        [filterId]: value
      }
    });
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-10">
      {/* Categories Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <span className="w-6 h-1 bg-red-600" />
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            {t('categories')}
          </h3>
        </div>
        <nav className="space-y-2">
          {parentCategories.map(parent => {
            const subCats = categories.filter(c => c.parent === parent.id);
            const isExpanded = expanded[parent.id];
            const isActive = filters.categories.includes(parent.id);

            return (
              <div key={parent.id} className="space-y-1">
                <button
                  onClick={() => {
                    toggleExpand(parent.id);
                    handleCategoryClick(parent.id, true);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all border ${
                    isActive 
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <span>{parent.name}</span>
                  {subCats.length > 0 && (
                    isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                  )}
                </button>
                
                <AnimatePresence>
                  {isExpanded && subCats.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-4 space-y-1 pt-1"
                    >
                      {subCats.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => handleCategoryClick(sub.id, false)}
                          className={`w-full text-left px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all ${
                            filters.subcategories.includes(sub.id)
                              ? 'text-red-500 bg-red-500/5'
                              : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/50'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Category Specific Filters */}
      {activeCategory?.filters && activeCategory.filters.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-1 bg-red-600" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{activeCategory.name} {t('filters')}</h3>
          </div>
          
          {activeCategory.filters.map(filter => (
            <div key={filter.id} className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">{formatLabel(filter.label)}</label>
              
              {filter.type === 'select' && filter.options && (
                <div className="relative">
                  <select
                    value={filters.categoryFilters[filter.id] || ''}
                    onChange={(e) => handleCategoryFilterChange(filter.id, e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-300 focus:outline-none focus:border-red-600 appearance-none cursor-pointer"
                  >
                    <option value="">{t('all')} {formatLabel(filter.label)}</option>
                    {filter.options.map(opt => (
                      <option key={opt} value={opt}>{formatLabel(opt)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                </div>
              )}

              {filter.type === 'boolean' && (
                <label className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={!!filters.categoryFilters[filter.id]}
                      onChange={(e) => handleCategoryFilterChange(filter.id, e.target.checked)}
                      className="peer appearance-none w-5 h-5 bg-zinc-950 border border-zinc-800 rounded-lg checked:bg-red-600 checked:border-red-500 transition-all"
                    />
                    <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase tracking-widest">
                    {formatLabel(filter.label)}
                  </span>
                </label>
              )}

              {filter.type === 'range' && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.categoryFilters[filter.id] || 0}
                    onChange={(e) => handleCategoryFilterChange(filter.id, Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                    <span>0</span>
                    <span>{filters.categoryFilters[filter.id] || 0}</span>
                    <span>1000</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filters Section */}
      <div className="space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-1 bg-red-600" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{t('filters')}</h3>
          </div>
          
          {/* Price Range */}
          <div className="space-y-6">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('price_range')}</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px]">€</span>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ minPrice: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-300 focus:outline-none focus:border-red-600 transition-colors"
                  placeholder={t('min') || "MIN"}
                />
              </div>
              <span className="text-zinc-800">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px]">€</span>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ maxPrice: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-300 focus:outline-none focus:border-red-600 transition-colors"
                  placeholder={t('max') || "MAX"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Brands Filter */}
        {availableBrands.length > 0 && (
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 block">{t('brands')}</label>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {availableBrands.map(brand => (
                <label key={brand} className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => {
                        const current = filters.brands.includes(brand);
                        setFilters({
                          brands: current 
                            ? filters.brands.filter(b => b !== brand)
                            : [...filters.brands, brand]
                        });
                      }}
                      className="peer appearance-none w-5 h-5 bg-zinc-950 border border-zinc-800 rounded-lg checked:bg-red-600 checked:border-red-500 transition-all"
                    />
                    <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase tracking-widest">
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Mount Types Filter */}
        {availableMountTypes.length > 0 && (
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 block">{t('mount_type')}</label>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {availableMountTypes.map(type => (
                <label key={type} className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={filters.mountTypes.includes(type)}
                      onChange={() => {
                        const current = filters.mountTypes.includes(type);
                        setFilters({
                          mountTypes: current 
                            ? filters.mountTypes.filter(t => t !== type)
                            : [...filters.mountTypes, type]
                        });
                      }}
                      className="peer appearance-none w-5 h-5 bg-zinc-950 border border-zinc-800 rounded-lg checked:bg-red-600 checked:border-red-500 transition-all"
                    />
                    <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase tracking-widest">
                    {t(type.toLowerCase()) || type}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Stock */}
        <label className="flex items-center gap-3 group cursor-pointer">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              id="inStock"
              checked={filters.inStock}
              onChange={(e) => setFilters({ inStock: e.target.checked })}
              className="peer appearance-none w-5 h-5 bg-zinc-950 border border-zinc-800 rounded-lg checked:bg-red-600 checked:border-red-500 transition-all"
            />
            <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] font-black text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase tracking-widest">
            {t('in_stock_only')}
          </span>
        </label>

        <button
          onClick={() => setFilters({ categories: [], subcategories: [], brands: [], mountTypes: [], minPrice: 0, maxPrice: 5000, inStock: false })}
          className="w-full py-4 bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-500 hover:text-white hover:border-zinc-700 transition-all uppercase tracking-widest rounded-2xl"
        >
          {t('reset_filters')}
        </button>
      </div>
    </aside>
  );
};
