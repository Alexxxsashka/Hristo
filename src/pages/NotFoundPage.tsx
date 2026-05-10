import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, Crosshair } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ab1017]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#ab1017]/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
          className="relative mb-8"
        >
          <span className="text-[120px] sm:text-[180px] font-black text-[var(--bg-tertiary)] leading-none select-none tracking-tighter">
            404
          </span>
          <Crosshair 
            size={64} 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#ab1017] animate-pulse" 
          />
        </motion.div>

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-[var(--text-primary)] mb-3">
          {t('page_not_found') || 'Target Not Found'}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-10 max-w-sm mx-auto leading-relaxed">
          {t('page_not_found_desc') || 'The page you are looking for has been moved, deleted, or never existed. Check your coordinates and try again.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-8 py-4 bg-[#ab1017] hover:bg-[#8e0d13] text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-[#ab1017]/20 active:scale-[0.98]"
          >
            <Home size={16} />
            {t('go_home') || 'Go Home'}
          </Link>
          <Link
            to="/shop"
            className="flex items-center gap-2 px-8 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:border-[#ab1017]/50"
          >
            <Search size={16} />
            {t('browse_shop') || 'Browse Shop'}
          </Link>
        </div>

        {/* Back link */}
        <button
          onClick={() => window.history.back()}
          className="mt-8 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest transition-colors mx-auto"
        >
          <ArrowLeft size={14} />
          {t('go_back') || 'Go Back'}
        </button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
