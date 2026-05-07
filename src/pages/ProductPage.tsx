import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ModelViewer } from '../components/ModelViewer';
import { Product, ProductVariant } from '../types';
import { ArrowLeft, Settings, Shield, Zap, Target, ShoppingCart, GitCompare, Box, Scale, Ruler, Battery, Wind, Hammer, Lightbulb, Binoculars, Sun, Hand, Circle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CartIcon } from '../components/CartIcon';
import { useCartStore } from '../store/cartStore';
import { useCompareStore } from '../store/compareStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useShopStore } from '../store/shopStore';
import { useAuthStore } from '../store/authStore';
import { getDiscountedPrice } from '../utils/price';
import { databaseService } from '../services/databaseService';
import { formatLabel } from '../utils/formatText';

import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Heart } from 'lucide-react';
import { ProductPageSkeleton } from '../components/Skeleton';
import { NoImage } from '../components/NoImage';

const RedIcon = ({ emoji, size = 24 }: { emoji: string; size?: number }) => {
  const iconMap: Record<string, any> = {
    '⚖️': Scale,
    '📏': Ruler,
    '🎯': Target,
    '🔋': Battery,
    '💨': Wind,
    '🛡️': Shield,
    '⚡': Zap,
    '⚙️': Settings,
    '🛠️': Hammer,
    '🔦': Lightbulb,
    '🔭': Binoculars,
    '☀️': Sun,
    '🧤': Hand,
    '🟢': Circle,
  };

  const IconComponent = iconMap[emoji];

  if (IconComponent) {
    return <IconComponent className="text-red-600" size={size} />;
  }

  return <span style={{ fontSize: size }}>{emoji}</span>;
};

