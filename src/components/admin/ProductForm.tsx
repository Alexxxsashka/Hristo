import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Save, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { databaseService } from '../../services/databaseService';
import { Product, Category, Characteristic, ProductVariant, ProductAttribute } from '../../types';
import { WEAPON_SLOTS } from '../../constants';
import { formatEnum, formatModelName } from '../../utils/format';

export const ProductForm = ({ initialData, categories, weapons, showHelp, onSuccess, onCancel, onNotify }: { 
  initialData: Product | null, 
  categories: Category[],
  weapons: Product[],
  showHelp?: boolean,
  onSuccess: () => void,
  onCancel: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Product>>(initialData || {
    name: '',
    description: '',
    type: 'weapon',
    category: '',
    subcategory: '',
    brand: '',
    model: '',
    sku: '',
    barcode: '',
    price: 0,
    landingCost: 0,
    msrp: 0,
    currency: 'EUR',
    stock: 0,
    minStockLevel: 0,
    tags: [],
    uid: '',
    model3D: '',
    model3DName: '',
    has3D: false,
    meshName: '',
    socketPoint: [0, 0, 0],
    slots: [],
    compatibleModuleCategories: [],
    attachmentSlot: '',
    compatibleWeapons: [],
    characteristics: []
  });
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [combinedImages, setCombinedImages] = useState<(string | File)[]>(() => {
    const existingImages = initialData?.images || [];
    const mainImage = initialData?.image;
    if (mainImage && !existingImages.includes(mainImage)) {
      return [mainImage, ...existingImages];
    }
    return existingImages;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState('');
  const [newCompatibleWeapon, setNewCompatibleWeapon] = useState('');
  const [newCompatibleCategory, setNewCompatibleCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newChar, setNewChar] = useState<Characteristic>({ emoji: '🎯', label: '', value: '' });
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeOptions, setNewAttributeOptions] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'name':
        if (!value?.trim()) {
          error = 'Product name is required';
        } else if (value.length < 2) {
          error = 'Product name must be at least 2 characters';
        } else if (value.length > 255) {
          error = 'Product name must be less than 255 characters';
        }
        break;
      case 'description':
        if (!value?.trim()) {
          error = 'Description is required';
        } else if (value.length < 10) {
          error = 'Description must be at least 10 characters';
        } else if (value.length > 2000) {
          error = 'Description must be less than 2000 characters';
        }
        break;
      case 'sku':
        if (value && value.length > 50) {
          error = 'SKU must be less than 50 characters';
        }
        break;
      case 'barcode':
        if (value && !/^[0-9]{8,18}$/.test(value)) {
          error = 'Barcode must be 8-18 digits';
        }
        break;
      case 'price':
        if (value < 0) {
          error = 'Price cannot be negative';
        } else if (value > 999999.99) {
          error = 'Price cannot exceed 999,999.99';
        }
        break;
      case 'stock':
        if (value < 0) {
          error = 'Stock cannot be negative';
        } else if (value > 999999) {
          error = 'Stock cannot exceed 999,999';
        }
        break;
      case 'brand':
        if (value && value.length > 100) {
          error = 'Brand must be less than 100 characters';
        }
        break;
      case 'model':
        if (value && value.length > 100) {
          error = 'Model must be less than 100 characters';
        }
        break;
    }
    return error;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    if (formData.category) {
      setActiveCategory(categories.find((c: any) => c.id === formData.category) || null);
    } else {
      setActiveCategory(null);
    }
  }, [formData.category, categories]);

  const handleCategoryFilterChange = (filterId: string, value: any) => {
    setFormData({
      ...formData,
      categoryFilters: {
        ...(formData.categoryFilters || {}),
        [filterId]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof Product]);
      if (error) errors[key] = error;
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      onNotify('Please fix the validation errors before submitting', 'error');
      return;
    }
    
    setIsSubmitting(true);
    console.log('Starting product save process...');

    try {
      let modelUrl = formData.model3D || '';
      let modelName = formData.model3DName || '';
      const finalImageUrls: string[] = [];

      if (modelFile) {
        console.log('Uploading 3D model...', modelFile.name);
        
        // If there was an existing model, delete it to save space
        if (initialData?.model3D) {
          console.log('Deleting old 3D model...', initialData.model3D);
          await databaseService.deleteFile(initialData.model3D);
        }

        setUploadingFile('3D Model');
        try {
          const extension = modelFile.name.split('.').pop();
          const originalName = modelFile.name;
          const safeName = `model_${Date.now()}.${extension}`;
          modelUrl = await databaseService.uploadFile(modelFile, `products/3d/${safeName}`, (p) => setUploadProgress(p));
          modelName = originalName;
          console.log('3D model uploaded successfully:', modelUrl);
        } catch (uploadErr) {
          console.error('3D Model upload failed:', uploadErr);
          onNotify(`Failed to upload 3D model: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`, 'error');
          setIsSubmitting(false);
          setUploadingFile(null);
          return;
        }
      }

      // Handle multiple images
      for (let i = 0; i < combinedImages.length; i++) {
        const item = combinedImages[i];
        if (typeof item === 'string') {
          finalImageUrls.push(item);
        } else {
          console.log(`Uploading image ${i + 1}...`, item.name);
          setUploadingFile(`Image ${i + 1}`);
          setUploadProgress(0);
          try {
            const extension = item.name.split('.').pop();
            const safeName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
            const url = await databaseService.uploadFile(item, `products/2d/${safeName}`, (p) => setUploadProgress(p));
            finalImageUrls.push(url);
            console.log(`Image ${i + 1} uploaded successfully:`, url);
          } catch (uploadErr) {
            console.error(`Image ${i + 1} upload failed:`, uploadErr);
            onNotify(`Failed to upload image ${i + 1}: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`, 'error');
            setIsSubmitting(false);
            setUploadingFile(null);
            return;
          }
        }
      }

      setUploadingFile(null);

      const productToSave = {
        ...formData,
        model3D: modelUrl,
        model3DName: modelName,
        images: finalImageUrls,
        image: finalImageUrls[0] || '',
        has3D: !!modelUrl
      };

      console.log('Saving product to database...', productToSave);
      await databaseService.saveProduct(productToSave as any);
      console.log('Product saved successfully!');
      onNotify('Product saved successfully!');
      onSuccess();
    } catch (err) {
      console.error('Failed to save product:', err);
      onNotify(`Failed to save product: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSlot = () => {
    if (!newSlot) return;
    setFormData({
      ...formData,
      slots: [...(formData.slots || []), newSlot]
    });
    setNewSlot('');
  };

  const removeSlot = (slotToRemove: string) => {
    setFormData({
      ...formData,
      slots: formData.slots?.filter(s => s !== slotToRemove) || []
    });
  };

  const addCompatibleCategory = () => {
    if (!newCompatibleCategory) return;
    setFormData({
      ...formData,
      compatibleModuleCategories: [...(formData.compatibleModuleCategories || []), newCompatibleCategory]
    });
    setNewCompatibleCategory('');
  };

  const removeCompatibleCategory = (catToRemove: string) => {
    setFormData({
      ...formData,
      compatibleModuleCategories: formData.compatibleModuleCategories?.filter(c => c !== catToRemove) || []
    });
  };

  const addCompatibleWeapon = () => {
    if (!newCompatibleWeapon) return;
    setFormData({
      ...formData,
      compatibleWeapons: [...(formData.compatibleWeapons || []), newCompatibleWeapon]
    });
    setNewCompatibleWeapon('');
  };

  const removeCompatibleWeapon = (idToRemove: string) => {
    setFormData({
      ...formData,
      compatibleWeapons: formData.compatibleWeapons?.filter(id => id !== idToRemove) || []
    });
  };

  const addTag = () => {
    if (!newTag) return;
    setFormData({
      ...formData,
      tags: [...(formData.tags || []), newTag]
    });
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tagToRemove) || []
    });
  };

  const addCharacteristic = () => {
    if (!newChar.label || !newChar.value) return;
    setFormData({
      ...formData,
      characteristics: [...(formData.characteristics || []), newChar]
    });
    setNewChar({ emoji: '🎯', label: '', value: '' });
  };

  const removeCharacteristic = (index: number) => {
    setFormData({
      ...formData,
      characteristics: formData.characteristics?.filter((_: any, i: number) => i !== index) || []
    });
  };

  const addAttribute = () => {
    if (!newAttributeName || !newAttributeOptions) return;
    const options = newAttributeOptions.split(',').map(o => o.trim()).filter(Boolean);
    setFormData({
      ...formData,
      variantAttributes: [
        ...(formData.variantAttributes || []),
        { name: newAttributeName, options }
      ]
    });
    setNewAttributeName('');
    setNewAttributeOptions('');
  };

  const removeAttribute = (index: number) => {
    setFormData({
      ...formData,
      variantAttributes: formData.variantAttributes?.filter((_, i) => i !== index) || []
    });
  };

  const addVariant = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setFormData({
      ...formData,
      variants: [
        ...(formData.variants || []),
        { id, name: '', attributes: {}, stock: 0 }
      ]
    });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...(formData.variants || [])];
    if (field.startsWith('attr.')) {
      const attrName = field.split('.')[1];
      newVariants[index] = {
        ...newVariants[index],
        attributes: {
          ...newVariants[index].attributes,
          [attrName]: value
        }
      };
      // Update variant name based on attributes
      newVariants[index].name = Object.values(newVariants[index].attributes).join(' / ');
    } else {
      newVariants[index] = { ...newVariants[index], [field]: value };
    }
    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants?.filter((_, i) => i !== index) || []
    });
  };

  const generateVariants = () => {
    if (!formData.variantAttributes || formData.variantAttributes.length === 0) return;

    const cartesian = (...args: any[][]) => args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    const attributeOptions = formData.variantAttributes.map(attr => attr.options.map(opt => ({ [attr.name]: opt })));
    
    let combinations = attributeOptions[0].map(opt => [opt]);
    for (let i = 1; i < attributeOptions.length; i++) {
      combinations = cartesian(combinations, attributeOptions[i]);
    }

    const newVariants = combinations.map((combo: any[]) => {
      const attributes = combo.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      const name = Object.values(attributes).join(' / ');
      return {
        id: Math.random().toString(36).substr(2, 9),
        name,
        attributes,
        stock: 0
      };
    });

    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Product Name</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">The name of the item as it will appear in the shop.</p>}
            <input 
              type="text" 
              value={formData.name}
              onChange={e => handleFieldChange('name', e.target.value)}
              className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 ${
                fieldErrors.name ? 'border-red-500' : 'border-zinc-200'
              }`}
              maxLength={255}
              required
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-xs">{fieldErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Brand</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Manufacturer or brand name (e.g. Tokyo Marui).</p>}
            <input 
              type="text" 
              value={formData.brand}
              onChange={e => handleFieldChange('brand', e.target.value)}
              className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 ${
                fieldErrors.brand ? 'border-red-500' : 'border-zinc-200'
              }`}
              maxLength={100}
            />
            {fieldErrors.brand && (
              <p className="text-red-500 text-xs">{fieldErrors.brand}</p>
            )}
          </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Price (€)</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Selling price in Euros.</p>}
            <input 
              type="number" 
              value={formData.price}
              onChange={e => handleFieldChange('price', Number(e.target.value))}
              className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 ${
                fieldErrors.price ? 'border-red-500' : 'border-zinc-200'
              }`}
              min="0"
              max="999999.99"
              step="0.01"
              required
            />
            {fieldErrors.price && (
              <p className="text-red-500 text-xs">{fieldErrors.price}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Discount (%)</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Percentage discount (0-100).</p>}
            <input 
              type="number" 
              value={formData.discount || 0}
              onChange={e => setFormData({...formData, discount: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Product Type</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Determines how the item is handled in the 3D configurator.</p>}
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            >
              <option value="weapon">Weapon</option>
              <option value="module">Module</option>
              <option value="gear">Gear</option>
              <option value="part">Internal Part</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Visual Mode</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Choose if this product has a 3D model or just a 2D image.</p>}
            <div className="flex gap-4 p-1 bg-zinc-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has3D: false })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${!formData.has3D ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                2D Image
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has3D: true })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${formData.has3D ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                3D Model
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">SKU / Article</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Unique inventory identifier.</p>}
            <input 
              type="text" 
              value={formData.sku || ''}
              onChange={e => handleFieldChange('sku', e.target.value)}
              className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 font-mono ${
                fieldErrors.sku ? 'border-red-500' : 'border-zinc-200'
              }`}
              maxLength={50}
              placeholder="e.g. SA-E01-PRO"
            />
            {fieldErrors.sku && (
              <p className="text-red-500 text-xs">{fieldErrors.sku}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Barcode</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">EAN-13 or other barcode for scanning.</p>}
            <input 
              type="text" 
              value={formData.barcode || ''}
              onChange={e => handleFieldChange('barcode', e.target.value)}
              className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 font-mono ${
                fieldErrors.barcode ? 'border-red-500' : 'border-zinc-200'
              }`}
              placeholder="e.g. 5901234567890"
            />
            {fieldErrors.barcode && (
              <p className="text-red-500 text-xs">{fieldErrors.barcode}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Landing Cost (€)</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Actual cost including shipping/customs.</p>}
            <input 
              type="number" 
              value={formData.landingCost || 0}
              onChange={e => setFormData({...formData, landingCost: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">MSRP (€)</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Manufacturer's Suggested Retail Price.</p>}
            <input 
              type="number" 
              value={formData.msrp || 0}
              onChange={e => setFormData({...formData, msrp: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Total Stock</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Aggregated stock across all warehouses.</p>}
            <input 
              type="number" 
              value={formData.stock}
              onChange={e => handleFieldChange('stock', Number(e.target.value))}
              className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 ${
                fieldErrors.stock ? 'border-red-500' : 'border-zinc-200'
              }`}
              min="0"
              max="999999"
              required
            />
            {fieldErrors.stock && (
              <p className="text-red-500 text-xs">{fieldErrors.stock}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Min. Stock Level</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Threshold for low stock alerts.</p>}
            <input 
              type="number" 
              value={formData.minStockLevel || 0}
              onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Category</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value, subcategory: '', categoryFilters: {}})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            >
              <option value="">Select Category</option>
              {categories.filter(c => !c.parent).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Subcategory</label>
            <select 
              value={formData.subcategory}
              onChange={e => setFormData({...formData, subcategory: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            >
              <option value="">Select Subcategory</option>
              {categories.filter(c => c.parent === formData.category).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Category Filters */}
        {activeCategory?.filters && activeCategory.filters.length > 0 && (
          <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category-Specific Attributes</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategory.filters.map(filter => (
                <div key={filter.id} className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600">{filter.label}</label>
                  {filter.type === 'select' ? (
                    <select
                      value={(formData.categoryFilters?.[filter.id] as string) || ''}
                      onChange={e => handleCategoryFilterChange(filter.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none"
                    >
                      <option value="">Not set</option>
                      {filter.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : filter.type === 'boolean' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCategoryFilterChange(filter.id, true)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.categoryFilters?.[filter.id] === true ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryFilterChange(filter.id, false)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.categoryFilters?.[filter.id] === false ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200'}`}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={(formData.categoryFilters?.[filter.id] as string) || ''}
                      onChange={e => handleCategoryFilterChange(filter.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none"
                      placeholder="Enter value..."
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Variants & Attributes Section */}
        <div className="space-y-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Attributes & Variants</h3>
            <button 
              type="button" 
              onClick={generateVariants}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-widest transition-colors"
            >
              Auto-generate combinations
            </button>
          </div>

          {/* Attributes Management */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Step 1: Define Attributes (e.g. Color, Size)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input 
                type="text" 
                placeholder="Attribute Name (e.g. Color)"
                value={newAttributeName}
                onChange={e => setNewAttributeName(e.target.value)}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl outline-none text-sm"
              />
              <input 
                type="text" 
                placeholder="Options (comma separated)"
                value={newAttributeOptions}
                onChange={e => setNewAttributeOptions(e.target.value)}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl outline-none text-sm"
              />
              <button 
                type="button" 
                onClick={addAttribute}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-xs"
              >
                Add Attribute
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.variantAttributes?.map((attr, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-bold text-zinc-600">
                  <span>{attr.name}: {attr.options.join(', ')}</span>
                  <button type="button" onClick={() => removeAttribute(index)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Step 2: Manage Variants & Stock</label>
              <button 
                type="button" 
                onClick={addVariant}
                className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest hover:underline"
              >
                + Add Manual Variant
              </button>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {formData.variants?.map((variant, index) => (
                <div key={variant.id} className="p-4 bg-white border border-zinc-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">{variant.name || 'New Variant'}</span>
                    <button type="button" onClick={() => removeVariant(index)} className="text-zinc-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formData.variantAttributes?.map(attr => (
                      <div key={attr.name} className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">{attr.name}</label>
                        <select
                          value={variant.attributes[attr.name] || ''}
                          onChange={e => updateVariant(index, `attr.${attr.name}`, e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                        >
                          <option value="">Select {attr.name}</option>
                          {attr.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Stock</label>
                      <input 
                        type="number" 
                        value={variant.stock}
                        onChange={e => updateVariant(index, 'stock', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Price Override (€)</label>
                      <input 
                        type="number" 
                        value={variant.price || ''}
                        onChange={e => updateVariant(index, 'price', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!formData.variants || formData.variants.length === 0) && (
                <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-2xl">
                  <p className="text-xs text-zinc-400 font-medium italic">No variants defined. Add attributes first then click "Auto-generate".</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Short Description</label>
          {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Brief summary of the product (appears in lists).</p>}
          <textarea 
            value={formData.description}
            onChange={e => handleFieldChange('description', e.target.value)}
            className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 h-24 resize-none ${
              fieldErrors.description ? 'border-red-500' : 'border-zinc-200'
            }`}
            maxLength={2000}
            required
          />
          {fieldErrors.description && (
            <p className="text-red-500 text-xs">{fieldErrors.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Long Description</label>
          {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Detailed history, story, or technical deep-dive (appears in product card).</p>}
          <textarea 
            value={formData.longDescription || ''}
            onChange={e => setFormData({...formData, longDescription: e.target.value})}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 h-48 resize-none"
            placeholder="Write the detailed description here..."
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-zinc-700">Tags</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            />
            <button type="button" onClick={addTag} className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map(tag => (
              <span key={tag} className="flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-zinc-700">Characteristics</label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select 
              value={newChar.emoji}
              onChange={e => setNewChar({...newChar, emoji: e.target.value})}
              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            >
              {['🎯', '🔫', '🛡️', '🔋', '📦', '⚖️', '📏', '💨', '🔊', '🔦', '🔭', '🧤', '🪖', '🎒', '🛠️', '⚙️', '⚡', '🌡️', '💧'].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Label (e.g. Weight)"
              value={newChar.label}
              onChange={e => setNewChar({...newChar, label: e.target.value})}
              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            />
            <input 
              type="text" 
              placeholder="Value (e.g. 2.5kg)"
              value={newChar.value}
              onChange={e => setNewChar({...newChar, value: e.target.value})}
              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            />
            <button 
              type="button" 
              onClick={addCharacteristic}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold"
            >
              Add
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formData.characteristics?.map((char: Characteristic, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{char.emoji}</span>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">{char.label}</div>
                    <div className="text-sm font-bold text-zinc-700">{char.value}</div>
                  </div>
                </div>
                <button type="button" onClick={() => removeCharacteristic(index)} className="text-zinc-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-zinc-700">Product Images (2D)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {combinedImages.map((item, index) => (
              <div key={index} className="relative group aspect-square bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden">
                <img 
                  src={typeof item === 'string' ? item : URL.createObjectURL(item)} 
                  alt={`Preview ${index}`} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const newImages = [...combinedImages];
                        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                        setCombinedImages(newImages);
                      }}
                      className="p-1.5 bg-white text-zinc-900 rounded-lg hover:bg-zinc-100"
                    >
                      <ArrowUp size={14} />
                    </button>
                  )}
                  {index < combinedImages.length - 1 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const newImages = [...combinedImages];
                        [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
                        setCombinedImages(newImages);
                      }}
                      className="p-1.5 bg-white text-zinc-900 rounded-lg hover:bg-zinc-100"
                    >
                      <ArrowDown size={14} />
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => {
                      const newImages = combinedImages.filter((_, i) => i !== index);
                      setCombinedImages(newImages);
                    }}
                    className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md">
                    Primary
                  </div>
                )}
              </div>
            ))}
            <label className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-zinc-400 transition-all cursor-pointer bg-zinc-50">
              <Plus size={24} className="text-zinc-400" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Add Image</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  setCombinedImages([...combinedImages, ...files]);
                }}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formData.has3D && (
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-700">3D Model File (.glb)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-zinc-400 transition-all cursor-pointer bg-zinc-50">
                  <Upload size={24} className="text-zinc-400" />
                  <span className="text-zinc-500 font-medium">
                    {modelFile ? modelFile.name : formatModelName(formData.model3DName || formData.model3D)}
                  </span>
                  <input 
                    type="file" 
                    accept=".glb" 
                    className="hidden" 
                    onChange={e => setModelFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {formData.has3D && (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-zinc-700">3D Configurator Settings</label>
            <div className="grid grid-cols-1 gap-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Unique ID (UID)</label>
                {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Tarkov-style ID for compatibility logic (e.g. mount_picatinny_01).</p>}
                <input 
                  type="text" 
                  value={formData.uid || ''}
                  onChange={e => setFormData({...formData, uid: e.target.value})}
                  placeholder="e.g. sight_reflex_01"
                  className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {formData.type === 'weapon' && (
          <div className="space-y-6">
            {/* Attachment points are now managed automatically or via UID logic */}
          </div>
        )}

        {formData.type === 'module' && (
          <div className="space-y-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Attachment Slot</label>
              <select 
                value={formData.attachmentSlot}
                onChange={e => setFormData({...formData, attachmentSlot: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
              >
                <option value="">Select Slot Type</option>
                {WEAPON_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{formatEnum(slot)}</option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">The slot ID on the weapon this module attaches to</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Mount Type</label>
              <select 
                value={formData.mountType || ''}
                onChange={e => setFormData({...formData, mountType: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
              >
                <option value="">Select Mount Type</option>
                <option value="Picatinny">Picatinny</option>
                <option value="M-LOK">M-LOK</option>
                <option value="KeyMod">KeyMod</option>
                <option value="Dovetail">Dovetail</option>
              </select>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">The mounting system this module uses</p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Compatible Weapons</label>
              <div className="flex gap-2">
                <select 
                  value={newCompatibleWeapon}
                  onChange={e => setNewCompatibleWeapon(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white border border-zinc-200 rounded-xl outline-none"
                >
                  <option value="">Select Weapon</option>
                  {weapons
                    .filter(w => !formData.compatibleWeapons?.includes(w.uid))
                    .map(w => (
                      <option key={w.id} value={w.uid}>{w.name} ({w.brand})</option>
                    ))
                  }
                </select>
                <button 
                  type="button" 
                  onClick={addCompatibleWeapon}
                  disabled={!newCompatibleWeapon}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Add Weapon
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.compatibleWeapons?.map(uid => {
                  const weapon = weapons.find(w => w.uid === uid);
                  return (
                    <span key={uid} className="flex items-center gap-2 px-3 py-1 bg-white text-zinc-700 border border-zinc-200 rounded-full text-sm font-medium">
                      {weapon ? `${weapon.name} (${weapon.brand})` : uid}
                      <button type="button" onClick={() => removeCompatibleWeapon(uid)} className="text-zinc-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-4 pt-8 border-t border-zinc-100">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-8 py-4 text-zinc-600 font-bold hover:bg-zinc-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-12 py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 disabled:opacity-50 relative overflow-hidden"
          >
            {isSubmitting && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            )}
            <Save size={20} />
            {isSubmitting ? (uploadingFile ? `Uploading ${uploadingFile}...` : 'Saving...') : 'Save Product'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
