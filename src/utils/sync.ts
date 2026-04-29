/**
 * Global Synchronization Utility
 * Uses BroadcastChannel to sync state across tabs/windows in real-time.
 */

type SyncMessageType = 'SYNC_PRODUCTS' | 'SYNC_ORDERS' | 'SYNC_SETTINGS' | 'SYNC_CATEGORIES' | 'SYNC_AUDIT' | 'SYNC_BLOG';

const channel = typeof window !== 'undefined' ? new BroadcastChannel('hristo_data_sync') : null;

export const syncManager = {
  broadcast: (type: SyncMessageType, data?: any) => {
    if (channel) {
      channel.postMessage({ type, data, timestamp: Date.now() });
    }
  },
  
  subscribe: (callback: (type: SyncMessageType, data?: any) => void) => {
    if (channel) {
      const handler = (event: MessageEvent) => {
        callback(event.data.type, event.data.data);
      };
      channel.addEventListener('message', handler);
      return () => channel.removeEventListener('message', handler);
    }
    return () => {};
  }
};
