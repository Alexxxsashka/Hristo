import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useTranslation } from '../hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowLeft, ShoppingBag, CreditCard, Plus, Minus, Tag, Ticket, RefreshCw, Check, X } from 'lucide-react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuthStore } from '../store/authStore';
import { formatLabel } from '../utils/formatText';
import { databaseService } from '../services/databaseService';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const userDiscount = user?.discountLevel || 0;
  const totalAmount = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const userDiscountAmount = totalAmount * (userDiscount / 100);
  const finalTotal = Math.max(0, totalAmount - userDiscountAmount - promoDiscount);
  const vatAmount = finalTotal * 0.2;

  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleCheckout = () => {
    navigate('/checkout', { state: { appliedCoupon } });
  };

  const [promoCode, setPromoCode] = React.useState('');
  const [promoDiscount, setPromoDiscount] = React.useState(0);
  const [promoMessage, setPromoMessage] = React.useState('');
  const [promoStatus, setPromoStatus] = React.useState<'success' | 'error' | null>(null);
  const [appliedCoupon, setAppliedCoupon] = React.useState<any | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setIsValidating(true);
    setPromoMessage('');
    try {
      const result = await databaseService.validateCoupon(promoCode, cartItems);
      if (result.valid) {
        setPromoDiscount(result.discount);
        setAppliedCoupon(result.coupon);
        setPromoStatus('success');
        setPromoMessage(result.message);
      } else {
        setPromoDiscount(0);
        setAppliedCoupon(null);
        setPromoStatus('error');
        setPromoMessage(result.message);
      }
    } catch (err) {
      setPromoStatus('error');
      setPromoMessage('Ошибка валидации');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveItem = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('remove_item'),
      message: `${t('confirm_remove_item')} "${name}"?`,
      onConfirm: () => {
        removeFromCart(id);
        setConfirmDialog(null);
      }
    });
  };

  const handleClearCart = () => {
    setConfirmDialog({
      isOpen: true,
      title: t('clear_cart'),
      message: t('confirm_clear_cart'),
      onConfirm: () => {
        clearCart();
        setConfirmDialog(null);
      }
    });
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
                    onClick={handleClearCart}
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
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shrink-0 group-hover:border-red-600/30 transition-colors">
                        <img 
                          src={item.image || `https://picsum.photos/seed/${item.productId}/300/300`} 
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 pr-4">
                            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tighter text-white mb-1 group-hover:text-red-500 transition-colors truncate">
                              {item.productName}
                            </h3>
                            {item.selectedVariant && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {Object.entries(item.selectedVariant.attributes).map(([key, value]) => (
                                  <span key={key} className="px-2 py-0.5 bg-zinc-800/80 text-zinc-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded border border-zinc-700/50">
                                    {formatLabel(key)}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                              {t('sku')}: {item.sku || 'N/A'}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveItem(item.id, item.productName)}
                            className="p-2 sm:p-2.5 bg-zinc-950/50 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-zinc-800 hover:border-red-500/30 transition-all shrink-0"
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                          <div className="flex flex-col gap-3">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t('price')}</span>
                            <div className="flex items-baseline gap-2">
                              {item.discount ? (
                                <>
                                  <span className="text-lg sm:text-xl font-black text-white font-mono">€{item.price.toLocaleString()}</span>
                                  <span className="text-xs text-zinc-600 line-through font-bold">€{item.originalPrice?.toLocaleString()}</span>
                                </>
                              ) : (
                                <span className="text-lg sm:text-xl font-black text-white font-mono">€{item.price.toLocaleString()}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 w-32 sm:w-40">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t('quantity')}</span>
                            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 h-10 shadow-inner">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                              >
                                <Minus size={12} />
                              </button>
                              <div className="flex-1 text-center font-mono font-black text-white text-sm">
                                {item.quantity}
                              </div>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t('total')}</span>
                            <span className="text-xl sm:text-2xl font-black text-red-600 font-mono tracking-tighter">€{item.totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-32 p-8 sm:p-10 bg-zinc-900 border border-zinc-800 rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-red-900/10 relative overflow-hidden group">
                  {/* Decorative background gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[60px] rounded-full group-hover:bg-red-600/10 transition-colors" />
                  
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 relative z-10">
                    <CreditCard className="text-red-600 sm:w-6 sm:h-6" size={20} />
                    {t('order_summary')}
                  </h2>

                  <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10 relative z-10">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest">{t('total_price')}</span>
                      <span className="text-zinc-100 font-mono font-black">€{totalAmount.toLocaleString()}</span>
                    </div>
                    {userDiscount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm text-emerald-500 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                        <div className="flex flex-col">
                          <span className="font-black uppercase tracking-widest text-[10px]">{t('dashboard_discount')} ({formatLabel(user?.rank || '')})</span>
                          <span className="text-[9px] opacity-70">{t('loyalty_program')}</span>
                        </div>
                        <span className="font-mono font-black text-lg">-{userDiscount}%</span>
                      </div>
                    )}

                    {/* Promo Code Input */}
                    <div className="pt-4 border-t border-zinc-800/50">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Promo Code</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                            <input
                              type="text"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="ENTER CODE"
                              className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-red-600/50 transition-all text-xs font-black uppercase tracking-widest"
                            />
                          </div>
                          <button
                            onClick={handleApplyPromoCode}
                            disabled={isValidating || !promoCode}
                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-zinc-700"
                          >
                            {isValidating ? <RefreshCw size={14} className="animate-spin" /> : 'Apply'}
                          </button>
                        </div>
                        {promoMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-wide ${promoStatus === 'success'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-red-500/10 border-red-500/20 text-red-500'
                              }`}
                          >
                            {promoStatus === 'success' ? <Check size={14} /> : <X size={14} />}
                            {promoMessage}
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {promoDiscount > 0 && (
                      <div className="flex justify-between items-center p-3 bg-red-600/10 border border-red-600/20 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Promo Discount</span>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{appliedCoupon?.code} Applied</span>
                        </div>
                        <span className="text-lg font-black text-red-600 font-mono">-€{promoDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="h-px bg-zinc-800/50 my-4 sm:my-6" />
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">{t('final_total')}</span>
                        <span className="text-3xl sm:text-5xl font-black text-red-600 font-mono tracking-tighter drop-shadow-lg shadow-red-900/50">€{finalTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[9px] sm:text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
                        <span>INC. {t('vat_included')}</span>
                        <span className="font-mono">€{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-5 sm:py-6 bg-red-600 hover:bg-red-700 text-white rounded-[20px] sm:rounded-[24px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-red-900/30 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm relative z-10 active:scale-[0.98]"
                  >
                    {isCheckingOut ? (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {t('proceed_to_checkout')}
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <ArrowLeft size={20} className="rotate-180 sm:w-6 sm:h-6" />
                        </motion.div>
                      </>
                    )}
                  </button>

                  <p className="mt-8 text-[8px] sm:text-[10px] text-zinc-600 text-center uppercase tracking-[0.2em] leading-relaxed font-bold relative z-10 border-t border-zinc-800/50 pt-8">
                    {t('secure_checkout_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center text-red-600">
                  <Trash2 size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{confirmDialog.title}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Tactical Confirmation Required</p>
                </div>
              </div>
              
              <p className="text-zinc-300 text-sm leading-relaxed mb-8 font-medium text-center">
                {confirmDialog.message}
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-zinc-700"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl shadow-red-600/20"
                >
                  {t('confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
