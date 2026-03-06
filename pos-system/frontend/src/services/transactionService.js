import api from './api';

export const transactionService = {
  createTransaction: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  voidTransaction: async (id, reason) => {
    const response = await api.post(`/transactions/${id}/void`, { reason });
    return response.data;
  },

  sendReceipt: async (id, email) => {
    const response = await api.post(`/transactions/${id}/receipt`, { email });
    return response.data;
  }
};