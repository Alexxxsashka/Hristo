import React from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Category } from '../../types';
import { databaseService } from '../../services/databaseService';

export const CategoryManager = ({ 
  categories, 
  onUpdate, 
  onNotify, 
  onConfirm,
  onAddCategory,
  onEditCategory
}: { 
  categories: Category[], 
  onUpdate: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void,
  onAddCategory: () => void,
  onEditCategory: (cat: Category) => void
}) => {

  const handleDelete = async (id: string) => {
    onConfirm('Delete this category?', async () => {
      try {
        await databaseService.deleteCategory(id);
        onUpdate();
        onNotify('Category deleted successfully');
      } catch (err) {
        console.error('Failed to delete category', err);
        onNotify('Failed to delete category', 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-zinc-200">
        <div>
          <h3 className="text-lg font-bold">Categories</h3>
          <p className="text-xs text-zinc-400">Manage your product organization</p>
        </div>
        <button
          onClick={onAddCategory}
          className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-900/20"
        >
          <Plus size={18} />
          ADD CATEGORY
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-700">Name</th>
              <th className="px-6 py-4 font-semibold text-zinc-700">Parent</th>
              <th className="px-6 py-4 font-semibold text-zinc-700">Discount</th>
              <th className="px-6 py-4 font-semibold text-zinc-700">Slots / Modules</th>
              <th className="px-6 py-4 font-semibold text-zinc-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900">{cat.name}</div>
                  <div className="text-[10px] font-mono text-zinc-400">{cat.id}</div>
                </td>
                <td className="px-6 py-4 text-zinc-500 font-medium">{cat.parent || '-'}</td>
                <td className="px-6 py-4">
                  {cat.discount ? (
                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                      -{cat.discount}%
                    </span>
                  ) : (
                    <span className="text-zinc-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Slots: {cat.slots?.length || 0}</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Modules: {cat.compatibleModuleCategories?.length || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEditCategory(cat)} 
                      className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium">
                  No categories found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
