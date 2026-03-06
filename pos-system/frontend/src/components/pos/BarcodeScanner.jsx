import React, { useState, useRef } from 'react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { useCart } from '../../hooks/useCart';
import { MagnifyingGlassIcon, CameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import VisualScanner from './VisualScanner';

const BarcodeScanner = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isCustomerSearch, setIsCustomerSearch] = useState(false);
  const [showVisualScanner, setShowVisualScanner] = useState(false);
  const inputRef = useRef(null);
  const { addItem, cart, setCustomer, removeCustomer, clearCart } = useCart();

  const handleScan = async (barcode, isManual = false) => {
    setIsScanning(true);
    try {
      // 1. Check if it's a JSON QR code (Customer Cart)
      if (barcode.startsWith('{')) {
        try {
          const data = JSON.parse(barcode);
          if (data.type === 'LOYALTY_CART') {
            const customer = await customerService.getCustomerByLoyalty(data.loyaltyNumber);
            setCustomer(customer);

            // Import items
            if (data.items && data.items.length > 0) {
              clearCart(); // Clear current session before importing customer's bag
              toast.loading('Importing customer items...', { id: 'import' });
              for (const item of data.items) {
                try {
                  const product = await productService.getProductById(item.productId);
                  addItem(product, item.quantity, item.weight);
                } catch (e) {
                  console.error('Failed to import product:', item.productId);
                }
              }
              toast.success('Shopping bag imported!', { id: 'import' });
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
    </div>
  );
};

export default BarcodeScanner;