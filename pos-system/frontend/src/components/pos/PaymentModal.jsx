import React, { useState } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { useCart } from '../../hooks/useCart';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { transactionService } from '../../services/transactionService';
import { motion } from 'framer-motion';
import { BanknotesIcon, CreditCardIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, onComplete }) => {
  const { cart, processPayment, clearCart } = useCart();
  const { isOnline } = useOfflineSync();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [splitPayments, setSplitPayments] = useState([]);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: BanknotesIcon },
    { id: 'card', name: 'Card', icon: CreditCardIcon },
    { id: 'upi', name: 'UPI', icon: DevicePhoneMobileIcon },
  ];

  const calculateChange = () => {
    const paid = parseFloat(paidAmount) || 0;
    return (paid - cart.total).toFixed(2);
  };

  const handleCashPayment = async () => {
    const paid = parseFloat(paidAmount);
    if (paid < cart.total) {
      toast.error('Insufficient amount paid');
      return;
    }

    await processPayment('cash', paid);
    await completeTransaction();
  };

  const handleCardPayment = async () => {
    await processPayment('card', cart.total);
    toast.success('Card payment processed');
    await completeTransaction();
  };

  const handleUPIPayment = async () => {
    await processPayment('upi', cart.total);
    toast.success('UPI payment processed');
    await completeTransaction();
  };

  const completeTransaction = async () => {
    setProcessing(true);

    try {
      const transactionData = {
        items: cart.items,
        subtotal: cart.subtotal,
        tax: cart.tax,
        discount: cart.discount,
        total: cart.total,
        paymentMethod: cart.paymentMethod,
        paidAmount: cart.paidAmount,
        change: cart.change,
        customer: cart.customer ? { id: cart.customer.id } : null,
        timestamp: new Date().toISOString()
      };

      if (isOnline) {
        const response = await transactionService.createTransaction(transactionData);
        onComplete(response);
      } else {
        // Save offline
        await offlineService.saveOfflineTransaction(transactionData);
        toast.success('Transaction saved offline');
        onComplete({ ...transactionData, offline: true });
      }

      clearCart();
      onClose();
    } catch (error) {
      toast.error('Transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6"
          >
            <Dialog.Title className="text-2xl font-bold mb-4">
              Payment - Total: ${cart.total.toFixed(2)}
            </Dialog.Title>

            <Tab.Group>
              <Tab.List className="flex space-x-2 rounded-xl bg-gray-100 dark:bg-gray-700 p-1 mb-6">
                {paymentMethods.map((method) => (
                  <Tab
                    key={method.id}
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                      ${selected
                        ? 'bg-white dark:bg-gray-800 shadow text-primary-600'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-600'
                      }`
                    }
                  >
                    <div className="flex items-center justify-center gap-2">
                      <method.icon className="w-5 h-5" />
                      {method.name}
                    </div>
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels>
                <Tab.Panel>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Amount Paid ($)
                      </label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="input-primary"
                        placeholder="Enter amount"
                        min={cart.total}
                        step="0.01"
                        autoFocus
                      />
                    </div>

                    {paidAmount && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Change: ${calculateChange()}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleCashPayment}
                      disabled={!paidAmount || processing}
                      className="btn-primary w-full py-3 text-lg"
                    >
                      {processing ? 'Processing...' : 'Complete Cash Payment'}
                    </button>
                  </div>
                </Tab.Panel>

                <Tab.Panel>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-center mb-4">Insert or Tap Card</p>
                      <div className="flex justify-center">
                        <CreditCardIcon className="w-24 h-24 text-gray-400" />
                      </div>
                    </div>

                    <button
                      onClick={handleCardPayment}
                      disabled={processing}
                      className="btn-primary w-full py-3 text-lg"
                    >
                      {processing ? 'Processing...' : 'Process Card Payment'}
                    </button>
                  </div>
                </Tab.Panel>

                <Tab.Panel>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                      <p className="mb-4">Scan QR Code to Pay</p>
                      <div className="flex justify-center">
                        <div className="w-48 h-48 bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600">QR Code</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleUPIPayment}
                      disabled={processing}
                      className="btn-primary w-full py-3 text-lg"
                    >
                      {processing ? 'Processing...' : 'Confirm UPI Payment'}
                    </button>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="btn-secondary"
                disabled={processing}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PaymentModal;