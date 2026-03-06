import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const Reports = () => {
  const [dateRange, setDateRange] = useState('today');
  const [salesData, setSalesData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    topProduct: '',
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockSalesData = [
        { date: 'Mon', sales: 1200, transactions: 45 },
        { date: 'Tue', sales: 1800, transactions: 62 },
        { date: 'Wed', sales: 1400, transactions: 51 },
        { date: 'Thu', sales: 2200, transactions: 78 },
        { date: 'Fri', sales: 2800, transactions: 95 },
        { date: 'Sat', sales: 3200, transactions: 112 },
        { date: 'Sun', sales: 2100, transactions: 68 },
      ];

      const mockProductData = [
        { name: 'Product A', sales: 12500, quantity: 350 },
        { name: 'Product B', sales: 8400, quantity: 280 },
        { name: 'Product C', sales: 6600, quantity: 220 },
        { name: 'Product D', sales: 5400, quantity: 180 },
        { name: 'Product E', sales: 4500, quantity: 150 },
      ];

      setSalesData(mockSalesData);
      setProductPerformance(mockProductData);
      setSummary({
        totalSales: 14700,
        totalTransactions: 511,
        averageOrderValue: 28.77,
        topProduct: 'Product A',
      });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const exportReport = () => {
    // Implement export functionality
    console.log('Exporting report...');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sales Reports</h2>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-primary w-48"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
          <p className="text-2xl font-bold mt-2">${summary.totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
          <p className="text-2xl font-bold mt-2">{summary.totalTransactions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
          <p className="text-2xl font-bold mt-2">${summary.averageOrderValue}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Top Product</p>
          <p className="text-2xl font-bold mt-2">{summary.topProduct}</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Sales</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" name="Sales ($)" />
            <Bar yAxisId="right" dataKey="transactions" fill="#10b981" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Product Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {productPerformance.map((product) => (
                <tr key={product.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${product.sales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {((product.sales / summary.totalSales) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;