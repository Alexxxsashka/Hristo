import React from 'react';
import { Plus, Trash2, Edit, ChevronRight, Layers, LayoutGrid } from 'lucide-react';
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
  onAddCategory: (parentId?: string) => void,
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

  const mainCategories = categories.filter(c => !c.parent);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent === parentId);

  const CategoryRow = ({ cat, level = 0 }: { cat: Category, level?: number }) => (
    <tr key={cat.id} className={`${level > 0 ? 'bg-zinc-50/30' : ''} hover:bg-zinc-50 transition-colors`}>
      <td className="px-6 py-4">
        <div className={`flex items-center gap-4 ${level > 0 ? 'ml-12' : ''}`}>
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden flex-shrink-0 ${level > 0 ? 'scale-90' : ''}`}>
              {cat.image ? (
                <img src={cat.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                  {level === 0 ? <LayoutGrid size={18} /> : <Layers size={14} />}
                </div>
              )}
            </div>
            {level > 0 && (
              <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                <ChevronRight size={14} className="text-zinc-300" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={`font-bold ${level === 0 ? 'text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-600'}`}>
                {cat.name}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                level === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'
              }`}>
                {level === 0 ? 'Main' : 'Sub'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">{cat.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {cat.parent ? (
          <div className="flex items-center gap-2 text-zinc-500 font-medium text-xs">
            <LayoutGrid size={12} className="opacity-50" />
            {categories.find(c => c.id === cat.parent)?.name}
          </div>
        ) : (
          <span className="text-zinc-300 italic text-[10px] uppercase font-bold tracking-widest">Root</span>
        )}
      </td>
      <td className="px-6 py-4">
        {cat.discount ? (
          <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
            -{cat.discount}%
          </span>
        ) : (
          <span className="text-zinc-400 text-xs">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {!cat.parent && (
            <button
              onClick={() => onAddCategory(cat.id)}
              title="Add Subcategory"
              className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} />
            </button>
          )}
          <button 
            onClick={() => onEditCategory(cat)} 
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={() => handleDelete(cat.id)} 
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all active:scale-95"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-[32px] border border-zinc-200 shadow-xl shadow-zinc-900/5">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 leading-none">Catalog Hierarchy</h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1">Structural Category Management Pool</p>
        </div>
        <button
          onClick={() => onAddCategory()}
          className="group relative flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-red-600 active:scale-95 shadow-xl shadow-zinc-900/20"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Create New Class
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-200 overflow-hidden shadow-2xl shadow-zinc-900/5">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Structural Units</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Parentage</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Margin Disc.</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
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
                  <div className="flex flex-col items-center gap-4 text-zinc-300">
                    <Layers size={64} className="opacity-10" />
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
