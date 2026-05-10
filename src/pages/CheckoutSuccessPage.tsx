import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Home, FileText, ArrowRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/authStore';

export const CheckoutSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [confettiDone, setConfettiDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setConfettiDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-[var(--text-primary)] mb-3"
        >
          {t('order_confirmed') || 'Order Confirmed!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-[var(--text-secondary)] mb-2 leading-relaxed"
        >
          {t('order_success_desc') || 'Thank you for your purchase. Your order has been received and is being processed.'}
        </motion.p>

        {/* Order Number */}
        {orderNumber && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="my-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl"
          >
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest block mb-1">
              {t('order_number') || 'Order Number'}
            </span>
            <span className="text-xl font-black text-[#ab1017] tracking-tight">
              #{orderNumber}
            </span>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl mb-8 text-left space-y-3"
        >
          <div className="flex items-start gap-3">
            <Package size={18} className="text-[#ab1017] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">
                {t('whats_next') || "What's Next?"}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                {t('order_next_steps') || 'You will receive an email confirmation shortly. We will notify you when your order ships.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {isAuthenticated && (
            <Link
              to="/account?tab=orders"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#ab1017] hover:bg-[#8e0d13] text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-[#ab1017]/20"
            >
              <FileText size={16} />
              {t('view_orders') || 'View Orders'}
            </Link>
          )}
          <Link
            to="/shop"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:border-[#ab1017]/50"
          >
            {t('continue_shopping') || 'Continue Shopping'}
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Home link */}
        <Link
          to="/"
          className="mt-6 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest transition-colors mx-auto justify-center"
        >
          <Home size={14} />
          {t('go_home') || 'Back to Home'}
        </Link>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccessPage;
