import { create } from 'zustand';
import { Product, Category, FilterState } from '../types';
import { databaseService } from '../services/databaseService';
import { syncManager } from '../utils/sync';

interface ShopState {
  products: Product[];
  categories: Category[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  currentPage: number;
  itemsPerPage: number;

  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  getFilteredProducts: () => Product[];
  setViewMode: (mode: 'grid' | 'list') => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  saveProduct: (product: any) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveCategory: (category: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const initialFilters: FilterState = {
  search: '',
  categories: [],
  subcategories: [],
  brands: [],
  mountTypes: [],
  minPrice: 0,
  maxPrice: 5000,
  inStock: false,
  sortBy: 'newest',
  categoryFilters: {},
};

export const useShopStore = create<ShopState>((set, get) => ({
  products: [],
  categories: [],
  filters: initialFilters,
  isLoading: false,
  error: null,
  viewMode: 'grid',
  currentPage: 1,
  itemsPerPage: 20,

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const data = await databaseService.getProducts();
      set({ products: data as Product[], isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch products', isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const data = await databaseService.getCategories();
      set({ categories: data as Category[] });
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1, // Reset to first page when filters change
    }));
  },

  resetFilters: () => {
    set({ filters: initialFilters, currentPage: 1 });
  },

  getFilteredProducts: () => {
    const { products, filters } = get();
    
    let filtered = products.filter((product) => {
      // Search
      const searchLower = filters.search.toLowerCase();
      const productCategory = get().categories.find(c => c.id === product.category);
      const productSubcategory = get().categories.find(c => c.id === product.subcategory);
      
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        (product.tags || []).some(tag => tag.toLowerCase().includes(searchLower)) ||
        (productCategory?.name.toLowerCase().includes(searchLower)) ||
        (productSubcategory?.name.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Categories
      if (filters.categories.length > 0) {
        const matchesCat = filters.categories.some(catId => {
          if (product.category === catId) return true;
          if (product.subcategory === catId) return true;
          // Check if catId is a parent of the product's category or subcategory
          const pCat = get().categories.find(c => c.id === product.category);
          const pSub = get().categories.find(c => c.id === product.subcategory);
          return pCat?.parent === catId || pSub?.parent === catId;
        });
        if (!matchesCat) return false;
      }

      // Subcategories
      if (filters.subcategories.length > 0) {
        const matchesSub = filters.subcategories.some(subId => {
          return product.subcategory === subId || product.category === subId;
        });
        if (!matchesSub) return false;
      }

      // Brands
      if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
        return false;
      }

      // Mount Types
      if (filters.mountTypes.length > 0 && (!product.mountType || !filters.mountTypes.includes(product.mountType))) {
        return false;
      }

      // Price
      if (product.price < filters.minPrice || product.price > filters.maxPrice) {
        return false;
      }

      // Stock
      if (filters.inStock && product.stock <= 0) {
        return false;
      }

      // Category Specific Filters
      if (Object.keys(filters.categoryFilters).length > 0) {
        for (const [filterId, filterValue] of Object.entries(filters.categoryFilters)) {
          if (filterValue === undefined || filterValue === null || filterValue === '') continue;
          
          const productValue = product.categoryFilters?.[filterId];
          
          if (typeof filterValue === 'boolean') {
            if (productValue !== filterValue) return false;
          } else if (typeof filterValue === 'number') {
            // Assuming range for numbers if it's a single value it must be >=
            if (typeof productValue === 'number' && productValue < filterValue) return false;
          } else if (typeof filterValue === 'string') {
            if (productValue !== filterValue) return false;
          }
        }
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'newest':
          // Assuming ID or some other field represents "newness" for now
          return b.id.localeCompare(a.id);
        case 'popular':
          // Placeholder for popularity
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

    return filtered;
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setItemsPerPage: (count) => set({ itemsPerPage: count, currentPage: 1 }),
  saveProduct: async (productData: any) => {
    await databaseService.saveProduct(productData);
    const data = await databaseService.getProducts();
    set({ products: data as Product[] });
    syncManager.broadcast('SYNC_PRODUCTS');
  },
  deleteProduct: async (id: string) => {
    await databaseService.deleteProduct(id);
    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
    syncManager.broadcast('SYNC_PRODUCTS');
  },
  saveCategory: async (categoryData: any) => {
    await databaseService.saveCategory(categoryData);
    const data = await databaseService.getCategories();
    set({ categories: data as Category[] });
    syncManager.broadcast('SYNC_CATEGORIES');
  },
  deleteCategory: async (id: string) => {
    await databaseService.deleteCategory(id);
    set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
    syncManager.broadcast('SYNC_CATEGORIES');
  },
}));

// Subscribe to global sync events
if (typeof window !== 'undefined') {
  syncManager.subscribe((type) => {
    if (type === 'SYNC_PRODUCTS') {
      useShopStore.getState().fetchProducts();
    } else if (type === 'SYNC_CATEGORIES') {
      useShopStore.getState().fetchCategories();
    }
  });
}
