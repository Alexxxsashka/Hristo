import React from 'react';
import { Plus, Trash2, Edit, ChevronRight, Layers, LayoutGrid } from 'lucide-react';
import { Category } from '../../types';
import { databaseService } from '../../services/databaseService';
import { useShopStore } from '../../store/shopStore';
import { syncManager } from '../../utils/sync';

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
  onAddCategory: (parentId?: string) => void,
  onEditCategory: (cat: Category) => void
}) => {

  const deleteCategory = useShopStore(state => state.deleteCategory);

  const handleDelete = async (id: string) => {
    onConfirm('Delete this category?', async () => {
      try {
        await deleteCategory(id);
        onUpdate();
        onNotify('Category deleted successfully');
      } catch (err) {
        console.error('Failed to delete category', err);
        onNotify('Failed to delete category', 'error');
      }
    });
  };

  const mainCategories = categories.filter(c => !c.parent);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent === parentId);

  const CategoryRow = ({ cat, level = 0 }: { cat: Category, level?: number }) => (
    <tr key={cat.id} className={`${level > 0 ? 'bg-[var(--bg-primary)]/30' : ''} hover:bg-[var(--bg-primary)] transition-colors`}>
      <td className="px-6 py-4">
        <div className={`flex items-center gap-4 ${level > 0 ? 'ml-12' : ''}`}>
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden flex-shrink-0 ${level > 0 ? 'scale-90' : ''}`}>
              {cat.image ? (
                <img src={cat.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]/30">
                  {level === 0 ? <LayoutGrid size={18} /> : <Layers size={14} />}
                </div>
              )}
            </div>
            {level > 0 && (
              <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                <ChevronRight size={14} className="text-[var(--text-secondary)]/30" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`font-bold ${level === 0 ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {cat.name}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                level === 0 ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
              }`}>
                {level === 0 ? 'Main' : 'Sub'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60">{cat.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {cat.parent ? (
          <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium text-xs">
            <LayoutGrid size={12} className="opacity-50" />
            {categories.find(c => c.id === cat.parent)?.name}
          </div>
        ) : (
          <span className="text-[var(--text-secondary)] opacity-30 italic text-[10px] uppercase font-bold tracking-widest">Root</span>
        )}
      </td>
      <td className="px-6 py-4">
        {cat.discount ? (
          <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
            -{cat.discount}%
          </span>
        ) : (
          <span className="text-[var(--text-secondary)] opacity-40 text-xs">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {!cat.parent && (
            <button
              onClick={() => onAddCategory(cat.id)}
              title="Add Subcategory"
              className="p-2 text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} />
            </button>
          )}
          <button 
            onClick={() => onEditCategory(cat)} 
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-color)] rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={() => handleDelete(cat.id)} 
            className="p-2 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-600/10 border border-transparent hover:border-red-600/20 rounded-xl transition-all active:scale-95"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 bg-[var(--bg-secondary)] p-6 rounded-[32px] border border-[var(--border-color)] shadow-xl shadow-black/5">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)] leading-none">Catalog Hierarchy</h3>
          <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] mt-1">Structural Category Management Pool</p>
        </div>
        <button
          onClick={() => onAddCategory()}
          className="group relative flex items-center gap-3 px-8 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-[#ab1017] hover:text-white active:scale-95 shadow-xl shadow-black/20"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Create New Class
        </button>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-[32px] border border-[var(--border-color)] overflow-hidden shadow-2xl shadow-black/5">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Structural Units</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Parentage</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Margin Disc.</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] text-right">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {mainCategories.map(mainCat => (
              <React.Fragment key={mainCat.id}>
                <CategoryRow cat={mainCat} />
                {getSubcategories(mainCat.id).map(subCat => (
                  <CategoryRow key={subCat.id} cat={subCat} level={1} />
                ))}
              </React.Fragment>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-[var(--text-secondary)]/20">
                    <Layers size={64} />
                    <p className="text-sm font-bold uppercase tracking-widest">No structural registry found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
