import React, { useState, useEffect } from 'react';
import { transactionService } from '../../services/transactionService';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CashierTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await transactionService.getTransactions({ page: 0, size: 100, sortBy: 'createdAt', sortDir: 'desc' });
            setTransactions(res.content || res || []);
        } catch {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const filtered = transactions.filter(t =>
        !search ||
        t.transactionNumber?.toLowerCase().includes(search.toLowerCase()) ||
        t.customer?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">All Transactions</h1>
                <button onClick={fetchTransactions} className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline">
                    <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by transaction # or customer name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-primary pl-9"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transactions list */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No transactions found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Txn #</th>
                                        <th className="px-4 py-3 text-left">Customer</th>
                                        <th className="px-4 py-3 text-left">Payment</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filtered.map(tx => (
                                        <tr
                                            key={tx.id}
                                            onClick={() => setSelected(tx)}
                                            className={`cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors ${selected?.id === tx.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                        >
                                            <td className="px-4 py-3 font-mono font-medium text-primary-600">{tx.transactionNumber}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{tx.customer?.name || <span className="italic text-gray-400">Walk-in</span>}</td>
                                            <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-400">{tx.paymentMethod || '—'}</td>
                                            <td className="px-4 py-3 text-right font-bold">₹{parseFloat(tx.total || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700'}`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Receipt panel */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    {!selected ? (
                        <div className="text-center text-gray-400 py-16">
                            <p className="text-4xl mb-2">🧾</p>
                            <p className="font-medium">Select a transaction</p>
                            <p className="text-sm">to view the receipt</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center border-b dark:border-gray-700 pb-4">
                                <p className="font-bold text-lg">{selected.transactionNumber}</p>
                                <p className="text-xs text-gray-400">
                                    {selected.createdAt ? new Date(selected.createdAt).toLocaleString('en-IN') : ''}
                                </p>
                            </div>
                            {selected.customer && (
                                <div className="text-sm">
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">Customer</p>
                                    <p>{selected.customer.name || selected.customer.email}</p>
                                    <p className="text-xs text-gray-400">{selected.customer.loyaltyNumber}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Items</p>
                                {(selected.items || []).map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">{item.productName} × {item.quantity}</span>
                                        <span className="font-medium">₹{parseFloat(item.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t dark:border-gray-700 pt-3 space-y-1 text-sm">
                                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{parseFloat(selected.subtotal || 0).toFixed(2)}</span></div>
                                <div className="flex justify-between text-gray-500"><span>Tax</span><span>₹{parseFloat(selected.tax || 0).toFixed(2)}</span></div>
                                <div className="flex justify-between text-gray-500"><span>Discount</span><span>-₹{parseFloat(selected.discount || 0).toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-lg border-t dark:border-gray-700 pt-2 mt-1">
                                    <span>Total</span><span className="text-primary-600">₹{parseFloat(selected.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize font-medium">{selected.paymentMethod}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Paid</span><span>₹{parseFloat(selected.paidAmount || 0).toFixed(2)}</span></div>
                                {parseFloat(selected.change || 0) > 0 && (
                                    <div className="flex justify-between"><span className="text-gray-500">Change</span><span className="text-green-600 font-bold">₹{parseFloat(selected.change).toFixed(2)}</span></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CashierTransactions;
