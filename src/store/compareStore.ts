import { create } from 'zustand';
import { Product } from '../types';

interface CompareState {
  compareProducts: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  compareProducts: [],
  
  addProduct: (product) => {
    const { compareProducts } = get();
    if (compareProducts.length >= 4) return;
    if (compareProducts.some(p => p.id === product.id)) return;
    
    set({ compareProducts: [...compareProducts, product] });
  },
  
  removeProduct: (productId) => {
    const { compareProducts } = get();
    set({ compareProducts: compareProducts.filter(p => p.id !== productId) });
  },

  toggleCompare: (product) => {
    const { isInCompare, addProduct, removeProduct } = get();
    if (isInCompare(product.id)) {
      removeProduct(product.id);
    } else {
      addProduct(product);
    }
  },
  
  clearCompare: () => set({ compareProducts: [] }),
  
  isInCompare: (productId) => {
    return get().compareProducts.some(p => p.id === productId);
  }
}));
