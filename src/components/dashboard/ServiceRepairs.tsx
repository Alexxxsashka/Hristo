import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/authStore';
import { databaseService } from '../../services/databaseService';
import { ServiceRequest } from '../../types';

interface ServiceRepairsProps {
  requests: ServiceRequest[];
  onRefresh: () => void;
}

export const ServiceRepairs: React.FC<ServiceRepairsProps> = ({ requests, onRefresh }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [weaponName, setWeaponName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await databaseService.createServiceRequest({
        userId: user.id,
        weaponName,
        description,
        status: 'Pending',
        date: new Date().toLocaleDateString(),
        updates: []
      });
      setShowModal(false);
      setWeaponName('');
      setDescription('');
      onRefresh();
    } catch (error) {
      console.error('Error creating service request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">{t('service_and_repairs')}</h2>
          <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-1">{t('track_weapon_upgrades')}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-black uppercase tracking-widest text-[10px] rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-all shadow-sm"
        >
          <Plus size={14} /> {t('request_service')}
        </button>
      </header>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center border border-[var(--border-color)]">
                    <Wrench className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-lg text-[var(--text-primary)]">{request.weaponName}</h3>
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{t('ticket')} #{request.id.toUpperCase()}</p>
                  </div>
                </div>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                  request.status === 'Ready for Pickup' ? 'bg-green-500/10 text-green-500' : 'bg-red-600/10 text-red-600'
                }`}>
                  {t(`status_${request.status.toLowerCase().replace(/ /g, '_')}`)}
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {request.updates.map((update, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-px bg-[var(--border-color)] relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                      </div>
                      <div className="pb-4">
                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">{update.date}</p>
                        <p className="text-sm text-[var(--text-primary)] font-medium">{update.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-12 text-center shadow-sm">
          <Wrench className="mx-auto text-[var(--text-secondary)] opacity-20 mb-4" size={64} />
          <h3 className="text-xl font-black uppercase tracking-tighter mb-2 text-[var(--text-primary)]">{t('no_active_service_tickets')}</h3>
          <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs mb-6">{t('need_upgrade_repair')}</p>
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
          >
            {t('open_service_ticket')}
          </button>
        </div>
      )}

      {/* Service Request Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 text-[var(--text-primary)]">{t('request_service')}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('weapon_name')}</label>
                  <input 
                    required
                    type="text" 
                    value={weaponName}
                    onChange={e => setWeaponName(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('service_description')}</label>
                  <textarea 
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-600 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[var(--bg-secondary)] transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading && <RefreshCw size={14} className="animate-spin" />}
                    {t('submit_request')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
