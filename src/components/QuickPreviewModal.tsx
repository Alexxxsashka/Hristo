import React from 'react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, ArrowRight, Shield, Box, Scale, Ruler, Target, Battery, Wind, Settings, Hammer, Lightbulb, Binoculars, Sun, Hand, Circle, Zap } from 'lucide-react';
import { ModelViewer } from './ModelViewer';
import { useCartStore } from '../store/cartStore';
import { Link } from 'react-router-dom';
import { getDiscountedPrice } from '../utils/price';
import { useTranslation } from '../hooks/useTranslation';
import { formatLabel } from '../utils/formatText';

const RedIcon = ({ emoji, size = 20 }: { emoji: string; size?: number }) => {
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

interface QuickPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({ product, isOpen, onClose }) => {
  const { addItem } = useCartStore();
  const { language, t } = useTranslation();
  const [selectedAttributes, setSelectedAttributes] = React.useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null);

  React.useEffect(() => {
    // Reset selection when product changes or modal closes
    if (!isOpen) {
      setSelectedAttributes({});
      setSelectedVariant(null);
    }
  }, [isOpen, product?.id]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]"
          >
            {/* 3D Viewer Section */}
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-zinc-900 relative flex flex-col">
              <div className="flex-1 relative">
                {product.has3D ? (
                  <ModelViewer modelPath={product.model3D?.startsWith('http') ? product.model3D : (product.model3D || product.model)} />
                ) : (
                  <img 
                    src={product.images && product.images.length > 0 ? product.images[0] : (product.image?.startsWith('http') ? product.image : (product.image || `https://picsum.photos/seed/${product.id}/800/800`))} 
                    className="absolute inset-0 w-full h-full object-cover"
                    alt={product.name}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Gallery Thumbnails in Quick View */}
              {product.images && product.images.length > 0 && (
                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex gap-2 overflow-x-auto custom-scrollbar">
                  {product.images.map((img, idx) => (
                    <div 
                      key={idx}
                      className="w-12 h-12 rounded-lg border border-zinc-800 overflow-hidden shrink-0"
                    >
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}
              
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-colors md:hidden"
              >
                <X size={20} />
              </button>
            </div>

            {/* Product Details Section */}
            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {product.brand}
                    </span>
                    <span className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {product.category}
                    </span>
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 leading-none">
                    {language === 'HR' && product.nameHr ? product.nameHr : product.name}
                  </h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hidden md:block"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="flex flex-col">
                  <span className="text-3xl font-mono font-bold text-red-600">
                    €{getDiscountedPrice(product.price, product.discount).toFixed(2)}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-[10px] text-zinc-400 line-through font-bold">
                      €{product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase">
                  <Box size={14} />
                  {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                </div>
              </div>

              {/* Dynamic Characteristics */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {(product.characteristics && product.characteristics.length > 0 
                  ? product.characteristics 
                  : [
                      { emoji: "🛡️", label: 'durability', value: 'high' },
                      { emoji: "⚡", label: 'handling', value: 'medium' },
                      { emoji: "🎯", label: 'precision', value: 'elite' }
                    ]
                ).slice(0, 3).map((char, i) => (
                  <div key={i} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center text-center">
                    <div className="mb-2">
                      <RedIcon emoji={char.emoji} size={18} />
                    </div>
                    <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest mb-1">{t(char.label.toLowerCase())}</p>
                    <p className="text-[10px] font-black uppercase text-zinc-900">{t(char.value.toLowerCase())}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-10">
                {product.description && (
                  <p className="text-zinc-500 text-lg leading-relaxed">
                    {language === 'HR' && product.descriptionHr ? product.descriptionHr : product.description}
                  </p>
                )}
                
                {product.longDescription && (
                  <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-3">Description</h4>
                    <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap italic">
                      {product.longDescription}
                    </p>
                  </div>
                )}
              </div>

              {product.type === 'module' && product.compatibleWeapons && product.compatibleWeapons.length > 0 && (
                <div className="mb-10 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={14} className="text-red-600" />
                    COMPATIBLE WEAPONS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.compatibleWeapons.map(weaponId => (
                      <span 
                        key={weaponId}
                        className="px-3 py-1 bg-white border border-zinc-200 text-zinc-600 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      >
                        {weaponId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-6">
                {/* Variant Selectors in Quick View */}
                {((product as any).variantAttributes || (product as any).variant_attributes)?.length > 0 && (
                  <div className="space-y-4 border-t border-zinc-100 pt-6">
                    {((product as any).variantAttributes || (product as any).variant_attributes).map((attr: any) => (
                      <div key={attr.name} className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{attr.name}</label>
                        <div className="flex flex-wrap gap-2">
                          {attr.options?.map((opt: string) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const newAttrs = { ...selectedAttributes, [attr.name]: opt };
                                setSelectedAttributes(newAttrs);
                                if (product.variants) {
                                  const variant = product.variants.find(v => 
                                    Object.entries(newAttrs).every(([key, value]) => v.attributes[key] === value)
                                  );
                                  setSelectedVariant(variant || null);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                selectedAttributes[attr.name] === opt
                                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg'
                                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => addItem(product, selectedVariant || undefined)}
                    disabled={product.stock <= 0 || (((product as any).variantAttributes || (product as any).variant_attributes)?.length > 0 && !((product as any).variantAttributes || (product as any).variant_attributes).every((attr: any) => selectedAttributes[attr.name]))}
                    className="flex items-center justify-center gap-3 py-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white rounded-2xl transition-all font-bold uppercase tracking-widest"
                  >
                    <ShoppingCart size={20} />
                    {((product as any).variantAttributes || (product as any).variant_attributes)?.length > 0 && !((product as any).variantAttributes || (product as any).variant_attributes).every((attr: any) => selectedAttributes[attr.name]) 
                      ? 'SELECT SIZE' 
                      : 'ADD TO CART'}
                  </button>
                  <Link 
                    to={`/product/${product.id}/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-center gap-3 py-4 bg-white border border-zinc-200 hover:border-zinc-900 text-zinc-900 rounded-2xl transition-all font-bold uppercase tracking-widest"
                  >
                    FULL PAGE
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
