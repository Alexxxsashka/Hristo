import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useTranslation } from '../hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft, ShoppingBag, CreditCard, Plus, Minus } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuthStore } from '../store/authStore';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const userDiscount = user?.discountLevel || 0;
  const totalAmount = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const discountAmount = totalAmount * (userDiscount / 100);
  const finalTotal = totalAmount - discountAmount;
  const vatAmount = finalTotal * 0.2;

  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 pb-24">
      {/* Header */}
      <header className="h-16 sm:h-20 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6">
          <Link to="/" className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </Link>
          <div className="h-5 sm:h-6 w-px bg-zinc-800" />
          <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tighter flex items-center gap-2 md:gap-3">
            <ShoppingBag className="text-red-600 sm:w-6 sm:h-6" size={20} />
            {t('shopping_cart')}
          </h1>
        </div>
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 md:py-12">
        <AnimatePresence mode="wait">
          {cartItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-16 sm:py-24 text-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                <ShoppingBag size={32} className="sm:w-10 sm:h-10 text-zinc-700" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-300 mb-2">{t('cart_empty')}</h2>
              <p className="text-sm sm:text-base text-zinc-500 mb-8 max-w-xs">{t('no_products_desc')}</p>
              <Link 
                to="/" 
                className="px-6 py-3 sm:px-8 sm:py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest transition-all text-xs sm:text-sm"
              >
                {t('back_to_catalog')}
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {cartItems.length} {t('active_attachments')}
                  </h2>
                  <button 
                    onClick={clearCart}
                    className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    {t('clear_all')}
                  </button>
                </div>

                {cartItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 sm:p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl sm:rounded-2xl group hover:border-zinc-700 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg sm:text-xl font-black uppercase tracking-tighter text-white mb-1 truncate">
                          {item.productName}
                        </h3>
                        {item.selectedVariant && (
                          <div className="flex flex-wrap gap-2 mt-1 mb-2">
                            {Object.entries(item.selectedVariant.attributes).map(([key, value]) => (
                              <span key={key} className="px-2 py-0.5 bg-zinc-800/50 text-zinc-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded border border-zinc-700/50">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[9px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest truncate">ID: {item.productId}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 sm:p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    </div>

                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-zinc-500">{t('price')}</span>
                        <div className="flex flex-col items-end">
                          {item.discount ? (
                            <>
                              <span className="font-mono text-zinc-300">€{item.price.toLocaleString()}</span>
                              <span className="text-[9px] sm:text-[10px] text-zinc-500 line-through">€{item.originalPrice?.toLocaleString()}</span>
                              <span className="text-[9px] sm:text-[10px] text-red-500 font-bold">-{item.discount}%</span>
                            </>
                          ) : (
                            <span className="font-mono text-zinc-300">€{item.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex justify-between items-center bg-zinc-950 border border-zinc-800 rounded-xl p-2 h-12">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">
                          {t('quantity')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-white text-xs">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 sm:pt-4 border-t border-zinc-800 flex justify-between items-center">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500">{t('total')}</span>
                      <span className="text-xl sm:text-2xl font-black text-white font-mono">€{item.totalPrice.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-32 p-6 sm:p-8 bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl shadow-red-900/5">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter mb-6 sm:mb-8 flex items-center gap-3">
                    <CreditCard className="text-red-600 sm:w-5 sm:h-5" size={18} />
                    {t('order_summary')}
                  </h2>

                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-zinc-500">{t('total_price')}</span>
                      <span className="text-zinc-300 font-mono">€{totalAmount.toLocaleString()}</span>
                    </div>
                    {userDiscount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm text-emerald-500">
                        <span>{t('dashboard_discount')} ({user?.rank}) -{userDiscount}%</span>
                        <span className="font-mono">-€{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="h-px bg-zinc-800 my-3 sm:my-4" />
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white">{t('total')}</span>
                        <span className="text-3xl sm:text-4xl font-black text-red-600 font-mono">€{finalTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        <span>{t('vat_included')}</span>
                        <span className="font-mono">€{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-4 sm:py-5 bg-red-600 hover:bg-red-700 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 sm:gap-3 group disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    {isCheckingOut ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {t('proceed_to_checkout')}
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <ArrowLeft size={18} className="rotate-180 sm:w-5 sm:h-5" />
                        </motion.div>
                      </>
                    )}
                  </button>

                  <p className="mt-4 sm:mt-6 text-[9px] sm:text-[10px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed">
                    {t('secure_checkout_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
