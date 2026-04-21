import { create } from 'zustand';
import { Product, Category, FilterState } from '../types';
import { databaseService } from '../services/databaseService';

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
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Categories
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false;
      }

      // Subcategories
      if (filters.subcategories.length > 0 && !filters.subcategories.includes(product.subcategory)) {
        return false;
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
}));
