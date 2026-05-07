import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { UserProfile } from '../../types';

interface LoyaltyRankProps {
  profile: UserProfile | null;
}

export const LoyaltyRank: React.FC<LoyaltyRankProps> = ({ profile }) => {
  const { t } = useTranslation();
  const ranks = [
    { name: t('rank_recruit'), threshold: 0, discount: 0 },
    { name: t('rank_private'), threshold: 500, discount: 3 },
    { name: t('rank_sergeant'), threshold: 1500, discount: 5 },
    { name: t('rank_special_forces'), threshold: 3000, discount: 10 },
    { name: t('rank_operator'), threshold: 5000, discount: 15 },
    { name: t('rank_commander'), threshold: 10000, discount: 20 },
  ];

  const currentPoints = profile?.points || 0;
  const nextRank = ranks.find(r => r.threshold > currentPoints) || ranks[ranks.length - 1];
  const progress = Math.min((currentPoints / (nextRank.threshold || 1)) * 100, 100);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">{t('loyalty_and_rank')}</h2>
        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-1">{t('earn_points_unlock_discounts')}</p>
      </header>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">{t('current_rank')}</p>
            <h3 className="text-5xl font-black uppercase tracking-tighter text-red-600">{profile?.rank ? t(`rank_${profile.rank.toLowerCase().replace(/ /g, '_')}`) : t('rank_recruit')}</h3>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">{t('total_points')}</p>
            <h3 className="text-5xl font-black uppercase tracking-tighter text-[var(--text-primary)]">{currentPoints}</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">{t('progress_to')} {nextRank.name}</p>
            <p className="text-xs font-black text-red-600">€{(nextRank.threshold - currentPoints).toFixed(0)} {t('more_to_rank_up')}</p>
          </div>
          <div className="w-full h-4 bg-[var(--bg-tertiary)] rounded-full border border-[var(--border-color)] overflow-hidden p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            />
          </div>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">
            {t('spend_more_to_reach')} '{nextRank.name}' {t('rank_and_get_discount')} ({nextRank.discount}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {ranks.map((rank, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${
            currentPoints >= rank.threshold 
              ? 'bg-red-600/10 border-red-600/50' 
              : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] opacity-50'
          }`}>
            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">{t('rank')} {idx + 1}</p>
            <h4 className="font-black uppercase tracking-tighter text-sm mb-2 text-[var(--text-primary)]">{rank.name}</h4>
            <p className="text-lg font-black text-[var(--text-primary)]">{rank.discount}%</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{t('discount')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
