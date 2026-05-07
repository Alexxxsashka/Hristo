import React, { useState } from 'react';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { useCompareStore } from '../store/compareStore';
import { useConfiguratorStore } from '../store/configuratorStore';
import { ShoppingCart, GitCompare, Settings, Eye, Heart, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QuickPreviewModal } from './QuickPreviewModal';
import { getDiscountedPrice } from '../utils/price';
import { formatLabel } from '../utils/formatText';
import { useWishlistStore } from '../store/wishlistStore';
import { useToastStore } from '../store/toastStore';
import { useTranslation } from '../hooks/useTranslation';
import { NoImage } from './NoImage';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onQuickPreview?: (product: Product) => void;
  onWishlist?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode = 'grid',
  onQuickPreview,
  onWishlist
}) => {
  const { language, t } = useTranslation();
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();
  const { toggleCompare, isInCompare } = useCompareStore();
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore();
  const { setActiveProduct } = useConfiguratorStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
        addToast(`${t('please_select')} ${missing.name}`, 'error');
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
    e.stopPropagation();
    toggleCompare(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlist) {
      onWishlist(product);
    } else {
      toggleWishlist(product);
    }
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveProduct(product);
    navigate('/configurator');
  };

  const handleQuickPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickPreview) {
      onQuickPreview(product);
    } else {
      setIsPreviewOpen(true);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`group relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden hover:border-[#ab1017]/50 hover:shadow-2xl hover:shadow-[#ab1017]/5 transition-all duration-500 hover-lift shadow-sm ${
          viewMode === 'list' ? 'flex flex-col md:flex-row w-full' : ''
        }`}
      >
        <Link 
          to={`/product/${product.id}/${product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} 
          className={`block ${viewMode === 'list' ? 'flex flex-col md:flex-row w-full' : ''}`}
        >
          <div className={`relative overflow-hidden bg-[var(--bg-primary)] ${
            viewMode === 'list' ? 'w-full md:w-64 aspect-square md:aspect-auto' : 'aspect-square'
          }`}>
            {(() => {
              const [imgError, setImgError] = useState(false);
              const mainImage = product.images && product.images.length > 0 
                ? product.images[0] 
                : (product.image?.startsWith('http') ? product.image : product.image);

              if (!mainImage || imgError) {
                return <NoImage className="w-full h-full" />;
              }

              return (
                <img
                  src={mainImage}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
              );
            })()}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <span className="px-3 py-1 bg-[var(--bg-secondary)]/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] rounded-lg border border-[var(--border-color)]">
                {product.brand}
              </span>
              {product.stock <= 0 ? (
                <span className="px-3 py-1 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[var(--border-color)]">
                  Out of Stock
                </span>
              ) : (
                <span className="px-3 py-1 bg-[#ab1017] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-[#ab1017]/20">
                  New Arrival
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              className={`absolute top-4 right-4 p-2 rounded-xl backdrop-blur-md border transition-all z-10 ${
                isInWishlist(product.id)
                  ? 'bg-[#ab1017] border-[#ab1017] text-white shadow-lg shadow-[#ab1017]/20'
                  : 'bg-[var(--bg-secondary)]/80 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#ab1017]/50'
              }`}
            >
              <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
            </button>

            {/* Quick Preview Button */}
            <button
              onClick={handleQuickPreview}
              className="absolute bottom-4 left-4 right-4 py-3 bg-[var(--bg-secondary)]/90 backdrop-blur-xl text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 shadow-2xl border border-[var(--border-color)] flex items-center justify-center gap-2 hover:bg-[#ab1017] hover:text-white hover:border-[#ab1017]"
            >
              <Eye size={14} />
              Quick View
            </button>
          </div>

          <div className={`p-3 sm:p-4 md:p-6 flex-1 flex flex-col justify-between ${viewMode === 'list' ? 'space-y-3 sm:space-y-4 md:space-y-6' : 'space-y-2 md:space-y-4'}`}>
            <div className="space-y-1 md:space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[7px] xs:text-[8px] sm:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] truncate">
                  {product.category}
                </span>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`${viewMode === 'list' ? 'text-base sm:text-lg md:text-2xl' : 'text-xs sm:text-base md:text-xl'} font-black text-[var(--text-primary)] tracking-tighter`}>
                    €{getDiscountedPrice(Number(product.price), product.discount).toFixed(2)}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-[7px] xs:text-[8px] sm:text-[10px] text-[var(--text-secondary)] line-through font-bold">
                      €{Number(product.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`${viewMode === 'list' ? 'text-sm sm:text-base md:text-xl' : 'text-[9px] xs:text-[10px] sm:text-xs md:text-sm'} font-bold text-[var(--text-primary)] group-hover:text-[#ab1017] transition-colors line-clamp-2 leading-snug uppercase tracking-tight`}>
                {language === 'HR' && product.nameHr ? product.nameHr : product.name}
              </h3>
              {viewMode === 'list' && (product.description || product.longDescription) && (
                <div className="space-y-2 mt-1 md:mt-2">
                  {product.description && (
                    <p className="text-[10px] sm:text-xs md:text-sm text-[var(--text-secondary)] line-clamp-2 font-medium">
                      {language === 'HR' && product.descriptionHr ? product.descriptionHr : product.description}
                    </p>
                  )}
                  {product.longDescription && (
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-[var(--text-secondary)] line-clamp-3 font-medium italic border-l-2 border-[var(--border-color)] pl-3">
                      {product.longDescription}
                    </p>
                  )}
                </div>
              )}
              {variantAttributes.length > 0 && (
                <div className="space-y-3 py-3 border-t border-[var(--border-color)] mt-2">
                  {variantAttributes.map((attr: any) => (
                    <div key={attr.name} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{attr.name}</span>
                        {selectedAttributes[attr.name] && (
                          <span className="text-[9px] font-bold text-[#ab1017] uppercase">{selectedAttributes[attr.name]}</span>
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
                                  ? 'bg-[#ab1017] border-[#ab1017] text-white shadow-lg shadow-[#ab1017]/20 scale-105'
                                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[#ab1017]/50 hover:text-[var(--text-primary)]'
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

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 pt-4 border-t border-[var(--border-color)] mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  product.stock <= 0 
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-not-allowed' 
                    : (variantAttributes.length > 0 && !variantAttributes.every((attr: any) => selectedAttributes[attr.name]))
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                      : 'bg-[#ab1017] text-white hover:bg-[#8e0d13] shadow-lg shadow-[#ab1017]/20 active:scale-[0.98]'
                }`}
              >
                <ShoppingCart size={14} />
                {product.stock <= 0 
                  ? t('out_of_stock') 
                  : (() => {
                      const missing = variantAttributes.find((attr: any) => !selectedAttributes[attr.name]);
                      return missing ? t('select_attr', { attr: formatLabel(missing.name) }) : t('add_to_cart');
                    })()
                }
              </button>

              <div className="flex items-center gap-2 justify-center xs:justify-start">
                <button
                  onClick={handleCompare}
                  className={`p-3 xs:p-3.5 rounded-xl border transition-all ${
                    isInCompare(product.id)
                      ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[#ab1017]/50 hover:text-[#ab1017]'
                  }`}
                  title={t('compare')}
                >
                  <GitCompare size={16} />
                </button>
                
                {(product.has3D) && (
                  <button
                    onClick={handleConfigure}
                    className="p-3 xs:p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[#ab1017]/50 hover:text-[#ab1017] transition-all"
                    title={t('configure')}
                  >
                    <Settings size={16} />
                  </button>
                )}
                
                {(Number(product.price) > 0 || (product.variants && product.variants.length > 0)) && (
                  <button 
                    onClick={handleAddToCart}
                    className="p-3 xs:p-3.5 bg-[var(--bg-primary)] hover:bg-[#ab1017] text-[var(--text-secondary)] hover:text-white rounded-xl transition-all border border-[var(--border-color)] hover:border-[#ab1017] shadow-lg active:scale-95"
                    title={t('add_to_cart')}
                  >
                    <Zap className="w-4 h-4" />
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
