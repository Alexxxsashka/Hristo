import React from 'react';
import { Link } from 'react-router-dom';
import { useCompareStore } from '../store/compareStore';
import { ArrowLeft, Trash2, Box, Check, X, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const ComparePage: React.FC = () => {
  const { compareProducts, removeProduct, clearCompare } = useCompareStore();
  const { t } = useTranslation();

  const attributes = [
    { key: 'type', label: t('product_type') },
    { key: 'price', label: t('base_price'), format: (val: number) => `€${val}` },
    { key: 'weight', label: t('weight'), format: (_: any, p: any) => p.attributes?.weight || "N/A" },
    { key: 'length', label: t('length'), format: (_: any, p: any) => p.attributes?.length || "N/A" },
    { key: 'slots', label: t('compatibility_slots'), format: (val: string[]) => val?.join(", ") || "N/A" },
  ];

  if (compareProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-center items-center justify-center p-8">
        <div className="absolute top-8 right-8">
          <LanguageSwitcher />
        </div>
        <div className="text-center">
          <Box className="w-20 h-20 text-zinc-800 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{t('no_products_compare')}</h1>
          <p className="text-zinc-500 mb-8 max-w-md">{t('compare_desc')}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest transition-all">
            <ArrowLeft size={20} />
            {t('back_to_catalog')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 pb-24">
      <nav className="p-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            {t('catalog')}
          </Link>
          <div className="h-6 w-px bg-zinc-800" />
          <h1 className="text-xl font-black uppercase tracking-tighter">{t('product_comparison')}</h1>
        </div>
        
        <div className="flex items-center gap-8">
          <LanguageSwitcher />
          <button 
            onClick={clearCompare}
            className="flex items-center gap-2 text-zinc-500 hover:text-red-400 transition-colors text-sm font-bold uppercase tracking-widest"
          >
            <Trash2 size={18} />
            {t('clear_all')}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 mt-12">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-6 text-left bg-zinc-900/30 border border-zinc-800 w-64">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('attributes')}</span>
                </th>
                {compareProducts.map(product => (
                  <th key={product.id} className="p-6 text-center bg-zinc-900/30 border border-zinc-800 min-w-[280px]">
                    <div className="relative group">
                      <button 
                        onClick={() => removeProduct(product.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 text-zinc-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                      >
                        <X size={14} />
                      </button>
                      <div className="aspect-video bg-zinc-800 rounded-lg mb-4 flex items-center justify-center">
                        <Box className="w-12 h-12 text-zinc-700" />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tighter mb-1">{product.name}</h3>
                      <Link to="/configurator" className="text-red-500 text-xs font-bold uppercase tracking-widest hover:underline">
                        {t('configure_now')}
                      </Link>
                    </div>
                  </th>
                ))}
                {/* Fill empty slots up to 4 */}
                {Array.from({ length: Math.max(0, 4 - compareProducts.length) }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-6 border border-zinc-800/50 min-w-[280px]">
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center mb-4">
                        <Box size={20} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest">{t('empty_slot')}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, idx) => (
                <tr key={attr.key} className={idx % 2 === 0 ? 'bg-zinc-900/10' : ''}>
                  <td className="p-6 border border-zinc-800 font-bold text-zinc-400 text-sm uppercase tracking-wider">
                    {attr.label}
                  </td>
                  {compareProducts.map(product => {
                    const value = (product.attributes as any)?.[attr.key] || (product as any)[attr.key];
                    return (
                      <td key={`${product.id}-${attr.key}`} className="p-6 border border-zinc-800 text-center font-mono text-sm">
                        {attr.format ? attr.format(value, product) : value || "—"}
                      </td>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 4 - compareProducts.length) }).map((_, i) => (
                    <td key={`empty-cell-${i}-${attr.key}`} className="p-6 border border-zinc-800/50 opacity-10">
                      —
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};
