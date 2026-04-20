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
        <h2 className="text-3xl font-black tracking-tighter uppercase">{t('loyalty_and_rank')}</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('earn_points_unlock_discounts')}</p>
      </header>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{t('current_rank')}</p>
            <h3 className="text-5xl font-black uppercase tracking-tighter text-red-600">{profile?.rank ? t(`rank_${profile.rank.toLowerCase().replace(/ /g, '_')}`) : t('rank_recruit')}</h3>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{t('total_points')}</p>
            <h3 className="text-5xl font-black uppercase tracking-tighter">{currentPoints}</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <p className="text-xs font-bold uppercase tracking-widest">{t('progress_to')} {nextRank.name}</p>
            <p className="text-xs font-black text-red-600">€{(nextRank.threshold - currentPoints).toFixed(0)} {t('more_to_rank_up')}</p>
          </div>
          <div className="w-full h-4 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            />
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
            {t('spend_more_to_reach')} '{nextRank.name}' {t('rank_and_get_discount')} ({nextRank.discount}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {ranks.map((rank, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${
            currentPoints >= rank.threshold ? 'bg-red-600/10 border-red-600/50' : 'bg-zinc-900/50 border-zinc-800 opacity-50'
          }`}>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">{t('rank')} {idx + 1}</p>
            <h4 className="font-black uppercase tracking-tighter text-sm mb-2">{rank.name}</h4>
            <p className="text-lg font-black">{rank.discount}%</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">{t('discount')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
