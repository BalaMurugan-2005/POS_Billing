import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import BarcodeScanner from '../pos/BarcodeScanner';
import Cart from '../pos/Cart';
import PaymentModal from '../pos/PaymentModal';
import Receipt from '../pos/Receipt';
import WeightInput from '../pos/WeightInput';
import ProductSearch from '../pos/ProductSearch';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useCart } from '../../hooks/useCart';
import { transactionService } from '../../services/transactionService';
import {
  WifiIcon,
  SignalSlashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CashierDashboard = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [weightProduct, setWeightProduct] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showCustomerScan, setShowCustomerScan] = useState(false);

  const { isOnline, syncStatus } = useOfflineSync();
  const { cart, setCustomer } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    fetchRecentTransactions();

    return () => clearInterval(timer);
  }, []);

  const fetchRecentTransactions = async () => {
    try {
      // Mock data - replace with actual API call
      setRecentTransactions([
        { id: 'TXN001', total: 45.67, time: '10:30 AM', items: 3 },
        { id: 'TXN002', total: 89.90, time: '10:45 AM', items: 5 },
        { id: 'TXN003', total: 23.45, time: '11:00 AM', items: 2 },
      ]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentComplete = (transaction) => {
    setShowPayment(false);
    setCurrentTransaction(transaction);
    setShowReceipt(true);
    fetchRecentTransactions();
  };

  const handleWeightSubmit = ({ weight, unit, totalPrice }) => {
    // Add weighted item to cart with calculated price
    const product = {
      ...weightProduct,
      price: totalPrice,
      weight: weight,
      unit: unit
    };
    // You'll need to implement addWeightedItem in your cart context
    toast.success(`${weightProduct.name} (${weight}${unit}) added to cart`);
    setShowWeightModal(false);
  };

  const handleCustomerScan = (qrData) => {
    try {
      const customer = JSON.parse(qrData);
      setCustomer(customer);
      setShowCustomerScan(false);
      toast.success(`Customer ${customer.name} identified`);
    } catch (error) {
      toast.error('Invalid QR code');
    }
  };

  const handleQuickAmount = (amount) => {
    // Quick amount buttons for cash payment
    document.querySelector('input[name="paidAmount"]')?.focus();
  };

  const handleLogout = () => {
    if (cart.items.length > 0) {
      if (window.confirm('You have items in cart. Are you sure you want to logout?')) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Status Bar */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className={`p-3 rounded-lg flex items-center gap-2 ${isOnline ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'
          }`}>
          {isOnline ? (
            <>
              <WifiIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
            </>
          ) : (
            <>
              <SignalSlashIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">Offline Mode</span>
            </>
          )}
          {syncStatus === 'syncing' && (
            <span className="text-blue-600 dark:text-blue-400 ml-2">Syncing...</span>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center justify-center gap-2">
          <ClockIcon className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{format(currentTime, 'hh:mm:ss a')}</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-center justify-end gap-2">
          <button
            onClick={() => setShowCustomerScan(true)}
            className="flex items-center gap-1 text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded"
          >
            <UserIcon className="w-4 h-4" />
            Scan Customer
          </button>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Left Panel - Products & Controls */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
          <BarcodeScanner />

          {/* Quick Actions */}
          <div className="grid grid-cols-8 gap-2">
            <button className="btn-secondary p-3 text-lg font-mono">F1</button>
            <button className="btn-secondary p-3 text-lg font-mono">F2</button>
            <button className="btn-secondary p-3 text-lg font-mono">F3</button>
            <button className="btn-secondary p-3 text-lg font-mono">F4</button>
            <button className="btn-secondary p-3 text-lg font-mono">F5</button>
            <button className="btn-secondary p-3 text-lg font-mono">F6</button>
            <button className="btn-secondary p-3 text-lg font-mono">F7</button>
            <button className="btn-secondary p-3 text-lg font-mono">F8</button>
          </div>

          {/* Category Quick Picks */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Quick Categories</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              <button className="btn-secondary text-sm p-2">All</button>
              <button className="btn-secondary text-sm p-2">🍎 Fruits</button>
              <button className="btn-secondary text-sm p-2">🥕 Veg</button>
              <button className="btn-secondary text-sm p-2">🥛 Dairy</button>
              <button className="btn-secondary text-sm p-2">🍞 Bakery</button>
              <button className="btn-secondary text-sm p-2">🥤 Drinks</button>
              <button className="btn-secondary text-sm p-2">🍫 Snacks</button>
              <button className="btn-secondary text-sm p-2">🧹 House</button>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Quick Amounts</h3>
            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 20, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className="btn-secondary py-3"
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Transactions</h3>
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <span className="font-mono">{tx.id}</span>
                    <span className="text-gray-500 ml-2">{tx.time}</span>
                  </div>
                  <div>
                    <span className="font-medium">${tx.total.toFixed(2)}</span>
                    <span className="text-gray-500 ml-2">({tx.items} items)</span>
                  </div>
                </div>
              ))}
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

      {showProductSearch && (
        <ProductSearch onClose={() => setShowProductSearch(false)} />
      )}

      {/* Customer QR Scanner Modal */}
      <Dialog open={showCustomerScan} onClose={() => setShowCustomerScan(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
            <Dialog.Title className="text-xl font-bold mb-4">
              Scan Customer QR Code
            </Dialog.Title>

            <div className="text-center mb-6">
              <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg">
                {/* QR Scanner placeholder - you'd integrate a real QR scanner library here */}
                <div className="w-48 h-48 mx-auto bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600">QR Scanner Preview</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Position the QR code in front of the camera
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomerScan(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCustomerScan('{"id":123,"name":"John Doe"}')}
                className="btn-primary flex-1"
              >
                Simulate Scan
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default CashierDashboard;