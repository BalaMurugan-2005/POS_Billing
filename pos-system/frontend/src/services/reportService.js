import api from './api';

export const reportService = {
  // Uses Spring Boot /transactions/stats/today
  getDailySales: async (date) => {
    try {
      const response = await api.get('/transactions/stats/today');
      const data = response.data;
      return {
        totalSales: data.sales || 0,
        transactionCount: data.count || 0,
        itemsSold: 0,
        activeCashiers: 0,
      };
    } catch (e) {
      return { totalSales: 0, transactionCount: 0, itemsSold: 0, activeCashiers: 0 };
    }
  },

  // Fetch all transactions and build hourly trend for today
  getRevenueTrends: async (period = 'today') => {
    try {
      const response = await api.get('/transactions', { params: { page: 0, size: 200, sortBy: 'createdAt', sortDir: 'asc' } });
      const transactions = response.data.content || response.data || [];
      const today = new Date().toISOString().split('T')[0];

      // Group by hour
      const hourMap = {};
      transactions.forEach(t => {
        if (!t.createdAt) return;
        const txDate = t.createdAt.split('T')[0];
        if (txDate !== today) return;
        const hour = new Date(t.createdAt).getHours();
        const label = `${hour}:00`;
        hourMap[label] = (hourMap[label] || 0) + (parseFloat(t.total) || 0);
      });

      const result = Object.entries(hourMap)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([time, sales]) => ({ time, sales: parseFloat(sales.toFixed(2)) }));

      return result.length > 0 ? result : [];
    } catch (e) {
      return [];
    }
  },

  // Top products by quantity sold (derived from recent transactions)
  getProductPerformance: async (params = {}) => {
    try {
      const response = await api.get('/transactions', { params: { page: 0, size: 200 } });
      const transactions = response.data.content || response.data || [];

      const productMap = {};
      transactions.forEach(t => {
        (t.items || []).forEach(item => {
          const name = item.productName || 'Unknown';
          productMap[name] = (productMap[name] || 0) + (item.quantity || 0);
        });
      });

      return Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
    } catch (e) {
      return [];
    }
  },

  getMonthlySales: async () => ({ totalSales: 0 }),
  getInventoryReport: async () => ({}),
};
