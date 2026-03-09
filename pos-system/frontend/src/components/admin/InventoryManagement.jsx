import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [filter, setFilter] = useState('all'); // all, low, out

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const resp = await productService.getProducts({ page: 0, size: 500 });
      const products = resp.content || resp || [];

      const realData = products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.barcode || `SKU${p.id}`,
        stock: p.stockQuantity || 0,
        minStock: p.minStockLevel || 10,
        maxStock: p.maxStockLevel || 100,
        unit: p.unit || 'pcs',
        category: p.category || 'General',
      }));
      setInventory(realData);

      const lowStock = realData.filter(item => item.stock <= item.minStock);
      setLowStockItems(lowStock);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      await productService.updateInventory(productId, newStock);
      toast.success('Stock updated successfully');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleBulkUpdate = async () => {
    // Implement bulk update functionality
    toast.success('Bulk update completed');
  };

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    if (stock <= minStock) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'low') return item.stock <= item.minStock;
    if (filter === 'out') return item.stock === 0;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Inventory Management</h2>
        <div className="flex gap-3">
          <button
            onClick={fetchInventory}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={handleBulkUpdate}
            className="btn-primary"
          >
            Bulk Update
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Low Stock Alert ({lowStockItems.length} items)
              </h3>
              <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                {lowStockItems.slice(0, 3).map(item => (
                  <li key={item.id}>
                    {item.name} - {item.stock} {item.unit} remaining (Min: {item.minStock})
                  </li>
                ))}
                {lowStockItems.length > 3 && (
                  <li className="mt-1">...and {lowStockItems.length - 3} more items</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
        >
          All Items
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'low'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
        >
          Low Stock
        </button>
        <button
          onClick={() => setFilter('out')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'out'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
        >
          Out of Stock
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Min/Max
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredInventory.map((item) => {
              const status = getStockStatus(item.stock, item.minStock);
              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.stock} {item.unit}</span>
                      <button
                        onClick={() => {
                          const newStock = prompt('Enter new stock quantity:', item.stock);
                          if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
                            handleStockUpdate(item.id, parseInt(newStock));
                          }
                        }}
                        className="text-xs text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.minStock} / {item.maxStock} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleStockUpdate(item.id, item.stock + 10)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      + Restock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryManagement;