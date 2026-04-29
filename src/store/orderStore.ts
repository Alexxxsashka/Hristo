import { create } from 'zustand';
import { Order } from '../types';
import { databaseService } from '../services/databaseService';
import { syncManager } from '../utils/sync';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;

  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status'], trackingNumber?: string, updatedBy?: string) => Promise<void>;
  addOrder: (order: Order) => void;
  syncOrders: () => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  lastUpdated: 0,

  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      const data = await databaseService.getAllOrders();
      set({ orders: data || [], isLoading: false, lastUpdated: Date.now() });
    } catch (error) {
      set({ error: 'Failed to fetch orders', isLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status, trackingNumber, updatedBy) => {
    try {
      await databaseService.updateOrderStatus(orderId, status, trackingNumber, updatedBy);
      // Optimistic update
      set((state) => ({
        orders: state.orders.map((o) => 
          o.id === orderId ? { 
            ...o, 
            status, 
            shipping: { 
              ...o.shipping, 
              trackingNumber: trackingNumber || o.shipping.trackingNumber 
            } 
          } : o
        ),
        lastUpdated: Date.now()
      }));
      syncManager.broadcast('SYNC_ORDERS');
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  },

  addOrder: (order) => {
    set((state) => ({
      orders: [order, ...state.orders],
      lastUpdated: Date.now()
    }));
    syncManager.broadcast('SYNC_ORDERS');
  },

  syncOrders: async () => {
    const data = await databaseService.getAllOrders();
    set({ orders: data || [], lastUpdated: Date.now() });
  }
}));

// Subscribe to global sync events
if (typeof window !== 'undefined') {
  syncManager.subscribe((type) => {
    if (type === 'SYNC_ORDERS') {
      useOrderStore.getState().syncOrders();
    }
  });
}
