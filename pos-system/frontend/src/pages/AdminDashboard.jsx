import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductManagement from '../components/admin/ProductManagement';
import UserManagement from '../components/admin/UserManagement';
import InventoryManagement from '../components/admin/InventoryManagement';
import Reports from '../components/admin/Reports';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ArrowPathIcon,
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
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalTransactions: 0,
    productsSold: 0,
    activeUsers: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Today's stats from Spring Boot
      const statsRes = await api.get('/transactions/stats/today');
      const todaySales = parseFloat(statsRes.data.sales || 0);
      const totalTransactions = parseInt(statsRes.data.count || 0);

      // 2. All transactions for trend + recent list
      const txRes = await api.get('/transactions', {
        params: { page: 0, size: 50, sortBy: 'createdAt', sortDir: 'desc' },
      });
      const transactions = txRes.data.content || txRes.data || [];
      setRecentTransactions(transactions.slice(0, 10));

      // Build hourly chart for today
      const today = new Date().toISOString().split('T')[0];
      const hourMap = {};
      let totalItemsSold = 0;
      transactions.forEach((t) => {
        if (t.createdAt && t.createdAt.split('T')[0] === today) {
          const hour = new Date(t.createdAt).getHours();
          const label = `${hour}:00`;
          hourMap[label] = (hourMap[label] || 0) + (parseFloat(t.total) || 0);
        }
        totalItemsSold += (t.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
      });

      const trend = Object.entries(hourMap)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([time, sales]) => ({ time, sales: parseFloat(sales.toFixed(2)) }));
      setSalesData(trend.length > 0 ? trend : [{ time: 'No data yet', sales: 0 }]);

      // Build top products
      const productMap = {};
      transactions.forEach((t) => {
        (t.items || []).forEach((item) => {
          const name = item.productName || 'Unknown';
          productMap[name] = (productMap[name] || 0) + (item.quantity || 0);
        });
      });
      const top = Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
      setTopProducts(top.length > 0 ? top : []);

      setStats({
        todaySales,
        totalTransactions,
        productsSold: totalItemsSold,
        activeUsers: new Set(transactions.map((t) => t.cashier?.id).filter(Boolean)).size,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const StatCard = ({ title, value, icon: Icon, color, prefix = '' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold mt-1 text-gray-800 dark:text-white">
          {prefix}
          {typeof value === 'number'
            ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : value}
        </p>
      </div>
      <div className={`p-4 rounded-full ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={stats.todaySales}
          icon={CurrencyDollarIcon}
          color="bg-green-500"
          prefix="₹"
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
          title="Active Cashiers"
          value={stats.activeUsers}
          icon={UserGroupIcon}
          color="bg-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Sales Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`₹${v}`, 'Sales']} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#6366f1"
                fill="#e0e7ff"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No sales data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {topProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <span className="text-sm text-gray-400">{recentTransactions.length} latest</span>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No transactions recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Transaction #</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Items</th>
                  <th className="px-6 py-3 text-left">Payment</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-primary-600">
                      {tx.transactionNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {tx.customer?.name || tx.customer?.email || (
                        <span className="italic text-gray-400">Walk-in</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {tx.items?.length || 0} item(s)
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600 dark:text-gray-400">
                      {tx.paymentMethod || '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-white">
                      ₹{parseFloat(tx.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : tx.status === 'VOID'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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