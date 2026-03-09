import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import BarcodeScanner from '../components/pos/BarcodeScanner';
import Cart from '../components/pos/Cart';
import PaymentModal from '../components/pos/PaymentModal';
import Receipt from '../components/pos/Receipt';
import WeightInput from '../components/pos/WeightInput';
import CashierTransactions from './cashier/CashierTransactions';
import CashierCustomers from './cashier/CashierCustomers';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const POSView = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightProduct, setWeightProduct] = useState(null);
  const { isOnline, syncStatus } = useOfflineSync();

  const handlePaymentComplete = (transaction) => {
    setShowPayment(false);
    setCurrentTransaction(transaction);
    setShowReceipt(true);
  };

  return (
    <div className="h-[calc(100vh-5rem)]">
      {/* Status Bar */}
      <div className={`mb-4 p-2 rounded-lg flex items-center justify-between ${isOnline ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <WifiIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">Online</span>
            </>
          ) : (
            <>
              <SignalSlashIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Offline Mode</span>
            </>
          )}
        </div>
        {syncStatus === 'syncing' && <span className="text-blue-600 dark:text-blue-400 text-sm">Syncing...</span>}
      </div>

      {/* Main POS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 space-y-4">
          <BarcodeScanner onCheckout={() => setShowPayment(true)} />
        </div>
        <div className="h-full">
          <Cart onCheckout={() => setShowPayment(true)} />
        </div>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onComplete={handlePaymentComplete}
      />
      <Receipt
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        transaction={currentTransaction}
      />
      <WeightInput
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        product={weightProduct}
        onSubmit={() => setShowWeightModal(false)}
      />
    </div>
  );
};

const CashierDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<POSView />} />
      <Route path="/transactions" element={<CashierTransactions />} />
      <Route path="/customers" element={<CashierCustomers />} />
    </Routes>
  );
};

export default CashierDashboard;