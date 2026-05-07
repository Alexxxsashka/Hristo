import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ExternalLink, Truck } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { databaseService } from '../../services/databaseService';
import { Order } from '../../types';
import { NoImage } from '../NoImage';

interface OrderHistoryProps {
  orders: Order[];
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, setConfirmModal }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  const handleReorderItem = (item: any) => {
    addToCart({
      productId: item.productId,
      productName: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      sku: item.sku,
      landingCost: item.landingCost,
      selectedParts: [],
      totalPrice: item.price * item.quantity,
      selectedVariant: item.selectedVariant
    });
    setReorderedId(`${item.productId}-${Date.now()}`);
    setTimeout(() => setReorderedId(null), 2000);
  };

  const handleReorderAll = (order: Order) => {
    order.items.forEach(item => {
      handleReorderItem(item);
    });
  };

  const handleRequestCancel = async (orderId: string) => {
    if (!user) return;
    setConfirmModal({
      isOpen: true,
      title: t('request_cancellation'),
      message: t('confirm_request_cancellation'),
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
        setRequestingId(orderId);
        try {
          await databaseService.requestOrderCancellation(orderId, user.id);
        } catch (error) {
          console.error('Error requesting cancellation:', error);
        } finally {
          setRequestingId(null);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">{t('order_history')}</h2>
          <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-1">{t('track_and_manage_past_purchases')}</p>
        </div>
      </header>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[var(--border-color)] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">{t('order_id')}</p>
                    <p className="font-black text-sm text-[var(--text-primary)]">#{order.id.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">{t('date')}</p>
                    <p className="font-black text-sm text-[var(--text-primary)]">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">{t('total')}</p>
                    <p className="font-black text-sm text-[#ab1017]">€{order.total.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {order.cancelRequested ? (
                    <span className="px-4 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase">
                      {t('cancellation_requested')}
                    </span>
                  ) : (
                    (order.status === 'pending' || order.status === 'processing') && (
                      <button 
                        onClick={() => handleRequestCancel(order.id)}
                        disabled={requestingId === order.id}
                        className="px-4 py-1 bg-[#ab1017]/10 text-[#ab1017] hover:bg-[#ab1017]/20 rounded-full text-[10px] font-black uppercase transition-all disabled:opacity-50"
                      >
                        {requestingId === order.id ? t('sending') : t('request_cancellation')}
                      </button>
                    )
                  )}
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                    order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 
                    order.status === 'cancelled' ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]' :
                    'bg-[#ab1017]/10 text-[#ab1017]'
                  }`}>
                    {t(`status_${order.status.toLowerCase().replace(/ /g, '_')}`)}
                  </span>
                  <button className="p-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl transition-colors">
                    <ExternalLink size={16} />
                  </button>
                  <button 
                    onClick={() => handleReorderAll(order)}
                    className="px-4 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest rounded-full transition-all"
                  >
                    {t('reorder_all')}
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)] flex items-center justify-center p-2">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <NoImage className="w-full h-full" iconSize={12} text="" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-[var(--text-primary)]">{item.name}</p>
                        {item.selectedVariant && (
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {Object.entries(item.selectedVariant.attributes).map(([key, value]) => (
                              <span key={key} className="text-[8px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">{t('qty')}: {item.quantity} • €{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reorderedId?.startsWith(item.productId) && (
                          <motion.span 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] font-bold text-emerald-500 uppercase"
                          >
                            {t('reorder_success')}
                          </motion.span>
                        )}
                        <button 
                          onClick={() => handleReorderItem(item)}
                          className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                          {t('reorder')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {order.shipping.trackingNumber && (
                  <div className="mt-6 p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Truck className="text-[#ab1017]" size={20} />
                      <div>
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('tracking_number')} ({order.shipping.method})</p>
                        <p className="font-black text-sm text-[var(--text-primary)]">{order.shipping.trackingNumber}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-12 text-center shadow-sm">
          <Package className="mx-auto text-[var(--text-secondary)] opacity-20 mb-4" size={64} />
          <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-[var(--text-primary)]">{t('no_orders_found')}</h3>
          <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs mb-6">{t('no_purchases_yet')}</p>
        </div>
      )}
    </div>
  );
};
