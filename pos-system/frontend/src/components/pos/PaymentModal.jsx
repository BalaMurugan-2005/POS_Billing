import React, { useState } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { useCart } from '../../hooks/useCart';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { transactionService } from '../../services/transactionService';
import { paymentRequestService } from '../../services/paymentRequestService';
import { motion } from 'framer-motion';
import { BanknotesIcon, CreditCardIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, onComplete }) => {
  const { cart, processPayment, clearCart } = useCart();
  const { isOnline } = useOfflineSync();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [requestStatus, setRequestStatus] = useState('idle'); // idle, waiting, success

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
      if (window.confirm(`Amount paid ($${paid}) is less than total ($${cart.total}). Process anyway as a partial/credit payment?`)) {
        await processPayment('cash', paid);
        await completeTransaction();
      } else {
        toast.error('Payment cancelled');
      }
      return;
    }

    await processPayment('cash', paid);
    await completeTransaction();
  };

  const sendDigitalRequest = async (method) => {
    if (!cart.customer) {
      toast.error('Cannot send request: No customer associated with this cart');
      return;
    }

    setIsRequestSent(true);
    setRequestStatus('waiting');

    const loadingToastId = toast.loading(`Sending ${method.toUpperCase()} request to customer device...`, {
      style: { minWidth: '300px' }
    });

    try {
      // Backend createRequest expects userId (the user table ID), not the customer record ID.
      // cart.customer.userId is set when verified via getCustomerByUserId which returns CustomerDTO.
      const customerUserId = cart.customer.userId || cart.customer.id;
      const request = await paymentRequestService.createRequest(customerUserId, cart.total, method);

      const paymentResult = await paymentRequestService.waitForPayment(request.requestId);

      setRequestStatus('success');
      toast.success(`Payment Received from ${cart.customer.name}!`, { id: loadingToastId });
      processPayment(method, cart.total);

    } catch (error) {
      setIsRequestSent(false);
      setRequestStatus('idle');
      const errMsg = error.response?.data?.message || error.message || 'Payment request failed';
      toast.error(errMsg, { id: loadingToastId });
    }
  };

  const handleCardPayment = () => sendDigitalRequest('card');
  const handleUPIPayment = () => sendDigitalRequest('upi');

  const completeTransaction = async () => {
    setProcessing(true);

    try {
      const transactionData = {
        items: cart.items.map(item => {
          const itemSubtotal = parseFloat((item.price * item.quantity).toFixed(2));
          const itemTax = parseFloat(((item.taxRate || 0) * itemSubtotal / 100).toFixed(2));
          return {
            productId: item.productId,
            quantity: item.quantity,
            weight: item.weight || null,
            price: item.price,
            subtotal: itemSubtotal,
            tax: itemTax,
          };
        }),
        subtotal: cart.subtotal,
        tax: cart.tax,
        discount: cart.discount || 0,
        total: cart.total,
        paymentMethod: cart.paymentMethod,
        paidAmount: cart.paidAmount,
        change: cart.change || 0,
        // TransactionService does customerRepository.findById(customer.id) - needs customer table ID
        customer: cart.customer ? { id: cart.customer.id } : null,
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
                    disabled={isRequestSent}
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                      ${selected
                        ? 'bg-white dark:bg-gray-800 shadow text-primary-600'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-600'
                      } ${isRequestSent ? 'opacity-50 cursor-not-allowed' : ''}`
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
                  <div className="space-y-6">
                    {!isRequestSent ? (
                      <div className="text-center py-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl mb-6">
                          <CreditCardIcon className="w-20 h-20 text-primary-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">
                            Send a request to the customer's card terminal or mobile device.
                          </p>
                        </div>
                        <button
                          onClick={handleCardPayment}
                          className="btn-primary w-full py-4 text-xl shadow-lg"
                        >
                          Send Card Payment Request
                        </button>
                      </div>
                    ) : (
                      <DigitalWaitingState status={requestStatus} onComplete={completeTransaction} />
                    )}
                  </div>
                </Tab.Panel>

                <Tab.Panel>
                  <div className="space-y-6">
                    {!isRequestSent ? (
                      <div className="text-center py-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl mb-6">
                          <DevicePhoneMobileIcon className="w-20 h-20 text-primary-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">
                            The customer will receive a GPay/UPI notification to pay <b>${cart.total.toFixed(2)}</b>
                          </p>
                        </div>
                        <button
                          onClick={handleUPIPayment}
                          className="btn-primary w-full py-4 text-xl shadow-lg"
                        >
                          Send GPay / UPI Request
                        </button>
                      </div>
                    ) : (
                      <DigitalWaitingState status={requestStatus} onComplete={completeTransaction} />
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>

            <div className="mt-8 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
              <span className="text-gray-500 text-sm">Waiting for action...</span>
              <button
                onClick={() => {
                  setIsRequestSent(false);
                  setRequestStatus('idle');
                  onClose();
                }}
                className="text-red-500 font-medium hover:underline"
                disabled={processing}
              >
                Cancel Transaction
              </button>
            </div>
          </motion.div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const DigitalWaitingState = ({ status, onComplete }) => {
  return (
    <div className="text-center py-8 animate-in fade-in duration-500">
      {status === 'waiting' ? (
        <div className="space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold">Request Sent!</h3>
          <p className="text-gray-500 animate-pulse">Waiting for customer to complete payment on their device...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-600">Payment Verified!</h3>
            <p className="text-gray-500">The customer has successfully paid the amount.</p>
          </div>
          <button
            onClick={onComplete}
            className="btn-primary w-full py-4 text-xl shadow-lg bg-green-600 hover:bg-green-700 border-none"
          >
            Finalize & Clear Table
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentModal;