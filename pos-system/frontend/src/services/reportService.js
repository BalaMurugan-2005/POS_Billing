import api from './api';
import djangoApi from './djangoApi';

export const reportService = {
  // Fetch dashboard / daily summary from Django or Spring Boot fallback
  getDailySales: async (date) => {
    try {
      const response = await djangoApi.get('/analytics/dashboard/');
      const data = response.data?.today || {};
      return {
        totalSales: data.sales || 0,
        transactionCount: data.transactions || 0,
        itemsSold: 0,
        activeCashiers: 0,
      };
    } catch (djangoErr) {
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
    }
  },

  // Fetch hourly / revenue trends from Django
  getRevenueTrends: async (period = 'today') => {
    try {
      const response = await djangoApi.get('/analytics/hourly_sales/');
      const items = response.data || [];
      return items.map(item => ({
        time: item.hour,
        sales: item.sales
      }));
    } catch (djangoErr) {
      try {
        const response = await api.get('/transactions', { params: { page: 0, size: 200, sortBy: 'createdAt', sortDir: 'asc' } });
        const transactions = response.data.content || response.data || [];
        const today = new Date().toISOString().split('T')[0];

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

        return result;
      } catch (e) {
        return [];
      }
    }
  },

  // Top products from Django analytics
  getProductPerformance: async (params = {}) => {
    try {
      const response = await djangoApi.get('/reporting/product_performance/');
      const products = response.data?.products || [];
      return products.slice(0, 5).map(p => ({
        name: p.name,
        value: p.quantity_sold
      }));
    } catch (djangoErr) {
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
    }
  },

  getMonthlySales: async () => {
    try {
      const response = await djangoApi.get('/reporting/monthly_sales/');
      return response.data;
    } catch (e) {
      return { totalSales: 0 };
    }
  },

  getInventoryReport: async () => {
    try {
      const response = await djangoApi.get('/reporting/inventory_report/');
      return response.data;
    } catch (e) {
      return {};
    }
  },
};
