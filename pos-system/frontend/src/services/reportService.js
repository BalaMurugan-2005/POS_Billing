import axios from 'axios';

const djangoApi = axios.create({
  baseURL: import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

djangoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const reportService = {
  getDailySales: async (date) => {
    // using reporting endpoint implemented in django
    const response = await djangoApi.get('/reporting/daily_sales/', { params: { date } });

    // map to frontend expected format if needed
    const data = response.data;
    return {
      totalSales: data.summary?.total_sales || 0,
      transactionCount: data.summary?.total_transactions || 0,
      itemsSold: 0,
      activeCashiers: 0,
      ...data
    };
  },

  getMonthlySales: async (month, year) => {
    const response = await djangoApi.get('/reporting/monthly_sales/', { params: { month, year } });
    return response.data;
  },

  getProductPerformance: async (params = {}) => {
    const response = await djangoApi.get('/reporting/product_performance/', { params });
    // map top products format for AdminDashboard pie chart
    const data = response.data;
    if (data && data.products) {
      return data.products.map(p => ({
        name: p.name,
        value: p.quantity_sold
      }));
    }
    return [];
  },

  getInventoryReport: async () => {
    const response = await djangoApi.get('/reporting/inventory_report/');
    return response.data;
  },

  getRevenueTrends: async (period = 'week') => {
    // call analytics proxy for sales trend
    const response = await djangoApi.get('/analytics/sales_trend/', { params: { period } });
    const data = response.data;
    if (Array.isArray(data)) {
      return data.map(d => ({
        time: d.date,
        sales: d.sales
      }));
    }
    return [];
  }
};