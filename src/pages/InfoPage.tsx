import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileText, Truck, CreditCard, Info, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '../hooks/useTranslation';
import { PolicyPage } from '../types';
import { databaseService } from '../services/databaseService';
import { defaultPolicies } from '../data/defaultPolicies';

const PAGE_ICONS: Record<string, any> = {
  'terms': FileText,
  'privacy': Shield,
  'shipping': Truck,
  'payment-methods': CreditCard,
  'returns': FileText,
  'about': Info
};

export const InfoPage: React.FC = () => {
  const { t, language } = useTranslation();
  const location = useLocation();
  const [policy, setPolicy] = useState<PolicyPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const pathId = location.pathname.split('/').pop() || 'about';

  useEffect(() => {
    const fetchPolicy = async () => {
      setIsLoading(true);
      try {
        const data = await databaseService.getPolicy(pathId);
        if (data) {
          setPolicy(data as PolicyPage);
        } else {
          // Fallback to default policy if not found in database
          const defaultPolicy = defaultPolicies.find(p => p.id === pathId);
          if (defaultPolicy) {
            setPolicy({
              ...defaultPolicy,
              lastUpdated: new Date().toISOString()
            } as PolicyPage);
          }
        }
      } catch (err) {
        console.error('Failed to fetch policy', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, [pathId]);

  const Icon = PAGE_ICONS[pathId] || Info;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center space-y-6">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{t('product_not_found') || 'Page not found'}</h2>
      </div>
    );
  }

  const isHr = language === 'HR';
  const displayTitle = isHr && policy.title_hr ? policy.title_hr : policy.title;
  const displayContent = isHr && policy.content_hr ? policy.content_hr : policy.content;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-20 px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 p-12 md:p-20 rounded-[40px] space-y-12"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-red-600/10 rounded-[30px] flex items-center justify-center text-red-600">
              <Icon size={40} />
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
              {displayTitle}
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
              <Calendar size={14} className="text-red-600" />
              {t('last_updated') || 'Last Updated'}: {new Date(policy.lastUpdated).toLocaleDateString()}
            </div>
          </div>

          <div className="prose prose-invert prose-red max-w-none">
            <div className="text-zinc-300 text-lg leading-relaxed space-y-6">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-zinc-800">
            <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
              <h3 className="text-white font-black uppercase text-sm tracking-widest">{t('need_help') || 'Need Help?'}</h3>
              <p className="text-zinc-500 text-sm">{t('need_help_desc') || 'Our team is available for all your questions regarding this topic.'}</p>
              <button className="text-red-500 font-bold text-xs uppercase tracking-widest hover:text-red-400 transition-colors">{t('contact_us') || 'Contact Us'} →</button>
            </div>
            <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
              <h3 className="text-white font-black uppercase text-sm tracking-widest">{t('secure_shopping') || 'Secure Shopping'}</h3>
              <p className="text-zinc-500 text-sm">{t('secure_shopping_desc') || 'Your security and satisfaction are our top priorities.'}</p>
              <button className="text-red-500 font-bold text-xs uppercase tracking-widest hover:text-red-400 transition-colors">{t('learn_more') || 'Learn More'} →</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
