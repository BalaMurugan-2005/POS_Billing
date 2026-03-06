import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductManagement from '../components/admin/ProductManagement';
import UserManagement from '../components/admin/UserManagement';
import InventoryManagement from '../components/admin/InventoryManagement';
import Reports from '../components/admin/Reports';
import { reportService } from '../services/reportService';
import { transactionService } from '../services/transactionService';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalTransactions: 0,
    productsSold: 0,
    activeUsers: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const dailyData = await reportService.getDailySales(today);
      const revenueData = await reportService.getRevenueTrends('today');
      const topProductsData = await reportService.getProductPerformance({ limit: 5 });

      setStats({
        todaySales: dailyData.totalSales || 0,
        totalTransactions: dailyData.transactionCount || 0,
        productsSold: dailyData.itemsSold || 0,
        activeUsers: dailyData.activeCashiers || 0,
      });

      // Assuming revenueData returns array of { time: '10 AM', sales: 1200 }
      if (revenueData && revenueData.length > 0) {
        setSalesData(revenueData);
      } else {
        setSalesData([{ time: 'No data', sales: 0 }]);
      }

      // Assuming topProductsData returns array of { name: 'Product A', value: 350 }
      if (topProductsData && topProductsData.length > 0) {
        setTopProducts(topProductsData);
      } else {
        setTopProducts([{ name: 'No data', value: 1 }]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Fallback to empty state
      setStats({
        todaySales: 0,
        totalTransactions: 0,
        productsSold: 0,
        activeUsers: 0,
      });
      setSalesData([]);
      setTopProducts([]);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-2">
            {typeof value === 'number' && title.includes('Sales')
              ? `$${value.toLocaleString()}`
              : value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={stats.todaySales}
          icon={CurrencyDollarIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions}
          icon={ShoppingCartIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Products Sold"
          value={stats.productsSold}
          icon={ChartBarIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={UserGroupIcon}
          color="bg-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                fill="#93c5fd"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topProducts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Routes for nested admin pages */}
      <Routes>
        <Route path="/" element={null} />
        <Route path="/products" element={<ProductManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </div>
  );
};

export default AdminDashboard;