import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../hooks/useAuth';
import { transactionService } from '../../services/transactionService';
import { format } from 'date-fns';
import { DocumentTextIcon, QrCodeIcon, UserIcon, ShoppingBagIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { productService } from '../../services/productService';
import { useCart } from '../../hooks/useCart';
import { paymentRequestService } from '../../services/paymentRequestService';
import Receipt from '../pos/Receipt';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('shopping');
  const { cart, addItem, removeItem, updateQuantity, clearCart } = useCart();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null); // { id, amount, method, items }

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactionHistory();
    }
    if (activeTab === 'shopping') {
      fetchProducts();
    }
  }, [activeTab]);

  // Listen for payment requests from the cashier (Polling backend)
  useEffect(() => {
    if (!user?.id) return;

    const pollPaymentRequests = async () => {
      try {
        const requests = await paymentRequestService.getActiveRequests(user.id);
        if (requests.length > 0 && !paymentRequest) {
          const latest = requests[0];
          setPaymentRequest(latest);
          setActiveTab('billing');
          toast('New Payment Request Received!', {
            icon: '💳',
            duration: 4000
          });
        }
      } catch (error) {
        console.error('Failed to poll payment requests:', error);
      }
    };

    const interval = setInterval(pollPaymentRequests, 3000);
    return () => clearInterval(interval);
  }, [user, paymentRequest]);

  // Handle automatic history reflection (Poll every 10 seconds if active)
  useEffect(() => {
    if (!user?.id || activeTab !== 'history') return;

    const interval = setInterval(fetchTransactionHistory, 10000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  const handleConfirmPayment = async () => {
    toast.loading('Processing payment...', { id: 'paying' });
    try {
      await paymentRequestService.updateStatus(paymentRequest.requestId, 'COMPLETED');
      toast.success('Payment successful!', { id: 'paying' });
      setPaymentRequest(null);
      clearCart(); // Clear cart to reset QR code and shopping bag
      fetchTransactionHistory(); // Refresh history
    } catch (error) {
      toast.error('Payment failed', { id: 'paying' });
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Use the actual API endpoint
      const response = await transactionService.getTransactionsByCustomer(user.id);

      const mapped = response.map(t => ({
        id: t.transactionNumber || t.id,
        date: t.createdAt,
        total: parseFloat(t.total || t.totalAmount || 0),
        itemCount: t.items?.length || 0,
        paymentMethod: t.paymentMethod || 'cash',
        status: (t.status || 'completed').toLowerCase(),
        items: t.items || [],
        subtotal: parseFloat(t.subtotal || t.total || 0),
        tax: parseFloat(t.tax || 0),
        discount: parseFloat(t.discount || 0),
        customer: t.customer || { name: user.name, email: user.email },
        cashier: t.cashier || { name: 'System' },
        paidAmount: parseFloat(t.paidAmount || t.totalAmount || t.total || 0),
        change: parseFloat(t.change || 0)
      }));
      setTransactions(mapped);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Could not load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await productService.searchProducts(query);
      setSearchResults(data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCart = (product) => {
    if (product.isWeighted) {
      const weight = prompt(`Enter weight (kg) for ${product.name}:`);
      if (weight && !isNaN(weight)) {
        addItem(product, 1, parseFloat(weight));
      }
    } else {
      addItem(product);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile and view purchase history
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-4 px-1 flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'qr'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <QrCodeIcon className="w-5 h-5" />
            My QR Code
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`pb-4 px-1 flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'shopping'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <ShoppingBagIcon className="w-5 h-5" />
            Self Shopping
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-4 px-1 flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'billing'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <CreditCardIcon className="w-5 h-5" />
            Billing
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-1 flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'history'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <DocumentTextIcon className="w-5 h-5" />
            Purchase History
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-1 flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'profile'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <UserIcon className="w-5 h-5" />
            Profile
          </button>
        </nav>
      </div>

      {/* QR Tab */}
      {
        activeTab === 'qr' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold">Your Customer ID</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Show this QR code at the counter to identify yourself
            </p>

            <div className="bg-white p-6 rounded-2xl shadow-inner inline-block border-4 border-primary-500/20">
              <QRCodeCanvas
                id="identity-qr-canvas"
                value={`LOY${user?.id}`} // Simple loyalty ID format
                size={256}
                level="M"
                includeMargin={true}
              />
            </div>

            <div className="max-w-xs mx-auto space-y-2">
              <p className="font-mono text-xl font-bold tracking-widest text-primary-600">
                {user?.loyaltyNumber || `LOY${user?.id}`}
              </p>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-tighter">
                Member ID
              </p>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl flex items-center justify-between max-w-sm mx-auto">
              <div className="text-left">
                <p className="text-xs text-primary-500 font-bold uppercase">Membership Tier</p>
                <p className="text-lg font-black text-primary-700 dark:text-primary-300">BRONZE MEMBER</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-500 font-bold uppercase">Available Points</p>
                <p className="text-lg font-black text-primary-700 dark:text-primary-300">0 pts</p>
              </div>
            </div>
          </div>
        )
      }

      {/* Shopping Tab */}
      {
        activeTab === 'shopping' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary-600">Browse Products</h2>
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search products to add..."
                  className="input-primary"
                  value={searchQuery}
                  onChange={(e) => handleProductSearch(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(searchQuery ? searchResults : products).map(p => (
                    <div key={p.id} className="border dark:border-gray-700 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-primary-600 font-semibold">${p.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 capitalize">{p.categoryName || 'General'}</p>
                      </div>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"
                      >
                        <ShoppingBagIcon className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold">Your Shopping Bag</h3>
                <span className="text-sm font-medium text-gray-500">
                  {cart.items.length} items
                </span>
              </div>

              {cart.items.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Bag is empty. Pick some items to start shopping!
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {cart.items.map(item => (
                    <div key={item.productId} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded dark:border-gray-600">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >-</button>
                          <span className="px-2 text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >+</button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 text-sm hover:underline"
                        >Remove</button>
                      </div>
                    </div>
                  ))}
                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-semibold">${cart.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t dark:border-gray-700 pt-4">
                      <div className="font-bold text-xl">Total: ${cart.total.toFixed(2)}</div>
                      <button
                        onClick={() => setActiveTab('billing')}
                        className="btn-primary flex items-center gap-2"
                      >
                        Process to Billing <CreditCardIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Billing Tab */}
      {
        activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Billing Summary</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Review your items and show the code to the cashier
              </p>

              <div className="max-w-md mx-auto border dark:border-gray-700 rounded-xl overflow-hidden mb-8">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b dark:border-gray-700">
                  <h3 className="font-bold uppercase tracking-wider text-sm">Cart Items</h3>
                </div>
                <div className="p-4 space-y-3">
                  {cart.items.length > 0 ? (
                    cart.items.map(item => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No items in cart</p>
                  )}
                  <div className="border-t dark:border-gray-700 pt-3 mt-3 flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span className="text-primary-600">${cart.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-inner inline-block border-4 border-primary-500/20 mb-6">
                <QRCodeCanvas
                  id="billing-qr-canvas"
                  value={JSON.stringify({
                    type: 'LOYALTY_CART',
                    customerId: user?.id,
                    loyaltyNumber: user?.loyaltyNumber || `LOY${user?.id}`,
                    name: user?.name,
                    items: cart.items.map(i => ({
                      productId: i.productId,
                      quantity: i.quantity,
                      weight: i.weight
                    })),
                    total: cart.total
                  })}
                  size={256}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="flex flex-col items-center gap-4">
                <p className="text-sm font-medium text-gray-500 animate-pulse">
                  Scan at any cashier counter to complete payment
                </p>
                <button
                  onClick={() => {
                    const canvas = document.getElementById('billing-qr-canvas');
                    if (canvas) {
                      const url = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = `billing-qr-${user?.name || 'customer'}.png`;
                      link.href = url;
                      link.click();
                    } else {
                      // Assuming 'toast' is available globally or imported
                      // If not, you might want to use a simple alert or state for error message
                      toast.error('Could not generate download image');
                    }
                  }}
                  className="btn-primary"
                >
                  Save QR Code
                </button>
                <button
                  onClick={() => setActiveTab('shopping')}
                  className="text-primary-600 hover:underline font-medium"
                >
                  &larr; Back to Shopping
                </button>
              </div>

              {/* Payment Request Overlay */}
              {paymentRequest && (
                <div className="mt-8 p-6 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500 rounded-2xl animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-center gap-3 mb-4 text-primary-600">
                    <CreditCardIcon className="w-8 h-8" />
                    <h3 className="text-xl font-bold">Incoming Payment Request</h3>
                  </div>
                  <p className="mb-6 text-gray-600 dark:text-gray-400">
                    The cashier has sent a request for <b>{paymentRequest.method.toUpperCase()}</b> payment.
                  </p>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center text-2xl font-black">
                    <span>Total Due:</span>
                    <span className="text-primary-600 text-3xl">${paymentRequest.amount.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        localStorage.removeItem('active_payment_request');
                        setPaymentRequest(null);
                        toast.error('Payment declined');
                      }}
                      className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={handleConfirmPayment}
                      className="flex-[2] py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all scale-105 active:scale-95"
                    >
                      Pay Now (${paymentRequest.amount.toFixed(2)})
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-gray-400">
                    Transaction ID: {paymentRequest.requestId}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Purchase History Tab */}
      {
        activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Purchase History</h2>
              <button
                onClick={fetchTransactionHistory}
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium">No purchase history yet</p>
                <p className="text-sm mt-1">Complete a checkout to see your bills here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <p className="font-bold font-mono text-primary-600 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        Txn #{tx.id}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {tx.date ? new Date(tx.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">
                        {tx.paymentMethod || 'Cash'} • {tx.itemCount} item(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-800 dark:text-white">
                          ₹{parseFloat(tx.total || 0).toFixed(2)}
                        </p>
                        <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                          ${tx.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600'}`}>
                          {tx.status}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedTransaction(tx)}
                        className="btn-secondary whitespace-nowrap"
                      >
                        View Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Receipt
              isOpen={!!selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
              transaction={selectedTransaction}
            />
          </div>
        )
      }

      {/* Profile Tab */}
      {
        activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>

            <form className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  defaultValue={user?.phone}
                  className="input-primary"
                />
              </div>
              <button type="submit" className="btn-primary">
                Update Profile
              </button>
            </form>
          </div>
        )
      }
    </div >
  );
};

export default CustomerDashboard;