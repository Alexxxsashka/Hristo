import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, X, Check } from 'lucide-react';
import { Category } from '../../types';
import { databaseService } from '../../services/databaseService';
import { WEAPON_SLOTS, MODULE_CATEGORIES } from '../../constants';
import { formatEnum } from '../../utils/format';

export const CategoryManager = ({ categories, showHelp, onUpdate, onNotify, onConfirm }: { 
  categories: Category[], 
  showHelp?: boolean, 
  onUpdate: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void
}) => {
  const [newCat, setNewCat] = useState<Partial<Category>>({ 
    name: '', 
    parent: '', 
    slots: [], 
    compatibleModuleCategories: [],
    filters: []
  });
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'name':
        if (!value?.trim()) {
          error = 'Category name is required';
        } else if (value.length < 2) {
          error = 'Category name must be at least 2 characters';
        } else if (value.length > 100) {
          error = 'Category name must be less than 100 characters';
        }
        break;
    }
    return error;
  };

  const handleFieldChange = (field: string, value: any) => {
    setNewCat(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  // SCORCHED EARTH: Forcibly remove 'required' 
  useEffect(() => {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => input.removeAttribute('required'));
  }, [newCat.name]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    const errors: Record<string, string> = {};
    Object.keys(newCat).forEach(key => {
      const error = validateField(key, newCat[key as keyof Category]);
      if (error) errors[key] = error;
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      onNotify('Please fix the validation errors before submitting', 'error');
      return;
    }
    
    try {
      const categoryToSave = {
        ...newCat,
        id: editingCat ? editingCat.id : newCat.name?.toLowerCase().replace(/\s+/g, '_')
      };
      
      await databaseService.saveCategory(categoryToSave as any);
      setNewCat({ name: '', parent: '', slots: [], compatibleModuleCategories: [], filters: [] });
      setEditingCat(null);
      onUpdate();
      onNotify(editingCat ? 'Category updated successfully' : 'Category added successfully');
    } catch (err) {
      console.error('Failed to save category', err);
      onNotify('Failed to save category', 'error');
    }
  };

  const addFilter = () => {
    const filters = [...(newCat.filters || [])];
    filters.push({ id: `filter_${Date.now()}`, label: '', type: 'select', options: [] });
    setNewCat({ ...newCat, filters });
  };

  const removeFilter = (index: number) => {
    const filters = [...(newCat.filters || [])];
    filters.splice(index, 1);
    setNewCat({ ...newCat, filters });
  };

  const updateFilter = (index: number, field: string, value: any) => {
    const filters = [...(newCat.filters || [])];
    filters[index] = { ...filters[index], [field]: value };
    setNewCat({ ...newCat, filters });
  };

  const addOption = (filterIndex: number) => {
    const filters = [...(newCat.filters || [])];
    const options = [...(filters[filterIndex].options || [])];
    options.push('');
    filters[filterIndex] = { ...filters[filterIndex], options };
    setNewCat({ ...newCat, filters });
  };

  const updateOption = (filterIndex: number, optionIndex: number, value: string) => {
    const filters = [...(newCat.filters || [])];
    const options = [...(filters[filterIndex].options || [])];
    options[optionIndex] = value;
    filters[filterIndex] = { ...filters[filterIndex], options };
    setNewCat({ ...newCat, filters });
  };

  const removeOption = (filterIndex: number, optionIndex: number) => {
    const filters = [...(newCat.filters || [])];
    const options = [...(filters[filterIndex].options || [])];
    options.splice(optionIndex, 1);
    filters[filterIndex] = { ...filters[filterIndex], options };
    setNewCat({ ...newCat, filters });
  };

  const toggleSlot = (slot: string) => {
    const currentSlots = newCat.slots || [];
    const newSlots = currentSlots.includes(slot)
      ? currentSlots.filter(s => s !== slot)
      : [...currentSlots, slot];
    setNewCat({ ...newCat, slots: newSlots });
  };

  const toggleModuleCat = (cat: string) => {
    const currentCats = newCat.compatibleModuleCategories || [];
    const newCats = currentCats.includes(cat)
      ? currentCats.filter(c => c !== cat)
      : [...currentCats, cat];
    setNewCat({ ...newCat, compatibleModuleCategories: newCats });
  };

  const startEdit = (cat: Category) => {
    setEditingCat(cat);
    setNewCat(cat);
  };

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
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">{editingCat ? 'Edit Category' : 'Add New Category'}</h3>
          {showHelp && (
            <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">
              Categories help organize your products and define 3D behavior
            </div>
          )}
        </div>
        <form 
          noValidate 
          onSubmit={handleAdd} 
          onInvalid={(e) => e.preventDefault()}
          className="space-y-6"
        >
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder="Category Name"
                value={newCat.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none ${
                  fieldErrors.name ? 'border-red-500' : 'border-zinc-200'
                }`}
                maxLength={100}
              />
              <AnimatePresence>
                {fieldErrors.name && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-[11px] font-medium flex items-center gap-1"
                  >
                    <X size={12} />
                    {fieldErrors.name}
                  </motion.p>
                )}
              </AnimatePresence>
              {showHelp && <p className="text-[10px] text-zinc-400 font-medium px-1">Visible name of the category.</p>}
            </div>
            <div className="w-48 space-y-1">
              <select
                value={newCat.parent || ''}
                onChange={e => setNewCat({ ...newCat, parent: e.target.value || null })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
              >
                <option value="">No Parent</option>
                {categories.filter(c => !c.parent && c.id !== editingCat?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {showHelp && <p className="text-[10px] text-zinc-400 font-medium px-1">Main category (optional).</p>}
            </div>
            <div className="w-32 space-y-1">
              <input
                type="number"
                placeholder="Disc %"
                value={newCat.discount || 0}
                onChange={e => setNewCat({ ...newCat, discount: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                min="0"
                max="100"
              />
              {showHelp && <p className="text-[10px] text-zinc-400 font-medium px-1">Category discount.</p>}
            </div>
          </div>

          {/* Weapon Specific Settings */}
          {(newCat.id === 'weapons' || 
            newCat.parent === 'weapons' || 
            newCat.name?.toLowerCase().includes('weapon') ||
            categories.find(c => c.id === newCat.parent)?.name.toLowerCase().includes('weapon')
          ) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Weapon Slots</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-zinc-200">
                  {WEAPON_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        newCat.slots?.includes(slot)
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                      }`}
                    >
                      {formatEnum(slot)}
                      {newCat.slots?.includes(slot) && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Compatible Module Categories</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-zinc-200">
                  {MODULE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleModuleCat(cat)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        newCat.compatibleModuleCategories?.includes(cat)
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                      }`}
                    >
                      {formatEnum(cat)}
                      {newCat.compatibleModuleCategories?.includes(cat) && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category Filters */}
          <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category-Specific Filters</label>
              <button 
                type="button" 
                onClick={addFilter}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 transition-all"
              >
                <Plus size={14} />
                Add Filter
              </button>
            </div>

            <div className="space-y-4">
              {newCat.filters?.map((filter, fIndex) => (
                <div key={filter.id} className="p-4 bg-white border border-zinc-200 rounded-xl space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Filter Label (e.g. Color)"
                        value={filter.label}
                        onChange={e => updateFilter(fIndex, 'label', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="w-32">
                      <select
                        value={filter.type}
                        onChange={e => updateFilter(fIndex, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                      >
                        <option value="select">Select</option>
                        <option value="range">Range</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFilter(fIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {filter.type === 'select' && (
                    <div className="space-y-2 pl-4 border-l-2 border-zinc-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Options</span>
                        <button 
                          type="button" 
                          onClick={() => addOption(fIndex)}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {filter.options?.map((opt, oIndex) => (
                          <div key={oIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={e => updateOption(fIndex, oIndex, e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                              placeholder="Option value"
                            />
                            <button 
                              type="button" 
                              onClick={() => removeOption(fIndex, oIndex)}
                              className="p-1.5 text-zinc-400 hover:text-red-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!newCat.filters || newCat.filters.length === 0) && (
                <p className="text-center py-4 text-xs text-zinc-400 italic">No custom filters defined for this category.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            {editingCat && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingCat(null);
                  setNewCat({ name: '', parent: '', slots: [], compatibleModuleCategories: [] });
                }}
                className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold shadow-lg shadow-zinc-900/20">
              {editingCat ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Parent</th>
              <th className="px-6 py-4 font-semibold">Discount</th>
              <th className="px-6 py-4 font-semibold">Slots / Modules</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 font-medium">{cat.name}</td>
                <td className="px-6 py-4 text-zinc-500">{cat.parent || '-'}</td>
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
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Slots: {cat.slots?.length || 0}</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Modules: {cat.compatibleModuleCategories?.length || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(cat)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
