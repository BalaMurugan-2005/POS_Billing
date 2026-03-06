import localForage from 'localforage';

// Configure localForage
localForage.config({
  name: 'POSSystem',
  storeName: 'pos_offline_data',
  description: 'Offline storage for POS system'
});

export const offlineService = {
  // Cart management
  saveCart: async (cart) => {
    try {
      await localForage.setItem('current_cart', cart);
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  },

  getCart: async () => {
    try {
      return await localForage.getItem('current_cart');
    } catch (error) {
      console.error('Failed to get cart:', error);
      return null;
    }
  },

  clearCart: async () => {
    try {
      await localForage.removeItem('current_cart');
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },

  // Offline transactions
  saveOfflineTransaction: async (transaction) => {
    try {
      const transactions = await localForage.getItem('offline_transactions') || [];
      transactions.push({
        ...transaction,
        id: `offline_${Date.now()}`,
        synced: false
      });
      await localForage.setItem('offline_transactions', transactions);
    } catch (error) {
      console.error('Failed to save offline transaction:', error);
    }
  },

  getOfflineTransactions: async () => {
    try {
      return await localForage.getItem('offline_transactions') || [];
    } catch (error) {
      console.error('Failed to get offline transactions:', error);
      return [];
    }
  },

  removeOfflineTransaction: async (transactionId) => {
    try {
      const transactions = await localForage.getItem('offline_transactions') || [];
      const filtered = transactions.filter(t => t.id !== transactionId);
      await localForage.setItem('offline_transactions', filtered);
    } catch (error) {
      console.error('Failed to remove offline transaction:', error);
    }
  },

  // Products cache
  cacheProducts: async (products) => {
    try {
      await localForage.setItem('cached_products', products);
    } catch (error) {
      console.error('Failed to cache products:', error);
    }
  },

  getCachedProducts: async () => {
    try {
      return await localForage.getItem('cached_products') || [];
    } catch (error) {
      console.error('Failed to get cached products:', error);
      return [];
    }
  },

  // Clear all offline data
  clearAll: async () => {
    try {
      await localForage.clear();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }
};