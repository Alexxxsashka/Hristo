import React, { useState, useEffect } from 'react';
import { Coupon, Product, Category } from '../../types';
import { databaseService } from '../../services/databaseService';
import { 
  Plus, Search, Edit2, Trash2, Tag, Calendar, 
  CheckCircle, XCircle, AlertCircle, Save, X,
  Percent, Euro
} from 'lucide-react';

export const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      await databaseService.saveCoupon(editingCoupon);
      setShowModal(false);
      setEditingCoupon(null);
      fetchData();
    } catch (err) {
      alert('Ошибка при сохранении промокода');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот промокоды?')) return;
    try {
      await databaseService.deleteCoupon(id);
      fetchData();
    } catch (err) {
      alert('Ошибка при удалении');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-400" />
            Управление Промокодами
          </h2>
          <p className="text-gray-400 text-sm">Создавайте скидки для товаров и категорий</p>
        </div>
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          Добавить Промокод
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text"
          placeholder="Поиск по коду..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-900/50 rounded-2xl animate-pulse border border-gray-800" />
          ))
        ) : filteredCoupons.map(coupon => (
          <div key={coupon.id} className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-900/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Tag className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingCoupon(coupon);
                    setShowModal(true);
                  }}
                  className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(coupon.id)}
                  className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white tracking-wider">{coupon.code}</span>
                {coupon.active && !isExpired(coupon.expiresAt) ? (
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] uppercase font-bold rounded-full border border-green-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Активен
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] uppercase font-bold rounded-full border border-red-500/20 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {isExpired(coupon.expiresAt) ? 'Истек' : 'Отключен'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="text-gray-400">
                  Скидка: <span className="text-white font-semibold">
                    {coupon.type === 'percent' ? `${coupon.value}%` : `€${coupon.value}`}
                  </span>
                </div>
                {coupon.minOrderAmount > 0 && (
                  <div className="text-gray-400">
                    От: <span className="text-white font-semibold">€${coupon.minOrderAmount}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {coupon.productId && (
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-md border border-purple-500/20">
                    Товар: {products.find(p => p.id === coupon.productId)?.name || 'Неизвестен'}
                  </span>
                )}
                {coupon.categoryId && (
                  <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-md border border-amber-500/20">
                    Категория: {categories.find(c => c.id === coupon.categoryId)?.name || 'Неизвестна'}
                  </span>
                )}
                {!coupon.productId && !coupon.categoryId && (
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-md border border-blue-500/20">
                    На все товары
                  </span>
                )}
              </div>

              <div className="pt-4 flex items-center gap-2 text-xs text-gray-500 border-t border-gray-800">
                <Calendar className="w-3 h-3" />
                <span>Истекает: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Бессрочно'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-800/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                {editingCoupon?.id ? 'Редактировать Промокод' : 'Новый Промокод'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Код (Заглавные буквы)</label>
                  <input 
                    required
                    type="text"
                    value={editingCoupon?.code}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon!, code: e.target.value.toUpperCase() })}
                    placeholder="WINTER2026"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Тип скидки</label>
                  <div className="flex p-1 bg-gray-800 rounded-xl border border-gray-700">
                    <button 
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon!, type: 'percent' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm transition-all ${editingCoupon?.type === 'percent' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Percent className="w-4 h-4" /> %
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon!, type: 'fixed' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm transition-all ${editingCoupon?.type === 'fixed' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Euro className="w-4 h-4" /> Фикс
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Значение</label>
                  <input 
                    required
                    type="number"
                    value={editingCoupon?.value}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon!, value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Минимальная сумма заказа (€)</label>
                <input 
                  type="number"
                  value={editingCoupon?.minOrderAmount}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon!, minOrderAmount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Категория (Опционально)</label>
                  <select 
                    value={editingCoupon?.categoryId || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon!, categoryId: e.target.value || undefined })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все категории</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Товар (Опционально)</label>
                  <select 
                    value={editingCoupon?.productId || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon!, productId: e.target.value || undefined })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Все товары</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-400">Дата истечения</label>
                  <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!editingCoupon?.expiresAt}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon!, expiresAt: e.target.checked ? null : new Date().toISOString().split('T')[0] })}
                      className="rounded border-gray-700 bg-gray-800 text-blue-600"
                    />
                    Бессрочный
                  </label>
                </div>
                <input 
                  disabled={!editingCoupon?.expiresAt}
                  type="date"
                  value={editingCoupon?.expiresAt?.split('T')[0] || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon!, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingCoupon?.active}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon!, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-300">Активен</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
