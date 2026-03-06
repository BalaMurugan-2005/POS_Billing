import { useEffect, useState } from 'react';
import { offlineService } from '../services/offlineService';
import { transactionService } from '../services/transactionService';
import toast from 'react-hot-toast';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Transactions will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    if (!isOnline) return;

    setSyncStatus('syncing');
    try {
      const offlineTransactions = await offlineService.getOfflineTransactions();
      
      for (const transaction of offlineTransactions) {
        try {
          await transactionService.createTransaction(transaction);
          await offlineService.removeOfflineTransaction(transaction.id);
        } catch (error) {
          console.error('Failed to sync transaction:', error);
        }
      }

      if (offlineTransactions.length > 0) {
        toast.success('Offline transactions synced successfully!');
      }
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      toast.error('Failed to sync offline data');
    }
  };

  return { isOnline, syncStatus, syncOfflineData };
};