import React, { useState, useEffect } from 'react';
import { Coupon, Product, Category } from '../../types';
import { databaseService } from '../../services/databaseService';
import { 
  Plus, Search, Edit2, Trash2, Tag, Calendar, 
  CheckCircle, XCircle, Save, X,
  Percent, Euro, Ticket, Filter, Layers, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, catRes] = await Promise.all([
        databaseService.getCoupons(),
        databaseService.getProducts(),
        databaseService.getCategories()
      ]);
      setCoupons(cRes);
      setProducts(pRes);
      setCategories(catRes);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!editingCoupon?.code?.trim()) errors.code = 'Coupon code is required / Kod kupona je obavezan';
    if (!editingCoupon?.value || editingCoupon.value <= 0) errors.value = 'Value must be greater than 0 / Vrijednost mora biti veća od 0';
    if (editingCoupon?.type === 'percent' && editingCoupon.value > 100) errors.value = 'Percentage cannot exceed 100% / Postotak ne može biti veći od 100%';
    
    if (editingCoupon?.categoryId && editingCoupon?.productId) {
      errors.binding = 'Select either Category OR Product, not both / Odaberite Kategoriju ILI Proizvod, ne oboje';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await databaseService.saveCoupon(editingCoupon);
      setShowModal(false);
      setEditingCoupon(null);
      setFieldErrors({});
      fetchData();
    } catch (err) {
      console.error('Save failed:', err);
      setFieldErrors({ submit: 'Database error / Greška u bazi podataka' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await databaseService.deleteCoupon(id);
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete coupon');
    }
  };

  const isExpired = (date: string | null | undefined) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white p-6 rounded-[24px] border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 border border-zinc-200">
              <Ticket size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900">
                Promo Campaigns
              </h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                Manage discounts & special offers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-3 bg-zinc-100 text-zinc-600 rounded-2xl hover:bg-zinc-200 transition-all border border-zinc-200"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => {
                setEditingCoupon({
                  code: '',
                  type: 'percent',
                  value: 0,
                  active: true,
                  minOrderAmount: 0,
                  expiresAt: null
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-900/20"
            >
              <Plus size={18} />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              placeholder="Search by coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <select className="pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none font-bold text-xs uppercase tracking-widest min-w-[160px]">
                <option>All Status</option>
                <option>Active</option>
                <option>Expired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-zinc-50 rounded-[24px] animate-pulse border border-zinc-200" />
            ))
          ) : filteredCoupons.map(coupon => (
            <motion.div 
              key={coupon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-white border border-zinc-200 rounded-[24px] p-6 hover:border-zinc-900 transition-all shadow-sm hover:shadow-xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-2xl border ${coupon.active && !isExpired(coupon.expiresAt) ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                  <Tag size={24} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      setEditingCoupon(coupon);
                      setShowModal(true);
                    }}
                    className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-xl transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(coupon.id)}
                    className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-zinc-900 tracking-tighter uppercase">{coupon.code}</span>
                  {coupon.active && !isExpired(coupon.expiresAt) ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-zinc-200">
                      {isExpired(coupon.expiresAt) ? 'Expired' : 'Disabled'}
                    </span>
                  )}
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-900 font-mono">
                    {coupon.type === 'percent' ? `${coupon.value}%` : `€${coupon.value}`}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Discount</span>
                </div>

                <div className="space-y-2">
                  {coupon.minOrderAmount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                      Min Order: €{coupon.minOrderAmount}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                    Applies to: {coupon.productId ? 'Selected Product' : coupon.categoryId ? 'Selected Category' : 'All Products'}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-zinc-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <Calendar size={12} />
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'No Expiry'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-zinc-200"
            >
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">
                    {editingCoupon?.id ? 'Edit Coupon' : 'New Promo Campaign'}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Configure your discount parameters</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-zinc-100 rounded-2xl text-zinc-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Coupon Code</label>
                    <input 
                      required
                      type="text"
                      value={editingCoupon?.code || ''}
                      onChange={(e) => {
                        setEditingCoupon({ ...editingCoupon!, code: e.target.value.toUpperCase() });
                        if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
                      }}
                      placeholder="WINTER2026"
                      className={`w-full px-5 py-3 bg-zinc-50 border rounded-2xl text-zinc-900 font-bold uppercase tracking-widest focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${fieldErrors.code ? 'border-red-500' : 'border-zinc-200'}`}
                    />
                    {fieldErrors.code && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-widest">{fieldErrors.code}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Discount Type</label>
                    <div className="flex p-1 bg-zinc-50 rounded-2xl border border-zinc-200">
                      <button 
                        type="button"
                        onClick={() => setEditingCoupon({ ...editingCoupon!, type: 'percent' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingCoupon?.type === 'percent' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-400'}`}
                      >
                        <Percent size={14} /> Percentage
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingCoupon({ ...editingCoupon!, type: 'fixed' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingCoupon?.type === 'fixed' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-400'}`}
                      >
                        <Euro size={14} /> Fixed Amount
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Value</label>
                    <input 
                      required
                      type="number"
                      value={editingCoupon?.value || ''}
                      onChange={(e) => {
                        setEditingCoupon({ ...editingCoupon!, value: parseFloat(e.target.value) });
                        if (fieldErrors.value) setFieldErrors(prev => ({ ...prev, value: '' }));
                      }}
                      className={`w-full px-5 py-3 bg-zinc-50 border rounded-2xl text-zinc-900 font-mono font-bold focus:ring-2 focus:ring-zinc-900 outline-none transition-all ${fieldErrors.value ? 'border-red-500' : 'border-zinc-200'}`}
                    />
                    {fieldErrors.value && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-widest">{fieldErrors.value}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Min Order (€)</label>
                    <input 
                      type="number"
                      value={editingCoupon?.minOrderAmount || 0}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon!, minOrderAmount: parseFloat(e.target.value) })}
                      className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-mono font-bold focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Status</label>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon!, active: !editingCoupon?.active })}
                      className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${editingCoupon?.active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}
                    >
                      {editingCoupon?.active ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                      <Layers size={14} /> Category Binding
                    </label>
                    <select 
                      value={editingCoupon?.categoryId || ''}
                      onChange={(e) => {
                        setEditingCoupon({ ...editingCoupon!, categoryId: e.target.value || undefined });
                        if (fieldErrors.binding) setFieldErrors(prev => ({ ...prev, binding: '' }));
                      }}
                      className={`w-full px-5 py-3 bg-zinc-50 border rounded-2xl text-zinc-900 font-bold text-xs uppercase tracking-widest focus:ring-2 focus:ring-zinc-900 outline-none transition-all appearance-none ${fieldErrors.binding ? 'border-red-500' : 'border-zinc-200'}`}
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                      <Tag size={14} /> Product Binding
                    </label>
                    <select 
                      value={editingCoupon?.productId || ''}
                      onChange={(e) => {
                        setEditingCoupon({ ...editingCoupon!, productId: e.target.value || undefined });
                        if (fieldErrors.binding) setFieldErrors(prev => ({ ...prev, binding: '' }));
                      }}
                      className={`w-full px-5 py-3 bg-zinc-50 border rounded-2xl text-zinc-900 font-bold text-xs uppercase tracking-widest focus:ring-2 focus:ring-zinc-900 outline-none transition-all appearance-none ${fieldErrors.binding ? 'border-red-500' : 'border-zinc-200'}`}
                    >
                      <option value="">All Products</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  {fieldErrors.binding && <div className="col-span-2 text-center text-[10px] text-red-500 font-black uppercase tracking-widest">{fieldErrors.binding}</div>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Expiration Date</label>
                    <button 
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon!, expiresAt: editingCoupon?.expiresAt ? null : new Date().toISOString().split('T')[0] })}
                      className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      {editingCoupon?.expiresAt ? 'Set Perpetual' : 'Set Specific Date'}
                    </button>
                  </div>
                  <input 
                    disabled={!editingCoupon?.expiresAt}
                    type="date"
                    value={editingCoupon?.expiresAt?.split('T')[0] || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon!, expiresAt: e.target.value })}
                    className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-zinc-900 outline-none transition-all disabled:opacity-30"
                  />
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  {fieldErrors.submit && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold text-center">{fieldErrors.submit}</div>}
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-4 bg-zinc-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-900/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                      {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                      {editingCoupon?.id ? 'Update Campaign' : 'Create Campaign'}
                    </button>
                  </div>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
