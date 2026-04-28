import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompareStore } from '../store/compareStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useToastStore } from '../store/toastStore';
import { useTranslation } from '../hooks/useTranslation';
import { 
  ArrowLeft, 
  Trash2, 
  Box, 
  Check, 
  X, 
  ShoppingCart, 
  Heart, 
  Eye, 
  Settings, 
  ChevronRight,
  Split,
  Scale,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { getDiscountedPrice } from '../utils/price';

export const ComparePage: React.FC = () => {
  const { compareProducts, removeProduct, clearCompare } = useCompareStore();
  const { addItem } = useCartStore();
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore();
  const { addToast } = useToastStore();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);

  // Group attributes for cleaner organization
  const attributeGroups = [
    {
      id: 'general',
      label: t('general_info'),
      items: [
        { key: 'brand', label: t('brand') },
        { key: 'category', label: t('category') },
        { key: 'type', label: t('product_type') },
        { key: 'price', label: t('price'), format: (val: number, p: any) => `€${getDiscountedPrice(val, p.discount).toFixed(2)}` },
      ]
    },
    {
      id: 'specs',
      label: t('specifications'),
      items: [
        { key: 'weight', label: t('weight'), format: (_: any, p: any) => p.attributes?.weight || "N/A" },
        { key: 'length', label: t('length'), format: (_: any, p: any) => p.attributes?.length || "N/A" },
        { key: 'material', label: t('material'), format: (_: any, p: any) => p.attributes?.material || "N/A" },
        { key: 'color', label: t('color'), format: (_: any, p: any) => p.attributes?.color || "N/A" },
      ]
    },
    {
      id: 'compatibility',
      label: t('compatibility'),
      items: [
        { key: 'mountType', label: t('mount_type'), format: (_: any, p: any) => p.mountType || "N/A" },
        { key: 'slots', label: t('compatibility_slots'), format: (val: string[]) => val?.join(", ") || "N/A" },
        { key: 'has3D', label: t('3d_ready'), format: (val: boolean) => val ? <Check className="text-emerald-500 mx-auto" size={18} /> : <X className="text-red-500 mx-auto" size={18} /> },
      ]
    }
  ];

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      addToast(t('out_of_stock'), 'error');
      return;
    }
    addItem(product);
    addToast(t('added_to_cart'), 'success');
  };

  const isDifferent = (key: string) => {
    if (compareProducts.length <= 1) return true;
    const firstVal = (compareProducts[0].attributes as any)?.[key] || (compareProducts[0] as any)[key];
    return compareProducts.some(p => {
      const val = (p.attributes as any)?.[key] || (p as any)[key];
      return JSON.stringify(val) !== JSON.stringify(firstVal);
    });
  };

  if (compareProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <SEO 
          title={t('product_comparison')} 
          description="Compare your favorite airsoft guns and gear side by side." 
        />
        <div className="text-center max-w-lg">
          <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-zinc-800 shadow-2xl">
            <Scale className="w-12 h-12 text-zinc-700" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">{t('no_products_compare')}</h1>
          <p className="text-zinc-500 mb-10 text-lg leading-relaxed">{t('compare_desc')}</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-900/20 active:scale-95"
          >
            <ArrowLeft size={20} />
            {t('back_to_catalog')}
          </Link>
        </div>
      </div>
    );
  }

  const productNames = compareProducts.map(p => p.name).join(', ');
  const seoTitle = `${t('compare')} ${compareProducts.length} ${t('products')} | Hristo Airsoft`;
  const seoDesc = `Detailed comparison of ${productNames}. Technical specs, pricing, and compatibility information for professional airsoft equipment.`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 pb-24">
      <SEO 
        title={seoTitle}
        description={seoDesc}
        ogType="website"
        keywords={`compare airsoft, ${productNames}, tactical gear comparison`}
      />

      {/* Header Section */}
      <div className="bg-zinc-950/50 backdrop-blur-3xl border-b border-zinc-800/50 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <Breadcrumbs />
              <div className="flex items-center gap-4 mt-2">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                  <Scale className="text-white" size={20} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">
                  {t('product_comparison')}
                  <span className="ml-3 text-zinc-600 text-lg font-bold">{compareProducts.length} / 4</span>
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowDifferencesOnly(!showDifferencesOnly)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  showDifferencesOnly 
                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <Split size={14} />
                {showDifferencesOnly ? 'Showing Differences' : 'Show Differences Only'}
              </button>

              <button 
                onClick={clearCompare}
                className="flex items-center gap-2 px-5 py-3 bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-600/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all group"
              >
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                {t('clear_all')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 mt-12">
        <div className="relative bg-zinc-900/20 border border-zinc-800/50 rounded-[40px] overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="sticky left-0 z-20 p-8 text-left bg-zinc-950/90 backdrop-blur-md border-r border-zinc-800 min-w-[280px]">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">Comparison Engine</div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter">Technical Matrix</h2>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">v2.0 Stable Build</p>
                    </div>
                  </th>
                  
                  {compareProducts.map(product => (
                    <th key={product.id} className="p-8 border-r border-zinc-800/50 min-w-[320px] relative group bg-zinc-950/20">
                      <button 
                        onClick={() => removeProduct(product.id)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-zinc-900 text-zinc-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-zinc-800 hover:border-red-500 z-10"
                        title="Remove from comparison"
                      >
                        <X size={16} />
                      </button>

                      <div className="relative mb-6">
                        <div className="aspect-[4/3] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 group-hover:border-red-600/50 transition-all duration-500">
                          <img 
                            src={product.images?.[0] || product.image || `https://picsum.photos/seed/${product.id}/600/450`} 
                            alt={product.name}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="absolute -bottom-3 left-4 right-4 flex justify-center gap-2">
                          <button 
                            onClick={() => toggleWishlist(product)}
                            className={`p-3 rounded-xl border backdrop-blur-xl transition-all ${
                              isInWishlist(product.id) 
                                ? 'bg-red-600 border-red-500 text-white' 
                                : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Heart size={14} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                          </button>
                          <button 
                            onClick={() => handleAddToCart(product)}
                            className="p-3 bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-600/50 rounded-xl backdrop-blur-xl transition-all"
                          >
                            <ShoppingCart size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="text-center space-y-2 mt-6">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{product.brand}</div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter line-clamp-1 group-hover:text-red-500 transition-colors">
                          {language === 'HR' && product.nameHr ? product.nameHr : product.name}
                        </h3>
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-xl font-mono font-black text-white">
                            €{getDiscountedPrice(product.price, product.discount).toLocaleString()}
                          </span>
                          {product.discount > 0 && (
                            <span className="text-xs text-zinc-600 line-through font-bold">
                              €{product.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 flex gap-2">
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Zap size={14} />
                          {t('buy_now')}
                        </button>
                        <button 
                          onClick={() => navigate(`/product/${product.id}/${product.slug}`)}
                          className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-all"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </th>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: Math.max(0, 4 - compareProducts.length) }).map((_, i) => (
                    <th key={`empty-h-${i}`} className="p-8 border-r border-zinc-800/20 bg-zinc-950/5">
                      <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-zinc-700 flex items-center justify-center mb-4">
                          <Box size={32} />
                        </div>
                        <p className="text-sm font-black uppercase tracking-[0.2em]">{t('empty_slot')}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {attributeGroups.map(group => (
                  <React.Fragment key={group.id}>
                    {/* Group Header */}
                    <tr className="bg-zinc-950/40">
                      <td colSpan={5} className="px-8 py-4 border-b border-zinc-800/50">
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em]">
                          {group.label}
                        </span>
                      </td>
                    </tr>

                    {group.items.map(attr => {
                      const different = isDifferent(attr.key);
                      if (showDifferencesOnly && !different) return null;

                      return (
                        <motion.tr 
                          key={attr.key}
                          layout
                          className="border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="sticky left-0 z-20 px-8 py-6 bg-zinc-950/90 backdrop-blur-md border-r border-zinc-800 font-bold text-zinc-400 text-[11px] uppercase tracking-[0.15em]">
                            <div className="flex items-center gap-3">
                              {different && <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />}
                              {attr.label}
                            </div>
                          </td>

                          {compareProducts.map(product => {
                            const value = (product.attributes as any)?.[attr.key] || (product as any)[attr.key];
                            return (
                              <td 
                                key={`${product.id}-${attr.key}`} 
                                className={`px-8 py-6 border-r border-zinc-800/20 text-center font-mono text-sm ${
                                  different ? 'text-zinc-100 font-bold' : 'text-zinc-600'
                                }`}
                              >
                                {attr.format ? attr.format(value, product) : value || "—"}
                              </td>
                            );
                          })}

                          {Array.from({ length: Math.max(0, 4 - compareProducts.length) }).map((_, i) => (
                            <td key={`empty-c-${i}-${attr.key}`} className="px-8 py-6 border-r border-zinc-800/5 opacity-5">
                              —
                            </td>
                          ))}
                        </motion.tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>

              {/* Bottom Actions Footer */}
              <tfoot>
                <tr className="border-t border-zinc-800">
                  <td className="sticky left-0 z-20 p-8 bg-zinc-950/90 backdrop-blur-md border-r border-zinc-800" />
                  {compareProducts.map(product => (
                    <td key={`footer-${product.id}`} className="p-8 border-r border-zinc-800/50 bg-zinc-950/10">
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="w-full py-4 bg-zinc-100 hover:bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl active:scale-95"
                        >
                          {t('add_to_cart')}
                        </button>
                        {product.has3D && (
                          <button 
                            onClick={() => {
                              // Handle 3D logic
                              navigate('/configurator');
                            }}
                            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-xl border border-zinc-800 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                          >
                            <Settings size={14} />
                            3D {t('configurator')}
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - compareProducts.length) }).map((_, i) => (
                    <td key={`footer-empty-${i}`} className="p-8 border-r border-zinc-800/20 bg-zinc-950/5" />
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Informational Section for SEO */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-zinc-900 pt-16">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 border border-red-600/20">
              <Scale size={24} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Precision Comparison</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              Our Technical Matrix provides a side-by-side breakdown of internal components, materials, and performance benchmarks. Analyze the build quality and specifications of professional-grade airsoft equipment before you commit.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-600/20">
              <Settings size={24} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Compatibility Check</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              Instantly verify if your preferred attachments, rail systems, and internal upgrades are compatible across different models. Our comparison engine checks mounting types and slot configurations in real-time.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-600/20">
              <Check size={24} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Expert Recommendations</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              We highlight the best value-for-money options and unique features of each product. Use our data-driven approach to select the equipment that matches your specific playstyle and tactical requirements.
            </p>
          </div>
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="fixed top-1/4 -right-64 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="fixed bottom-1/4 -left-64 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full -z-10 animate-pulse" />
    </div>
  );
};
