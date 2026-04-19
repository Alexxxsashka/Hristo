import { create } from 'zustand';
import { Product, AttachPoint } from '../types';
import { CompatibilityEngine } from '../services/configuratorService';
import { databaseService } from '../services/databaseService';

export interface SavedBuild {
  id: string;
  name: string;
  date: string;
  activeProduct: Product;
  selectedParts: Record<string, Product | null>;
  totalPrice: number;
}

interface ConfiguratorState {
  activeProduct: Product | null;
  selectedParts: Record<string, Product | null>; // slotId -> Module Product
  totalPrice: number;
  selectedSlotId: string | null;
  showMarkers: boolean;
  showHUD: boolean;
  isFullscreen: boolean;
  allModules: Product[];
  savedBuilds: SavedBuild[];
  
  setActiveProduct: (product: Product | null) => void;
  setAllModules: (modules: Product[]) => void;
  setSelectedSlotId: (slotId: string | null) => void;
  setShowMarkers: (show: boolean) => void;
  setShowHUD: (show: boolean) => void;
  setIsFullscreen: (show: boolean) => void;
  toggleMarkers: () => void;
  toggleHUD: () => void;
  toggleFullscreen: () => void;
  addPart: (part: Product, slotId: string) => void;
  removePart: (slotId: string) => void;
  resetConfiguration: () => void;
  calculateTotalPrice: () => void;
  saveBuild: (name: string) => void;
  loadBuild: (build: SavedBuild) => void;
  deleteBuild: (id: string) => void;
  checkCompatibility: (part: Product, slotId?: string) => { 
    compatible: boolean; 
    reason?: string;
  };
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  activeProduct: null,
  selectedParts: {},
  totalPrice: 0,
  selectedSlotId: null,
  showMarkers: true,
  showHUD: true,
  isFullscreen: false,
  allModules: [],
  savedBuilds: JSON.parse(localStorage.getItem('saved_builds') || '[]'),

  setActiveProduct: (product) => {
    if (!product) {
      set({ 
        activeProduct: null, 
        selectedParts: {}, 
        totalPrice: 0,
        selectedSlotId: null,
        showMarkers: true,
        showHUD: true,
        isFullscreen: false
      });
      return;
    }
    set({ 
      activeProduct: product, 
      selectedParts: {}, 
      totalPrice: product.price,
      selectedSlotId: null,
      showMarkers: true,
      showHUD: true,
      isFullscreen: false
    });
  },

  setAllModules: (modules) => set({ allModules: modules }),

  setSelectedSlotId: (slotId) => set({ selectedSlotId: slotId }),
  setShowMarkers: (show) => set({ showMarkers: show }),
  setShowHUD: (show) => set({ showHUD: show }),
  setIsFullscreen: (show) => set({ isFullscreen: show }),
  toggleMarkers: () => set((state) => ({ showMarkers: !state.showMarkers })),
  toggleHUD: () => set((state) => ({ showHUD: !state.showHUD })),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

  addPart: (part, fullSlotId) => {
    const { selectedParts } = get();
    
    const newSelectedParts = {
      ...selectedParts,
      [fullSlotId]: part
    };
    set({ selectedParts: newSelectedParts });
    get().calculateTotalPrice();
  },

  removePart: (fullSlotId) => {
    const { selectedParts } = get();
    const newSelectedParts = { ...selectedParts };
    
    const removeRecursive = (id: string) => {
      const part = selectedParts[id];
      if (!part) return;
      
      Object.keys(selectedParts).forEach(key => {
        if (key.startsWith(`${part.id}:`)) {
          removeRecursive(key);
          delete newSelectedParts[key];
        }
      });
      delete newSelectedParts[id];
    };

    removeRecursive(fullSlotId);

    set({ selectedParts: newSelectedParts });
    get().calculateTotalPrice();
  },

  resetConfiguration: () => {
    const { activeProduct } = get();
    if (activeProduct) {
      set({ selectedParts: {}, totalPrice: activeProduct.price });
    }
  },

  calculateTotalPrice: () => {
    const { activeProduct, selectedParts } = get();
    if (!activeProduct) return;

    const partsPrice = Object.values(selectedParts).reduce((acc, part) => {
      return acc + (part?.price || 0);
    }, 0);

    set({ totalPrice: activeProduct.price + partsPrice });
  },

  saveBuild: async (name) => {
    const { activeProduct, selectedParts, totalPrice, savedBuilds } = get();
    if (!activeProduct) return;

    const newBuild: SavedBuild = {
      id: `build-${Date.now()}`,
      name,
      date: new Date().toISOString(),
      activeProduct,
      selectedParts: { ...selectedParts },
      totalPrice
    };

    try {
      await databaseService.saveBuild(newBuild);
      const newSavedBuilds = [newBuild, ...savedBuilds];
      set({ savedBuilds: newSavedBuilds });
    } catch (error) {
      console.error('Error saving build to database:', error);
    }
  },

  loadBuild: (build) => {
    console.log('[ConfiguratorStore] Loading build:', build);
    set({
      activeProduct: build.activeProduct,
      selectedParts: { ...build.selectedParts },
      totalPrice: build.totalPrice,
      selectedSlotId: null
    });
  },

  deleteBuild: async (id) => {
    const { savedBuilds } = get();
    try {
      await databaseService.deleteBuild(id);
      const newSavedBuilds = savedBuilds.filter(b => b.id !== id);
      set({ savedBuilds: newSavedBuilds });
    } catch (error) {
      console.error('Error deleting build from database:', error);
    }
  },

  checkCompatibility: (part, fullSlotId) => {
    const { activeProduct } = get();
    if (!activeProduct) return { compatible: false, reason: "No active product" };

    if (fullSlotId) {
      const [parentId, slotType] = fullSlotId.split(':');
      const category = part.category?.toLowerCase() || part.type?.toLowerCase();
      const attachmentSlot = part.attachmentSlot?.toLowerCase();
      
      // EFT Logic 1: Check specific UID compatibility (Must fit the weapon/parent)
      const allowedIds = part.compatibleIds || part.compatibleWeapons || [];
      if (allowedIds && allowedIds.length > 0) {
        if (!allowedIds.includes(activeProduct.uid)) {
          return { 
            compatible: false, 
            reason: `Direct mismatch: ${part.name} is not in the whitelist for ${activeProduct.name}` 
          };
        }
      }

      // EFT Logic 2: Slot Type matching
      // Priority: attachmentSlot > category > part type
      if (attachmentSlot && attachmentSlot === slotType.toLowerCase()) {
        return { compatible: true };
      }

      if (category === slotType.toLowerCase()) {
        return { compatible: true };
      }

      return { 
        compatible: false, 
        reason: `Slot mismatch: ${part.name} requires ${attachmentSlot || category || 'unknown'} slot, but this is ${slotType}` 
      };
    }
    
    return { compatible: true };
  }
}));
