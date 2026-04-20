import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/authStore';
import { databaseService } from '../../services/databaseService';
import { UserProfile, Address } from '../../types';

interface AddressBookProps {
  profile: UserProfile | null;
  onRefresh: () => void;
}

export const AddressBook: React.FC<AddressBookProps> = ({ profile, onRefresh }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setLabel('');
    setFullName('');
    setAddress('');
    setCity('');
    setPhone('');
    setIsDefault(false);
    setEditingAddress(null);
  };

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setFullName(addr.fullName);
    setAddress(addr.address);
    setCity(addr.city);
    setPhone(addr.phone);
    setIsDefault(addr.isDefault);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const addressData: Omit<Address, 'id'> = {
        label,
        fullName,
        address,
        city,
        phone,
        isDefault
      };

      if (editingAddress) {
        await databaseService.updateAddress(user.id, { ...addressData, id: editingAddress.id });
      } else {
        await databaseService.addAddress(user.id, addressData);
      }

      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm(t('confirm_delete_address'))) return;
    try {
      await databaseService.deleteAddress(user.id, id);
      onRefresh();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">{t('address_book')}</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('manage_shipping_billing')}</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
        >
          <Plus size={14} /> {t('add_address')}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profile?.addressBook?.map(address => (
          <div key={address.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative group">
            {address.isDefault && (
              <span className="absolute top-4 right-4 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase rounded">{t('default')}</span>
            )}
            <h3 className="font-black uppercase tracking-widest text-xs text-zinc-500 mb-4">{address.label}</h3>
            <div className="space-y-1">
              <p className="font-black text-lg tracking-tighter uppercase">{address.fullName}</p>
              <p className="text-sm text-zinc-400">{address.address}</p>
              <p className="text-sm text-zinc-400">{address.city}</p>
              <p className="text-sm text-zinc-400">{address.phone}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => handleEdit(address)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
              >
                {t('edit')}
              </button>
              <button 
                onClick={() => handleDelete(address.id)}
                className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {(!profile?.addressBook || profile.addressBook.length === 0) && (
          <div className="md:col-span-2 text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{t('no_addresses_found')}</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">
              {editingAddress ? t('edit_address') : t('add_new_address')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('label')} (e.g. Home, Office)</label>
                <input 
                  type="text" 
                  required
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('full_name')}</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('address')}</label>
                <input 
                  type="text" 
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('city')}</label>
                <input 
                  type="text" 
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('phone')}</label>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="isDefault"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-600"
                />
                <label htmlFor="isDefault" className="text-xs font-bold uppercase tracking-widest text-zinc-400 cursor-pointer">
                  {t('set_as_default_address')}
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-700 transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw size={14} className="animate-spin" />}
                  {editingAddress ? t('update_address') : t('save_address')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
