import React, { useState, useEffect } from 'react';
import { transactionService } from '../../services/transactionService';
import { QrCodeIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CashierCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // Derive unique paying customers from transaction history
            const res = await transactionService.getTransactions({ page: 0, size: 500 });
            const transactions = res.content || res || [];

            // Build unique customer map
            const customerMap = {};
            transactions.forEach(tx => {
                if (!tx.customer) return;
                const id = tx.customer.id;
                if (!customerMap[id]) {
                    customerMap[id] = {
                        ...tx.customer,
                        totalSpent: 0,
                        visitCount: 0,
                        lastVisit: null,
                    };
                }
                customerMap[id].totalSpent += parseFloat(tx.total || 0);
                customerMap[id].visitCount += 1;
                const txDate = tx.createdAt ? new Date(tx.createdAt) : null;
                if (txDate && (!customerMap[id].lastVisit || txDate > new Date(customerMap[id].lastVisit))) {
                    customerMap[id].lastVisit = tx.createdAt;
                }
            });

            const list = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
            setCustomers(list);
        } catch {
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const filtered = customers.filter(c =>
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.loyaltyNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const getTierColor = (tier) => {
        switch ((tier || '').toUpperCase()) {
            case 'GOLD': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'SILVER': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            case 'PLATINUM': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Paying Customers</h1>
                    <p className="text-sm text-gray-500 mt-1">Customers derived from completed transactions</p>
                </div>
                <button onClick={fetchCustomers} className="text-sm text-primary-600 font-medium hover:underline">
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-bold text-primary-600">{customers.length}</p>
                    <p className="text-sm text-gray-500">Total Customers</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">
                        ₹{customers.reduce((s, c) => s + c.totalSpent, 0).toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
                    <p className="text-3xl font-bold text-yellow-600">
                        {customers.reduce((s, c) => s + c.visitCount, 0)}
                    </p>
                    <p className="text-sm text-gray-500">Total Visits</p>
                </div>
            </div>

            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, email, or loyalty number..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-primary pl-9"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <QrCodeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No customers found</p>
                        <p className="text-sm">Customers will appear here after a purchase</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3 text-left">Customer</th>
                                    <th className="px-6 py-3 text-left">Loyalty</th>
                                    <th className="px-6 py-3 text-left">Tier</th>
                                    <th className="px-6 py-3 text-right">Total Spent</th>
                                    <th className="px-6 py-3 text-center">Visits</th>
                                    <th className="px-6 py-3 text-left">Last Visit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filtered.map((customer, idx) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 font-bold text-sm">
                                                    {(customer.name || customer.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{customer.name || '—'}</p>
                                                    <p className="text-xs text-gray-400">{customer.email}</p>
                                                </div>
                                                {idx === 0 && (
                                                    <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" title="Top customer" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{customer.loyaltyNumber || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(customer.tier)}`}>
                                                {customer.tier || 'BRONZE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-white">
                                            ₹{customer.totalSpent.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">{customer.visitCount}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {customer.lastVisit
                                                ? new Date(customer.lastVisit).toLocaleDateString('en-IN')
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashierCustomers;
