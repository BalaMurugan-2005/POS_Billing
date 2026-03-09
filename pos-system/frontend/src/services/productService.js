import api from './api';

export const productService = {
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data.content || response.data;
  },

  getProductByBarcode: async (barcode) => {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  searchProducts: async (query) => {
    const response = await api.get('/products/search', { params: { q: query } });
    return response.data.content || response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  checkInventory: async (productId) => {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },

  updateInventory: async (productId, quantity) => {
    const response = await api.patch(`/products/${productId}/stock`, null, {
      params: { quantity, type: 'SET' }
    });
    return response.data;
  }
};