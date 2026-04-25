import React, { useEffect, lazy, Suspense } from 'react';
import { useShopStore } from '../store/shopStore';
const CategorySidebar = lazy(() => import('../components/CategorySidebar').then(m => ({ default: m.CategorySidebar })));
import { ProductCard } from '../components/ProductCard';
import { Search, SlidersHorizontal, Grid, List, ChevronDown, Clock, Truck, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';

import { useTranslation } from '../hooks/useTranslation';
import { SEO } from '../components/SEO';

export const ShopPage: React.FC = () => {
  const { t } = useTranslation();
  const { category, subcategory } = useParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const { 
    fetchProducts, 
    fetchCategories, 
    getFilteredProducts, 
    filters, 
    setFilters,
    isLoading,
    categories,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage
  } = useShopStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    if (categories.length === 0) return;

    let targetCategoryIds: string[] = [];
    let targetSubcategoryIds: string[] = [];

    if (category) {
      const cat = categories.find(c => c.slug === category || c.id === category);
      if (cat) {
        targetCategoryIds.push(cat.id);
        // Also include all subcategories of this category
        const subCats = categories.filter(c => c.parent === cat.id);
        targetCategoryIds.push(...subCats.map(c => c.id));
      }
    }

    if (subcategory) {
      const sub = categories.find(c => c.slug === subcategory || c.id === subcategory);
      if (sub) targetSubcategoryIds.push(sub.id);
    }

    setFilters({ 
      categories: targetCategoryIds,
      subcategories: targetSubcategoryIds
    });
  }, [category, subcategory, categories, setFilters]);

  const activeSubcategoryId = filters.subcategories[0];
  const activeCategoryId = filters.categories[0];
  
  const activeCategory = categories.find(c => c.id === activeSubcategoryId) || 
                         categories.find(c => c.id === activeCategoryId);

  const filteredProducts = getFilteredProducts();

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getGridColsClass = () => {
    if (viewMode === 'list') return "flex flex-col gap-4 md:gap-6";
    return "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 md:pt-32 pb-24">
      <SEO 
        title={activeCategory ? `${activeCategory.name} | Hristo` : t('shop_title')}
        description={activeCategory ? `Browse our ${activeCategory.name} collection. ${activeCategory.name} high-quality products.` : "Browse our extensive collection of airsoft weapons, attachments, and tactical gear."}
      />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Category Banner */}
        {activeCategory && activeCategory.image && (
          <div className="relative h-32 sm:h-48 md:h-64 rounded-2xl sm:rounded-[32px] md:rounded-[40px] overflow-hidden mb-6 md:mb-12 border border-zinc-800">
            <img 
              src={activeCategory.image} 
              className="w-full h-full object-cover opacity-40"
              alt={activeCategory.name}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 md:bottom-12 md:left-12">
              <span className="text-red-600 text-[8px] sm:text-[10px] font-black tracking-[0.3em] uppercase mb-1 sm:mb-4 block">{t('category_label')}</span>
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">{activeCategory.name}</h1>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black tracking-widest text-zinc-600 uppercase mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-white transition-colors">SHOP</Link>
          {category && (
            <>
              <span>/</span>
              <span className="text-red-600">{category}</span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center gap-3 w-full py-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black tracking-widest uppercase text-white active:scale-[0.98] transition-all"
          >
            <SlidersHorizontal size={16} className="text-red-600" />
            {t('filters_and_categories')}
          </button>

          {/* Sidebar - Mobile Overlay */}
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] lg:hidden"
              >
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileSidebarOpen(false)} />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  className="absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-zinc-950 border-r border-zinc-800 p-6 sm:p-8 overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">{activeCategory ? activeCategory.name : t('filters')}</h3>
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 text-zinc-500 hover:text-white">
                      <SlidersHorizontal size={20} />
                    </button>
                  </div>
                  <Suspense fallback={<div className="h-64 bg-zinc-900/50 rounded-2xl animate-pulse" />}>
                    <CategorySidebar />
                  </Suspense>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <Suspense fallback={<div className="w-72 h-96 bg-zinc-900/50 rounded-2xl animate-pulse" />}>
              <CategorySidebar />
            </Suspense>
          </div>

          {/* Main Content */}
          <main className="flex-1 space-y-4 sm:space-y-8">
            {/* Top Bar */}
            <div className="relative z-10 bg-zinc-900/50 backdrop-blur-xl p-3 sm:p-4 md:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800 flex flex-col xl:flex-row gap-4 sm:gap-6 items-center justify-between">
              <div className="relative w-full xl:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder={t('search_products') || 'Search products...'}
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl text-sm text-zinc-200 focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 w-full xl:w-auto">
                {/* Items Per Page Dropdown */}
                <div className="relative group min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-zinc-400 cursor-pointer hover:border-red-600 transition-all h-full">
                    <span className="text-zinc-600 hidden xs:inline">SHOW:</span>
                    <span className="text-white">{itemsPerPage}</span>
                    <ChevronDown size={14} className="ml-auto text-zinc-600 group-hover:text-red-600 transition-colors" />
                  </div>
                  
                  <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] shadow-2xl">
                    {[10, 20, 30, 40, 50].map((count) => (
                      <button
                        key={count}
                        onClick={() => setItemsPerPage(count)}
                        className={`w-full flex items-center justify-center px-4 py-3 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-zinc-900 ${itemsPerPage === count ? 'text-red-600 bg-red-600/5' : 'text-zinc-500'}`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-zinc-400 cursor-pointer hover:border-red-600 transition-all h-full">
                    <div className="hidden xs:block">
                      {filters.sortBy === 'newest' && <Clock size={14} className="text-red-600" />}
                      {filters.sortBy === 'price_asc' && <Truck size={14} className="text-red-600" />}
                      {filters.sortBy === 'price_desc' && <Truck size={14} className="text-red-600 rotate-180" />}
                      {filters.sortBy === 'popular' && <Heart size={14} className="text-red-600" />}
                    </div>
                    <span className="truncate">
                      {filters.sortBy === 'newest' && t('newest_first')}
                      {filters.sortBy === 'price_asc' && t('price_low_high')}
                      {filters.sortBy === 'price_desc' && t('price_high_low')}
                      {filters.sortBy === 'popular' && t('most_popular')}
                    </span>
                    <ChevronDown size={14} className="ml-auto text-zinc-600 group-hover:text-red-600 transition-colors" />
                  </div>
                  
                  <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] shadow-2xl min-w-[160px] sm:min-w-0">
                    {[
                      { id: 'newest', label: t('newest_first'), icon: Clock },
                      { id: 'price_asc', label: t('price_low_high'), icon: Truck },
                      { id: 'price_desc', label: t('price_high_low'), icon: Truck, rotate: true },
                      { id: 'popular', label: t('most_popular'), icon: Heart },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFilters({ sortBy: option.id as any })}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-zinc-900 ${filters.sortBy === option.id ? 'text-red-600 bg-red-600/5' : 'text-zinc-500'}`}
                      >
                        <option.icon size={14} className={option.rotate ? 'rotate-180' : ''} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 col-span-2 sm:col-auto justify-center sm:justify-start">
                  <div className="flex border border-zinc-800 rounded-xl sm:rounded-2xl p-1 bg-zinc-950 shrink-0">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-lg sm:rounded-xl transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-lg sm:rounded-xl transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.categories.length > 0 || filters.subcategories.length > 0 || filters.search) && (
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {filters.categories.map(cat => (
                  <span key={cat} className="shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600/10 border border-red-600/20 text-red-500 text-[8px] sm:text-[10px] font-black tracking-widest uppercase rounded-lg sm:rounded-xl flex items-center gap-2">
                    {t('category_label')}: {cat}
                    <button onClick={() => setFilters({ categories: [] })} className="hover:text-red-400 transition-colors">×</button>
                  </span>
                ))}
                {filters.subcategories.map(sub => (
                  <span key={sub} className="shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[8px] sm:text-[10px] font-black tracking-widest uppercase rounded-lg sm:rounded-xl flex items-center gap-2">
                    {t('sub_label')}: {sub}
                    <button onClick={() => setFilters({ subcategories: [] })} className="hover:text-white transition-colors">×</button>
                  </span>
                ))}
                {filters.search && (
                  <span key="search-filter" className="shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[8px] sm:text-[10px] font-black tracking-widest uppercase rounded-lg sm:rounded-xl flex items-center gap-2">
                    {t('search_label')}: {filters.search}
                    <button onClick={() => setFilters({ search: '' })} className="hover:text-white transition-colors">×</button>
                  </span>
                )}
              </div>
            )}

            {/* Product Grid/List */}
            {isLoading ? (
              <div className={getGridColsClass()}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={viewMode === 'grid' ? "aspect-[3/4] bg-zinc-900/50 rounded-2xl sm:rounded-3xl animate-pulse border border-zinc-800" : "h-32 sm:h-48 bg-zinc-900/50 rounded-2xl sm:rounded-3xl animate-pulse border border-zinc-800 w-full"} />
                ))}
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className="space-y-8 sm:space-y-12">
                <div className={getGridColsClass()}>
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} viewMode={viewMode} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 sm:gap-4 pt-8 sm:pt-12 border-t border-zinc-800">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-3 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl text-zinc-400 hover:text-white hover:border-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1 sm:gap-2">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl text-[9px] sm:text-[10px] font-black transition-all border ${
                                currentPage === page 
                                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                        if (
                          (page === 2 && currentPage > 3) || 
                          (page === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return <span key={page} className="text-zinc-700 text-[10px] sm:text-xs px-0.5 sm:px-1">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-3 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl text-zinc-400 hover:text-white hover:border-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 sm:py-32 bg-zinc-900/30 rounded-3xl sm:rounded-[40px] border border-zinc-800 border-dashed">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                  <Search className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-700" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mb-2">{t('no_products_found')}</h3>
                <p className="text-zinc-500 text-sm font-medium max-w-xs mx-auto mb-8 px-4">{t('no_products_desc')}</p>
                <button
                  onClick={() => setFilters({ search: '', categories: [], subcategories: [], minPrice: 0, maxPrice: 5000, inStock: false })}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-zinc-800 hover:bg-zinc-700 text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase rounded-xl sm:rounded-2xl transition-all border border-zinc-700"
                >
                  {t('clear_all_filters')}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