export const ProductPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useTranslation();
  const { addItem } = useCartStore();
  const { toggleCompare, isInCompare } = useCompareStore();
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore();
  const { categories, fetchCategories } = useShopStore();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => 
        Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value)
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedAttributes, product]);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        let data;
        if (id) {
          data = await databaseService.getProduct(id);
        } else if (slug) {
          const products = await databaseService.getProducts();
          data = products?.find((p: any) => p.slug === slug);
        }
        console.log('Fetched product data:', data);
        setProduct(data as Product);
      } catch (err) {
        console.error('Failed to fetch product', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, slug]);

  if (loading) return <ProductPageSkeleton />;
  if (!product) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">{t('product_not_found')}</div>;

  const categoryObj = categories.find(c => c.id === product.category);
  const subcategoryObj = categories.find(c => c.id === product.subcategory);
  const categoryName = categoryObj?.name || product.category;
  const subcategoryName = subcategoryObj?.name || product.subcategory;

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const missingAttribute = product.variantAttributes?.find(attr => !selectedAttributes[attr.name]);
  const isSelectionComplete = !missingAttribute;

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: categoryName, path: `/shop/${categoryObj?.slug || product.category}` },
    { label: product.name, path: `/product/${product.id}/${product.slug}` }
  ];

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image || (product.images && product.images[0]) || undefined,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "EUR",
      "price": getDiscountedPrice(product.price, product.discount),
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col pt-32 transition-colors duration-300">
      <SEO 
        title={language === 'HR' && product.nameHr ? product.nameHr : product.name}
        description={language === 'HR' && product.descriptionHr ? product.descriptionHr : product.description}
        keywords={`${product.name}, ${product.brand}, ${product.category}, airsoft`}
        ogType="product"
        structuredData={structuredData}
      />
      
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black tracking-widest text-[var(--text-secondary)] uppercase mb-8 md:mb-12">
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">{t('home')}</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-white transition-colors">{t('shop')}</Link>
          <span>/</span>
          <Link to={`/shop/${categoryObj?.slug || product.category}`} className="hover:text-white transition-colors">{categoryName}</Link>
          {subcategoryObj && (
            <>
              <span>/</span>
              <Link to={`/shop/${categoryObj?.slug || product.category}/${subcategoryObj?.slug || product.subcategory}`} className="hover:text-[var(--text-primary)] transition-colors">{subcategoryName}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-red-600 truncate max-w-[150px] sm:max-w-none">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 pb-16 md:pb-24">
          {/* Left Column: Visuals */}
          <div className="space-y-6 md:space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-[32px] sm:rounded-[40px] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] relative group shadow-2xl"
            >
              {product.has3D ? (
                <ModelViewer modelPath={product.model3D?.startsWith('http') ? product.model3D : (product.model3D || product.model)} />
              ) : (
                (() => {
                  const [imgError, setImgError] = useState(false);
                  const mainImage = previewImage || (product.images && product.images.length > 0 ? product.images[0] : (product.image?.startsWith('http') ? product.image : product.image));

                  if (!mainImage || imgError) {
                    return <NoImage className="w-full h-full" iconSize={64} />;
                  }

                  return (
                    <img 
                      src={mainImage} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                    />
                  );
                })()
              )}
              <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col gap-2 md:gap-3">
                <span className="px-2.5 py-1 md:px-4 md:py-2 bg-red-600 text-white text-[8px] md:text-[10px] font-black tracking-widest uppercase rounded-lg md:rounded-xl shadow-xl shadow-red-600/20">
                  {t('new_arrival')}
                </span>
                {product.stock < 5 && product.stock > 0 && (
                  <span className="px-2.5 py-1 md:px-4 md:py-2 bg-orange-600 text-white text-[8px] md:text-[10px] font-black tracking-widest uppercase rounded-lg md:rounded-xl shadow-xl shadow-orange-600/20">
                    {t('low_stock')}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Image Gallery */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setPreviewImage(img)}
                    className="aspect-square bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden hover:border-red-600 transition-all group shadow-md"
                  >
                    <img 
                      src={img} 
                      alt={`Gallery ${idx}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Feature Icons */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-3 md:gap-6">
              {(product.characteristics && product.characteristics.length > 0 
                ? product.characteristics 
                : [
                    { emoji: "🛡️", label: 'durability', value: 'high' },
                    { emoji: "⚡", label: 'handling', value: 'medium' },
                    { emoji: "🎯", label: 'precision', value: 'elite' }
                  ]
              ).map((feature, i) => (
                <div key={i} className="p-3 sm:p-4 md:p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl md:rounded-3xl flex flex-col items-center text-center group hover:border-red-600/50 transition-all duration-500 min-w-[80px] shadow-sm">
                  <div className="mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                    <RedIcon emoji={feature.emoji || ''} size={window.innerWidth < 640 ? 16 : 20} />
                  </div>
                  <p className="text-[7px] sm:text-[8px] md:text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1">{t(feature.label.toLowerCase())}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm font-black uppercase text-[var(--text-primary)] truncate w-full">{t(feature.value.toLowerCase())}</p>
                </div>
              ))}
            </div>

            {/* Product Story / Long Description */}
            {(product.longDescription || (user?.role === 'admin')) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 md:p-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] md:rounded-[40px] relative overflow-hidden group shadow-lg ${!product.longDescription ? 'border-dashed border-[var(--border-color)] opacity-50' : ''}`}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                <div className="relative z-10">
                  <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-red-500 mb-6 flex items-center gap-3">
                    <span className="w-4 h-px bg-red-600" />
                    {t('product_story') || 'Description'}
                    {!product.longDescription && <span className="text-[8px] text-[var(--text-secondary)] tracking-normal">(Admin: No description added yet)</span>}
                  </h3>
                  <div className="prose prose-sm md:prose-base max-w-none text-[var(--text-secondary)] font-medium leading-relaxed whitespace-pre-wrap">
                    {language === 'HR' && product.longDescriptionHr ? product.longDescriptionHr : (product.longDescription || (user?.role === 'admin' ? 'This product has no description yet. Go to the admin panel to add a detailed history or description.' : ''))}
                  </div>
                </div>
                
                {/* Decorative background element */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-600/5 blur-[80px] rounded-full group-hover:bg-red-600/10 transition-colors duration-700" />
              </motion.div>
            )}
          </div>

          {/* Right Column: Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-8 md:mb-12">
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <span className="w-6 md:w-8 h-1 bg-red-600" />
                <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-red-500">
                  {product.brand}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.9] text-[var(--text-primary)]">
                {language === 'HR' && product.nameHr ? product.nameHr : product.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{t('price')}</span>
                  <div className="flex flex-row sm:flex-col items-baseline gap-3 sm:gap-0">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter">
                      €{getDiscountedPrice(currentPrice, product.discount).toFixed(2)}
                    </span>
                    {product.discount > 0 && (
                      <span className="text-xs sm:text-sm text-[var(--text-secondary)] line-through font-bold">
                        €{currentPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block h-12 w-px bg-[var(--border-color)]" />
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{t('availability')}</span>
                  <div className={`flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest ${currentStock > 0 ? 'text-emerald-500' : 'text-red-600'}`}>
                    <Box size={14} className="sm:w-4 sm:h-4" />
                    {currentStock > 0 ? `${currentStock} ${t('in_stock')}` : t('out_of_stock')}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8 mb-8 md:mb-12">
              {product.description && (
                <p className="text-[var(--text-secondary)] text-sm sm:text-base md:text-lg leading-relaxed font-medium">
                  {language === 'HR' && product.descriptionHr ? product.descriptionHr : product.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 md:gap-3">
                {(product.tags || []).map(tag => (
                  <span key={tag} className="px-2.5 py-1 md:px-4 md:py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-primary)] hover:border-red-600/50 transition-all cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Color / Variant Switcher */}
              {product.relatedProducts && product.relatedProducts.length > 1 && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('color_variant') || 'Color / Pattern'}</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.relatedProducts.map(rp => {
                      const isActive = rp.id === product.id;
                      return isActive ? (
                        <div key={rp.id} className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-red-600 shadow-lg shadow-red-600/20 overflow-hidden relative cursor-default" title={rp.name}>
                          {rp.image || (rp.images && rp.images.length > 0) ? (
                            <img src={rp.image || rp.images[0]} className="w-full h-full object-cover" alt={rp.name} />
                          ) : (
                            <NoImage className="w-full h-full" iconSize={16} text="" />
                          )}
                        </div>
                      ) : (
                        <Link
                          key={rp.id}
                          to={`/product/${rp.id}/${rp.slug}`}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-[var(--border-color)] hover:border-red-600 overflow-hidden relative opacity-60 hover:opacity-100 transition-all"
                          title={rp.name}
                        >
                          {rp.image || (rp.images && rp.images.length > 0) ? (
                            <img src={rp.image || rp.images[0]} className="w-full h-full object-cover" alt={rp.name} />
                          ) : (
                            <NoImage className="w-full h-full" iconSize={16} text="" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variant Selectors */}
              {((product as any).variantAttributes || (product as any).variant_attributes)?.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-[var(--border-color)]">
                  {((product as any).variantAttributes || (product as any).variant_attributes).map((attr: any) => (
                    <div key={attr.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{attr.name}</label>
                        {selectedAttributes[attr.name] && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{selectedAttributes[attr.name]}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {attr.options?.map((opt: string) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: opt }))}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                              selectedAttributes[attr.name] === opt
                                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-red-600/50'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Quantity Selector */}
              <div className="pt-6 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('quantity') || 'Quantity'}</label>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('total_price') || 'Total'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-1 shadow-inner h-14 w-40">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-12 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-all"
                    >
                      <Wind size={16} className="rotate-180" />
                    </button>
                    <div className="flex-1 text-center font-mono font-black text-lg text-[var(--text-primary)]">
                      {quantity}
                    </div>
                    <button 
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-12 h-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-all"
                    >
                      <Wind size={16} />
                    </button>
                  </div>
                  <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-6 flex items-center justify-end h-14">
                     <span className="text-xl font-black text-[var(--text-primary)] font-mono">
                       €{(getDiscountedPrice(currentPrice, product.discount) * quantity).toLocaleString()}
                     </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <button 
                onClick={() => {
                  addItem(product, selectedVariant || undefined, quantity);
                }}
                disabled={currentStock <= 0 || !isSelectionComplete}
                className="flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 md:py-6 bg-red-600 hover:bg-red-700 disabled:bg-zinc-900 disabled:text-zinc-700 disabled:border-zinc-800 border border-red-500 text-white rounded-xl md:rounded-2xl transition-all shadow-2xl shadow-red-900/20 text-xs sm:text-sm font-black uppercase tracking-widest group"
              >
                <ShoppingCart size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                {missingAttribute 
                  ? t('select_attr', { attr: formatLabel(missingAttribute.name) }) 
                  : t('add_to_cart')}
              </button>
              <button 
                onClick={() => toggleCompare(product)}
                className={`flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 md:py-6 rounded-xl md:rounded-2xl transition-all text-xs sm:text-sm font-black uppercase tracking-widest border ${
                  isInCompare(product.id)
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-red-600/50 shadow-sm'
                }`}
              >
                <GitCompare size={18} className="sm:w-5 sm:h-5" />
                {isInCompare(product.id) ? t('comparing') : t('compare')}
              </button>
            </div>

            <button 
              onClick={() => toggleWishlist(product)}
              className={`flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 md:py-6 w-full rounded-xl md:rounded-2xl transition-all text-xs sm:text-sm font-black uppercase tracking-widest border mb-4 sm:mb-6 md:mb-8 ${
                isInWishlist(product.id)
                  ? 'bg-red-600/10 text-red-500 border-red-600/20'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-red-600/50 shadow-sm'
              }`}
            >
              <Heart size={18} className="sm:w-5 sm:h-5" fill={isInWishlist(product.id) ? "currentColor" : "none"} />
              {isInWishlist(product.id) ? t('remove_from_wishlist') : t('add_to_wishlist')}
            </button>

            {product.has3D && product.type === 'weapon' && (
              <Link 
                to="/configurator"
                className="flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 md:py-6 bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] rounded-xl md:rounded-2xl transition-all text-xs sm:text-sm font-black uppercase tracking-widest mb-6 sm:mb-8 md:mb-12 shadow-xl"
              >
                <Settings size={18} className="sm:w-5 sm:h-5" />
                {t('customize_in_3d')}
              </Link>
            )}

            {/* Technical Specs */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl md:rounded-[32px] p-5 sm:p-6 md:p-8 shadow-inner">
              <h3 className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)] mb-4 sm:mb-6 flex items-center gap-3">
                <span className="w-4 h-1 bg-red-600" />
                {t('technical_specifications')}
              </h3>
              <div className="grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-6 sm:gap-x-8 md:gap-x-12">
                {[
                  { label: t('brand'), value: product.brand },
                  { label: t('model'), value: product.model },
                  { label: t('category_label'), value: categoryName },
                  ...(product.subcategory ? [{ label: t('sub_label'), value: subcategoryName }] : []),
                  ...(product.mountType ? [{ label: t('mount_type'), value: product.mountType }] : []),
                  ...(product.characteristics || []).map(c => ({ label: c.label, value: c.value }))
                ].map((spec, i) => (
                  <div key={i} className="flex flex-col gap-0.5 sm:gap-1">
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{formatLabel(spec.label)}</span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest truncate">{formatLabel(spec.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full aspect-square md:aspect-[4/3] lg:aspect-video bg-zinc-900 rounded-[32px] overflow-hidden border border-zinc-800 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-6 right-6 p-3 bg-black/50 text-white rounded-full hover:bg-red-600 transition-all border border-white/10"
              >
                <X size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
