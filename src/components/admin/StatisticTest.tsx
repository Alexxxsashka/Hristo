import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseService } from '../../services/databaseService';
import { Package, TrendingUp, BarChart3, Euro, ShieldAlert } from 'lucide-react';

export const StatisticTest = ({ onNotify }: { onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await databaseService.getTestStats();
      setStats(data);
    } catch (err) {
      onNotify('Failed to load DB stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.total_products || 0,
      icon: <Package className="text-blue-500" />,
      desc: 'Count of active items in DB'
    },
    {
      title: 'Stock Units',
      value: stats?.total_stock || 0,
      icon: <BarChart3 className="text-emerald-500" />,
      desc: 'Sum of all inventory pieces'
    },
    {
      title: 'Avg Price',
      value: `${stats?.avg_price || 0} €`,
      icon: <Euro className="text-amber-500" />,
      desc: 'Average selling price'
    },
    {
      title: 'Inventory Value',
      value: `${stats?.total_value || 0} €`,
      icon: <TrendingUp className="text-purple-500" />,
      desc: 'Total warehouse capitalization'
    },
    {
      title: 'Potential Profit',
      value: `${stats?.potential_profit || 0} €`,
      icon: <Euro className="text-red-500" />,
      desc: 'Based on price - landing_cost'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900">Statistic_test (DB Aggregation)</h3>
            <p className="text-zinc-500 mt-1">Calculated in real-time via SQL aggregate queries</p>
          </div>
          <button 
            onClick={fetchStats}
            className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
          >
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-zinc-100">
                  {card.icon}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{card.title}</h4>
                <p className="text-3xl font-black text-zinc-900 mt-1">{card.value}</p>
                <p className="text-xs text-zinc-500 mt-2 font-medium">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-4">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900">SQL Calculation Logic</h4>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            This data is not cached. Each request triggers a <code>SELECT SUM(), AVG(), COUNT()</code> call 
            directly to the PostgreSQL server, ensuring 100% accurate financial reporting.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
