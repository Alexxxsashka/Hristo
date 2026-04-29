import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Category } from '../../types';
import { useShopStore } from '../../store/shopStore';
import { databaseService } from '../../services/databaseService';
import { formatEnum } from '../../utils/format';
import { syncManager } from '../../utils/sync';

export const CategoryForm = ({ 
  initialData, 
  categories, 
  showHelp, 
  onSuccess, 
  onCancel,
  onUpdate,
  onNotify,
  onConfirm 
}: { 
  initialData?: Category | null,
  categories: Category[], 
  showHelp?: boolean, 
  onSuccess: () => void,
  onCancel: () => void,
  onUpdate?: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (message: string, action: () => void) => void
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
  const [newSubcatName, setNewSubcatName] = useState('');

  const saveCategoryStore = useShopStore(state => state.saveCategory);
  const deleteCategoryStore = useShopStore(state => state.deleteCategory);
  const [deletedBlobs, setDeletedBlobs] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      if (initialData.id) {
        setEditingCat(initialData as Category);
      }
      setNewCat(initialData);
    }
  }, [initialData]);

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

  const handleFileUpload = async (file: File) => {
    try {
      if (newCat.image) setDeletedBlobs(prev => [...prev, newCat.image!]);
      const originalName = file.name;
      const safeName = `${Date.now()}_${originalName.replace(/\s+/g, '_')}`;
      const path = `categories/${safeName}`;
      const url = await databaseService.uploadFile(file, path);
      handleFieldChange('image', url);
      onNotify('Image uploaded successfully');
    } catch (err) {
      console.error('Upload failed:', err);
      onNotify('Failed to upload image', 'error');
    }
  };

  const handleFileDelete = async () => {
    if (!newCat.image) return;
    setDeletedBlobs(prev => [...prev, newCat.image!]);
    handleFieldChange('image', '');
    onNotify('Image removed from form (will be deleted on save)');
  };

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
    
    onConfirm(
      editingCat ? 'Are you sure you want to update this category?' : 'Are you sure you want to create this new category?',
      async () => {
        try {
          await saveCategoryStore(newCat as any);
          
          // Cleanup orphaned blobs
          if (deletedBlobs.length > 0) {
            for (const url of deletedBlobs) {
              try { await databaseService.deleteFile(url); } catch (e) {}
            }
          }

          onNotify(editingCat ? 'Category updated' : 'Category added');
          onSuccess();
        } catch (err) {
          console.error('Failed to save category', err);
          onNotify('Failed to save category', 'error');
        }
      }
    );
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

  const handleAddInlineSubcategory = async () => {
    if (!newSubcatName.trim() || !editingCat) return;
    
    try {
      const subCat = {
        name: newSubcatName.trim(),
        parent: editingCat.id,
        id: newSubcatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
      };
      await saveCategoryStore(subCat as any);
      setNewSubcatName('');
      onUpdate?.();
      onNotify('Subcategory added successfully');
    } catch (err) {
      console.error('Failed to add subcategory', err);
      onNotify('Failed to add subcategory', 'error');
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    onConfirm('Are you sure you want to delete this subcategory?', async () => {
      try {
        await deleteCategoryStore(id);
        onUpdate?.();
        onNotify('Subcategory deleted successfully');
      } catch (err) {
        console.error('Failed to delete subcategory', err);
        onNotify('Failed to delete subcategory', 'error');
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
    >
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
          <div className="w-1/3 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Structural Role</label>
            <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
               <button 
                type="button" 
                onClick={() => handleFieldChange('parent', null)}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  !newCat.parent ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                }`}
               >
                 Main
               </button>
               <button 
                type="button" 
                onClick={() => {
                  if (!newCat.parent) {
                    const firstParent = categories.find(c => !c.parent && c.id !== editingCat?.id);
                    handleFieldChange('parent', firstParent?.id || '');
                  }
                }}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  newCat.parent ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                }`}
               >
                 Sub
               </button>
            </div>
          </div>

          <AnimatePresence>
            {newCat.parent !== null && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="w-48 space-y-1 overflow-hidden"
              >
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Parent Category</label>
                <select
                  value={newCat.parent}
                  onChange={e => setNewCat({ ...newCat, parent: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-xs font-bold"
                >
                  {categories.filter(c => !c.parent && c.id !== editingCat?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-24 space-y-1">
            <input
              type="number"
              placeholder="Disc %"
              value={newCat.discount || 0}
              onChange={e => setNewCat({ ...newCat, discount: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-xs font-bold"
              min="0"
              max="100"
            />
          </div>
          <div className="w-1/4 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Category Backdrop</label>
            <div className="relative group h-[52px] bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden transition-all hover:border-zinc-900">
              {newCat.image ? (
                <img 
                  src={newCat.image} 
                  alt="Category" 
                  className="w-full h-full object-cover opacity-80" 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-300">
                  <ImageIcon size={20} />
                </div>
              )}
              <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="p-1.5 bg-white text-zinc-900 rounded-lg cursor-pointer hover:scale-110 transition-transform">
                  <Upload size={14} />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }} 
                  />
                </label>
                {newCat.image && (
                  <button 
                    type="button"
                    onClick={handleFileDelete}
                    className="p-1.5 bg-red-600 text-white rounded-lg hover:scale-110 transition-transform"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Subcategories */}
        {editingCat && !newCat.parent && (
          <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Subcategories</label>
            </div>
            
            <div className="space-y-2">
              {categories.filter(c => c.parent === editingCat.id).map(subCat => (
                <div key={subCat.id} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 overflow-hidden flex items-center justify-center">
                      {subCat.image ? (
                        <img src={subCat.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={14} className="text-zinc-300" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900">{subCat.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{subCat.id}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubcategory(subCat.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {categories.filter(c => c.parent === editingCat.id).length === 0 && (
                <p className="text-center py-2 text-xs text-zinc-400 italic">No subcategories found.</p>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-200">
              <input
                type="text"
                placeholder="New subcategory name..."
                value={newSubcatName}
                onChange={e => setNewSubcatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInlineSubcategory();
                  }
                }}
                className="flex-1 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:border-zinc-900 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddInlineSubcategory}
                disabled={!newSubcatName.trim()}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                Add Sub
              </button>
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
              <Check size={14} />
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
                      value={filter.label || (filter as any).name || ''}
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
                    <X size={16} />
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
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold"
          >
            Cancel
          </button>
          <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold shadow-lg shadow-zinc-900/20">
            {editingCat ? 'Update Category' : 'Add Category'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
