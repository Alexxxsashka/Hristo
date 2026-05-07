import React from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, Shield, ShoppingBag } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { UserProfile, Order } from '../../types';

interface DashboardOverviewProps {
  profile: UserProfile | null;
  orders: Order[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ profile, orders }) => {
  const { t } = useTranslation();
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
          {t('welcome_back')}, <span className="text-red-600">{profile?.callsign || t('operator')}</span>!
        </h1>
        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs">
          {t('status')}: <span className="text-green-500">{profile?.rank ? t(`rank_${profile.rank.toLowerCase().replace(/ /g, '_')}`) : t('rank_recruit')}</span> • {t('team')}: {profile?.teamName || t('freelancer')}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
              <Package className="text-red-600" size={20} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs text-[var(--text-secondary)]">{t('active_orders')}</h3>
          </div>
          <p className="text-3xl font-black text-[var(--text-primary)]">{activeOrders.length}</p>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mt-2 tracking-widest">
            {activeOrders.length > 0 ? t('in_transit_processing') : t('no_active_orders')}
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
              <TrendingUp className="text-red-600" size={20} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs text-[var(--text-secondary)]">{t('loyalty_points')}</h3>
          </div>
          <p className="text-3xl font-black text-[var(--text-primary)]">{profile?.points || 0}</p>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mt-2 tracking-widest">
            {t('current_discount')}: {profile?.discountLevel || 0}%
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
              <Shield className="text-red-600" size={20} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs text-[var(--text-secondary)]">{t('rank')}</h3>
          </div>
          <p className="text-3xl font-black uppercase tracking-tighter text-[var(--text-primary)]">{profile?.rank ? t(`rank_${profile.rank.toLowerCase().replace(/ /g, '_')}`) : t('rank_recruit')}</p>
          <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-red-600" 
              style={{ width: `${((profile?.points || 0) / (profile?.nextRankThreshold || 1000)) * 100}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
          <h3 className="font-black uppercase tracking-widest text-sm text-[var(--text-primary)]">{t('recent_activity')}</h3>
          <Link to="/shop" className="text-[10px] font-black text-red-600 hover:text-red-500 uppercase tracking-widest">
            {t('gear_up')}
          </Link>
        </div>
        <div className="p-6">
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center border border-[var(--border-color)]">
                      <ShoppingBag className="text-[var(--text-secondary)]" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[var(--text-primary)]">{t('order')} #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-[var(--text-primary)]">€{order.total.toFixed(2)}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-red-600/10 text-red-600'
                    }`}>
                      {t(`status_${order.status.toLowerCase().replace(/ /g, '_')}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto text-zinc-800 mb-4" size={48} />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4">{t('your_arsenal_is_empty')}</p>
              <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
                {t('shop_new_arrivals')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
