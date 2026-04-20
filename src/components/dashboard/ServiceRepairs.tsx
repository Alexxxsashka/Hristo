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
          <h2 className="text-3xl font-black tracking-tighter uppercase">{t('service_and_repairs')}</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('track_weapon_upgrades')}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-all"
        >
          <Plus size={14} /> {t('request_service')}
        </button>
      </header>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
                    <Wrench className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-lg">{request.weaponName}</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('ticket')} #{request.id.toUpperCase()}</p>
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
                      <div className="w-px bg-zinc-800 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-600" />
                      </div>
                      <div className="pb-4">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{update.date}</p>
                        <p className="text-sm text-zinc-300">{update.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center">
          <Wrench className="mx-auto text-zinc-800 mb-4" size={64} />
          <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{t('no_active_service_tickets')}</h3>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-6">{t('need_upgrade_repair')}</p>
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
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md"
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">{t('request_service')}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('weapon_name')}</label>
                  <input 
                    required
                    type="text" 
                    value={weaponName}
                    onChange={e => setWeaponName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('service_description')}</label>
                  <textarea 
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-700 transition-all"
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
