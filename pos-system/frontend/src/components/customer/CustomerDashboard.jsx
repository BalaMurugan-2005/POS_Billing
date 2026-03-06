import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../hooks/useAuth';
import { transactionService } from '../../services/transactionService';
import { format } from 'date-fns';
import { DocumentTextIcon, QrCodeIcon, UserIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { productService } from '../../services/productService';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('qr');
  const { cart, addItem, removeItem, updateQuantity } = useCart();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactionHistory();
    }
  }, [activeTab]);

  const fetchTransactionHistory = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      setTransactions([
        {
          id: 'TXN001',
          date: new Date(),
          total: 125.50,
          items: 5,
          status: 'completed',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
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

      {/* QR Code Tab */}
      {activeTab === 'qr' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Your QR Code</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Show this QR code to the cashier for faster checkout
            </p>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={JSON.stringify({
                    type: 'LOYALTY_CART',
                    customerId: user?.id,
                    loyaltyNumber: user?.loyaltyNumber || `LOY${user?.id}`,
                    name: user?.name,
                    items: cart.items.map(i => ({
                      productId: i.productId,
                      quantity: i.quantity,
                      weight: i.weight
                    }))
                  })}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <button
              onClick={() => {
                // Download QR code
                const canvas = document.querySelector('canvas');
                const url = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'qr-code.png';
                link.href = url;
                link.click();
              }}
              className="btn-primary"
            >
              Download QR Code
            </button>
            {cart.items.length > 0 && (
              <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-700 dark:text-primary-300 text-sm">
                Your cart data is included in this QR code.
                Scan it at the cashier for checkout.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shopping Tab */}
      {activeTab === 'shopping' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-primary-600">Start Shopping</h2>
            <div className="relative">
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

            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden divide-y">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">${p.price.toFixed(2)}</p>
                    </div>
                    <span className="text-primary-500 text-sm font-semibold">+ Add</span>
                  </button>
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
                Bag is empty. Start scanning/adding products.
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
                          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >-</button>
                        <span className="px-2 text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >+</button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-500 text-sm"
                      >Remove</button>
                    </div>
                  </div>
                ))}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                  <div className="font-bold text-lg">Total: ${cart.total.toFixed(2)}</div>
                  <button
                    onClick={() => setActiveTab('qr')}
                    className="btn-primary"
                  >
                    Get Checkout QR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Purchase History</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No transactions found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{transaction.id}</p>
                      <p className="text-sm text-gray-500">
                        {format(transaction.date, 'PPP')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {transaction.items} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${transaction.total.toFixed(2)}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
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
      )}
    </div>
  );
};

export default CustomerDashboard;