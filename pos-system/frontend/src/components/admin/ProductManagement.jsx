import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    costPrice: '',
    taxRate: '',
    stockQuantity: '',
    category: '',
    isWeighted: false,
    pricePerKg: '',
    minStockLevel: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean and sanitize data before sending
      const dataToSubmit = {
        ...formData,
        price: formData.price === '' ? 0 : parseFloat(formData.price),
        costPrice: formData.costPrice === '' ? 0 : parseFloat(formData.costPrice),
        taxRate: formData.taxRate === '' ? 0 : parseFloat(formData.taxRate),
        stockQuantity: formData.stockQuantity === '' ? 0 : parseInt(formData.stockQuantity),
        minStockLevel: formData.minStockLevel === '' ? 0 : parseInt(formData.minStockLevel),
        pricePerKg: formData.isWeighted && formData.pricePerKg !== '' ? parseFloat(formData.pricePerKg) : null,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, dataToSubmit);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(dataToSubmit);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Submission error:', error);
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(id);
        toast.success('Product deleted');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: '',
      price: '',
      costPrice: '',
      taxRate: '',
      stockQuantity: '',
      category: '',
      isWeighted: false,
      pricePerKg: '',
      minStockLevel: '',
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Product Management</h2>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Barcode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">{product.name}</div>
                  {product.isWeighted && (
                    <span className="text-xs text-gray-500">Weighted</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {product.barcode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${product.stockQuantity <= product.minStockLevel
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                    {product.stockQuantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(product)}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
            <Dialog.Title className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Min Stock</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-primary"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isWeighted}
                      onChange={(e) => setFormData({ ...formData, isWeighted: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Weighted Product</span>
                  </label>
                </div>
                {formData.isWeighted && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Price per kg ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pricePerKg}
                      onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                      className="input-primary"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default ProductManagement;