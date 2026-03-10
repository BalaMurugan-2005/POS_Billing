import React, { useState, useRef } from 'react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { useCart } from '../../hooks/useCart';
import { MagnifyingGlassIcon, CameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import VisualScanner from './VisualScanner';

const BarcodeScanner = ({ onCheckout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isCustomerSearch, setIsCustomerSearch] = useState(false);
  const [showVisualScanner, setShowVisualScanner] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef(null);
  const { addItem, cart, setCustomer, removeCustomer, clearCart, importVerifiedCart } = useCart();

  const handleScan = async (barcode, isManual = false) => {
    setIsScanning(true);
    try {
      // 1. Check if it's a JSON QR code (Customer Cart)
      if (barcode.startsWith('{')) {
        try {
          const data = JSON.parse(barcode);
          if (data.type === 'LOYALTY_CART') {
            setIsVerifying(true);
            toast.loading('Loading customer profile for verification...', { id: 'verify' });
            try {
              // Try identifying by customerId (userId) first, then fallback to loyaltyNumber
              let customer;
              try {
                customer = data.customerId
                  ? await customerService.getCustomerByUserId(data.customerId)
                  : await customerService.getCustomerByLoyalty(data.loyaltyNumber);
              } catch (err) {
                // Cashiers/Admins scanning their own testing QR won't have a Customer profile.
                // Fallback to the basic info encoded in the QR.
                console.warn('Customer profile not found on server, using QR data fallback');
                customer = {
                  id: data.customerId || null,
                  userId: data.customerId || null,
                  name: data.name || 'Walk-in Customer',
                  loyaltyNumber: data.loyaltyNumber || 'N/A',
                  loyaltyPoints: 0,
                  tier: 'NONE'
                };
              }

              // Load product details for all items to verify
              const itemDetails = await Promise.all(
                (data.items || []).map(async (item) => {
                  try {
                    const product = await productService.getProductById(item.productId);
                    return { ...item, product };
                  } catch (e) {
                    return { ...item, product: { name: 'Unknown Product', price: 0 } };
                  }
                })
              );

              setVerificationData({
                customer,
                items: itemDetails,
                total: data.total
              });
              toast.success('Customer profile loaded', { id: 'verify' });
            } catch (error) {
              console.error('Customer verification error:', error);
              const status = error.response?.status;
              if (status === 403 || status === 401) {
                toast.error('Access denied - cashier cannot verify this customer. Check server permissions.', { id: 'verify' });
              } else if (status === 404) {
                toast.error('Customer not found in database', { id: 'verify' });
              } else {
                toast.error('Not able to verify the customer', { id: 'verify' });
              }
              setIsVerifying(false);
            }
            setSearchTerm('');
            return;
          }
        } catch (e) {
          console.error('Failed to parse QR:', e);
        }
      }

      // 2. Check if it's a plain loyalty ID
      if (barcode.startsWith('LOY')) {
        const customer = await customerService.getCustomerByLoyalty(barcode);
        setCustomer(customer);
        setSearchTerm('');
        return;
      }

      // 3. Regular product scan
      if (!cart.customer) {
        toast.error('Please scan customer QR code first');
        setSearchTerm('');
        return;
      }

      if (isManual && barcode.length < 8) {
        handleSearch(barcode);
        return;
      }

      const product = await productService.getProductByBarcode(barcode);
      if (product.isWeighted) {
        openWeightModal(product);
      } else {
        addItem(product);
      }
      setSearchTerm('');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Not found in database');
        if (!barcode.startsWith('LOY') && !barcode.startsWith('{')) {
          setManualMode(true);
        }
      } else {
        toast.error('Error scanning code');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSearch = async (query) => {
    if (query.length < 2) return;

    try {
      const results = await productService.searchProducts(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleManualAdd = (product) => {
    if (product.isWeighted) {
      openWeightModal(product);
    } else {
      addItem(product);
    }
    setShowResults(false);
    setSearchTerm('');
  };

  const openWeightModal = (product) => {
    // Implement weight modal logic
    const weight = prompt(`Enter weight (kg) for ${product.name}:`);
    if (weight && !isNaN(weight) && weight > 0) {
      addItem(product, 1, parseFloat(weight));
    }
  };

  React.useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) inputRef.current.focus();
    };
    focusInput();
    // Refocus on any click outside if needed, or just standard autoFocus
    window.addEventListener('click', focusInput);
    return () => window.removeEventListener('click', focusInput);
  }, [cart.customer]);

  const handleVisualScan = (data) => {
    handleScan(data);
    setShowVisualScanner(false);
  };

  const handleVerifyProceed = () => {
    if (!verificationData) return;

    importVerifiedCart(verificationData.customer, verificationData.items);

    toast.success('Customer and items verified successfully!');
    setVerificationData(null);
    setIsVerifying(false);

    // Automatically trigger checkout for the customer
    if (onCheckout) {
      setTimeout(() => onCheckout(), 500);
    }
  };

  useBarcodeScanner(handleScan);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder={
              isScanning
                ? 'Scanning...'
                : cart.customer
                  ? 'Scan Product Barcode...'
                  : 'Scan Customer QR First...'
            }
            className={`input-primary pl-10 ${!cart.customer ? 'ring-2 ring-primary-500' : ''}`}
            disabled={isScanning}
            autoFocus
          />
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <button
            onClick={() => setShowVisualScanner(true)}
            className="absolute right-3 top-3 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-primary-500"
            title="Use Camera Scanner"
          >
            <CameraIcon className="w-5 h-5" />
          </button>
        </div>

        {!cart.customer ? (
          <div className="flex gap-2">
            <button
              onClick={() => setManualMode(!manualMode)}
              className="btn-secondary whitespace-nowrap"
            >
              {manualMode ? 'Scanner Mode' : 'Manual Entry'}
            </button>
          </div>
        ) : (
          <button
            onClick={removeCustomer}
            className="btn-outline-red text-sm py-2 px-3"
          >
            New Customer
          </button>
        )}
      </div>

      {/* Visual cue for customer requirement */}
      {!cart.customer && !isScanning && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-between">
          <span className="text-sm text-primary-700 dark:text-primary-300">
            Waiting for customer QR scan...
          </span>
          <span className="text-xs text-primary-500 font-mono">
            Hint: Codes starting with 'LOY'
          </span>
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {searchResults.map((product) => (
            <button
              key={product.id}
              onClick={() => handleManualAdd(product)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0 border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {product.barcode} • Stock: {product.stock}
                  </p>
                </div>
                <p className="font-semibold">${product.price.toFixed(2)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <VisualScanner
        isOpen={showVisualScanner}
        onClose={() => setShowVisualScanner(false)}
        onScan={handleVisualScan}
      />

      {/* Verification Modal */}
      {verificationData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-primary-600 p-6 text-white">
              <h3 className="text-xl font-bold">Verify Customer & Cart</h3>
              <p className="opacity-90 text-sm mt-1">Please confirm the customer profile and scanned items</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Profile */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <span className="text-xl font-bold">{(verificationData.customer.name || 'C')[0]}</span>
                </div>
                <div>
                  <p className="font-bold text-lg">{verificationData.customer.name || 'Guest Customer'}</p>
                  <p className="text-sm text-gray-500">{verificationData.customer.email || 'No email provided'}</p>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium mt-1 inline-block">
                    {verificationData.customer.loyaltyNumber || 'Member'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-500 mb-3 px-1">Items to Verify</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {verificationData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-gray-400">${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">x{item.quantity}</span>
                        {item.weight && <span className="text-xs text-gray-400 block">{item.weight}kg</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-4 border-t dark:border-gray-700">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Cart Total:</span>
                  <span className="text-primary-600">${verificationData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900/30 flex gap-3 border-t dark:border-gray-700">
              <button
                onClick={() => setVerificationData(null)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyProceed}
                className="flex-[2] py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
              >
                Verify & Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;