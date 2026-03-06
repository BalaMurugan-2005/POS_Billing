import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../hooks/useCart';
import { debounce } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProductSearch = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const searchProducts = debounce(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await productService.searchProducts(searchQuery);
      setResults(data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    searchProducts(query);
  }, [query]);

  const handleAddToCart = (product) => {
    if (product.isWeighted) {
      // Open weight modal - you'll need to handle this
      toast('Please scan or enter weight for this product');
    } else {
      addItem(product);
      toast.success(`${product.name} added to cart`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Search Products</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, barcode, or category..."
              className="input-primary pl-10"
              autoFocus
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {product.barcode} • Stock: {product.stockQuantity}
                      </p>
                      {product.isWeighted && (
                        <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          Weighted
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ${product.price.toFixed(2)}
                      </p>
                      {product.isWeighted && (
                        <p className="text-xs text-gray-500">
                          ${product.pricePerKg}/kg
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No products found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;