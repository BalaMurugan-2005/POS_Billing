import React, { useState } from 'react';
import BarcodeScanner from '../components/pos/BarcodeScanner';
import Cart from '../components/pos/Cart';
import PaymentModal from '../components/pos/PaymentModal';
import Receipt from '../components/pos/Receipt';
import WeightInput from '../components/pos/WeightInput';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const CashierDashboard = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightProduct, setWeightProduct] = useState(null);
  const { isOnline, syncStatus } = useOfflineSync();

  const handleCheckout = () => {
    setShowPayment(true);
  };

  const handlePaymentComplete = (transaction) => {
    setShowPayment(false);
    setCurrentTransaction(transaction);
    setShowReceipt(true);
  };

  const handleWeightSubmit = (weight) => {
    // Add weighted item to cart
    console.log('Weight submitted:', weight);
    setShowWeightModal(false);
  };

  return (
    <div className="h-[calc(100vh-5rem)]">
      {/* Status Bar */}
      <div className={`mb-4 p-2 rounded-lg flex items-center justify-between ${isOnline ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'
        }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <WifiIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">Online</span>
            </>
          ) : (
            <>
              <SignalSlashIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-yellow-600 dark:text-yellow-400">Offline Mode</span>
            </>
          )}
        </div>
        {syncStatus === 'syncing' && (
          <span className="text-blue-600 dark:text-blue-400">Syncing...</span>
        )}
      </div>

      {/* Main POS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left Panel - Products */}
        <div className="lg:col-span-2 space-y-4">
          <BarcodeScanner />

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button className="btn-secondary p-4 text-lg">F1</button>
            <button className="btn-secondary p-4 text-lg">F2</button>
            <button className="btn-secondary p-4 text-lg">F3</button>
            <button className="btn-secondary p-4 text-lg">F4</button>
            <button className="btn-secondary p-4 text-lg">F5</button>
            <button className="btn-secondary p-4 text-lg">F6</button>
            <button className="btn-secondary p-4 text-lg">F7</button>
            <button className="btn-secondary p-4 text-lg">F8</button>
          </div>

          {/* Product Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Categories</h3>
            <div className="grid grid-cols-4 gap-2">
              <button className="btn-secondary">All</button>
              <button className="btn-secondary">Groceries</button>
              <button className="btn-secondary">Vegetables</button>
              <button className="btn-secondary">Fruits</button>
              <button className="btn-secondary">Dairy</button>
              <button className="btn-secondary">Bakery</button>
              <button className="btn-secondary">Beverages</button>
              <button className="btn-secondary">Snacks</button>
            </div>
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="h-full">
          <Cart onCheckout={handleCheckout} />
        </div>
      </div>

      {/* Modals */}
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
        onSubmit={handleWeightSubmit}
      />
    </div>
  );
};

export default CashierDashboard;