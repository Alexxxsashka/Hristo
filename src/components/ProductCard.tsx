import React, { useState } from 'react';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { useCompareStore } from '../store/compareStore';
import { useConfiguratorStore } from '../store/configuratorStore';
import { ShoppingCart, GitCompare, Settings, Eye, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QuickPreviewModal } from './QuickPreviewModal';
import { getDiscountedPrice } from '../utils/price';
import { useWishlistStore } from '../store/wishlistStore';
import { useTranslation } from '../hooks/useTranslation';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const { addItem } = useCartStore();
  const { toggleCompare, isInCompare } = useCompareStore();
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore();
  const { setActiveProduct } = useConfiguratorStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { language, t } = useTranslation();
  const navigate = useNavigate();

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const variantAttributes = (product as any).variantAttributes || (product as any).variant_attributes || [];
  const variants = product.variants || [];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if all attributes are selected
    if (variantAttributes.length > 0) {
      const isComplete = variantAttributes.every((attr: any) => selectedAttributes[attr.name]);
      if (!isComplete) {
        // Find first missing attribute
        const missing = variantAttributes.find((attr: any) => !selectedAttributes[attr.name]);
        alert(`Please select ${missing.name}`);
        return;
      }
    }

    addItem(product, selectedVariant || undefined);
  };

  const handleAttributeSelect = (name: string, value: string) => {
    const newAttrs = { ...selectedAttributes, [name]: value };
    setSelectedAttributes(newAttrs);

    // Find matching variant
    if (variants.length > 0) {
      const variant = variants.find((v: any) => 
        Object.entries(newAttrs).every(([key, val]) => v.attributes[key] === val)
      );
      setSelectedVariant(variant || null);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleCompare(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveProduct(product);
    navigate('/configurator');
  };

  const handleQuickPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPreviewOpen(true);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-600/50 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500 ${
          viewMode === 'list' ? 'flex flex-col md:flex-row w-full' : ''
        }`}
      >
        <Link 
          to={`/product/${product.id}/${product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} 
          className={`block ${viewMode === 'list' ? 'flex flex-col md:flex-row w-full' : ''}`}
        >
          <div className={`relative overflow-hidden bg-zinc-950 ${
            viewMode === 'list' ? 'w-full md:w-64 aspect-square md:aspect-auto' : 'aspect-square'
          }`}>
            <img
              src={product.images && product.images.length > 0 ? product.images[0] : (product.image?.startsWith('http') ? product.image : (product.image || `https://picsum.photos/seed/${product.id}/600/600`))}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://picsum.photos/seed/${product.id}/600/600`;
                target.onerror = null; // Prevent infinite loop
              }}
            />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <span className="px-3 py-1 bg-zinc-900/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-zinc-100 rounded-lg border border-zinc-700">
                {product.brand}
              </span>
              {product.stock <= 0 ? (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-zinc-700">
                  Out of Stock
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-600/20">
                  New Arrival
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              className={`absolute top-4 right-4 p-2 rounded-xl backdrop-blur-md border transition-all z-10 ${
                isInWishlist(product.id)
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20'
                  : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
              }`}
            >
              <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
            </button>

            {/* Quick Preview Button */}
            <button
              onClick={handleQuickPreview}
              className="absolute bottom-4 left-4 right-4 py-3 bg-zinc-900/90 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 shadow-2xl border border-zinc-800 flex items-center justify-center gap-2 hover:bg-red-600 hover:border-red-500"
            >
              <Eye size={14} />
              Quick View
            </button>
          </div>

          <div className={`p-3 sm:p-4 md:p-6 flex-1 flex flex-col justify-between ${viewMode === 'list' ? 'space-y-3 sm:space-y-4 md:space-y-6' : 'space-y-2 md:space-y-4'}`}>
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[7px] xs:text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] truncate">
                  {product.category}
                </span>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`${viewMode === 'list' ? 'text-base sm:text-lg md:text-2xl' : 'text-xs sm:text-base md:text-xl'} font-black text-white tracking-tighter`}>
                    €{getDiscountedPrice(product.price, product.discount).toFixed(2)}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-[7px] xs:text-[8px] sm:text-[10px] text-zinc-600 line-through font-bold">
                      €{product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`${viewMode === 'list' ? 'text-sm sm:text-base md:text-xl' : 'text-[9px] xs:text-[10px] sm:text-xs md:text-sm'} font-bold text-zinc-100 group-hover:text-red-500 transition-colors line-clamp-2 leading-snug uppercase tracking-tight`}>
                {language === 'HR' && product.nameHr ? product.nameHr : product.name}
              </h3>
              {viewMode === 'list' && (product.description || product.longDescription) && (
                <div className="space-y-2 mt-1 md:mt-2">
                  {product.description && (
                    <p className="text-[10px] sm:text-xs md:text-sm text-zinc-500 line-clamp-2 font-medium">
                      {language === 'HR' && product.descriptionHr ? product.descriptionHr : product.description}
                    </p>
                  )}
                  {product.longDescription && (
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-zinc-600 line-clamp-3 font-medium italic border-l-2 border-zinc-800 pl-3">
                      {product.longDescription}
                    </p>
                  )}
                </div>
              )}
              {variantAttributes.length > 0 && (
                <div className="space-y-3 py-3 border-t border-zinc-800/50 mt-2">
                  {variantAttributes.map((attr: any) => (
                    <div key={attr.name} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{attr.name}</span>
                        {selectedAttributes[attr.name] && (
                          <span className="text-[9px] font-bold text-red-500 uppercase">{selectedAttributes[attr.name]}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {attr.options?.map((opt: string) => {
                          const isSelected = selectedAttributes[attr.name] === opt;
                          
                          return (
                            <button
                              key={opt}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAttributeSelect(attr.name, opt);
                              }}
                              className={`h-7 min-w-[28px] px-2 rounded-lg text-[9px] font-black uppercase transition-all border flex items-center justify-center ${
                                isSelected
                                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20 scale-105'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/50 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  product.stock <= 0 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 active:scale-[0.98]'
                }`}
              >
                <ShoppingCart size={14} />
                {t('add_to_cart')}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCompare}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isInCompare(product.id)
                      ? 'bg-zinc-100 border-white text-black'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                  }`}
                  title={t('compare')}
                >
                  <GitCompare size={16} />
                </button>
                
                {(product.has3D) && (
                  <button
                    onClick={handleConfigure}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:border-red-600/50 hover:text-red-500 transition-all"
                    title={t('configure')}
                  >
                    <Settings size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      <QuickPreviewModal 
        product={product} 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
      />
    </>
  );
};
