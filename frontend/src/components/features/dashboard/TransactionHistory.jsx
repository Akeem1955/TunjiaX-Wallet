import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { useAuth } from '../../../context/AuthContext';

export default function TransactionHistory() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        fetch(`${backendUrl}/transactions?user_id=${user?.user_id || 1}`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    return (
        <Card className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Recent Activity</h3>
                <button className="text-sm text-brand hover:text-brand-light">View All</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {loading ? (
                    <p className="text-gray-500 text-center py-10">Loading...</p>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No transactions yet.
                    </div>
                ) : (
                    transactions.map((txn, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${txn.type === 'DEBIT' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                    }`}>
                                    {txn.type === 'DEBIT' ? '↗' : '↙'}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-200">{txn.recipient}</p>
                                    <p className="text-xs text-gray-500">{txn.date} • {txn.bank}</p>
                                </div>
                            </div>
                            <span className={`font-mono font-bold ${txn.type === 'DEBIT' ? 'text-gray-400' : 'text-green-400'
                                }`}>
                                {txn.type === 'DEBIT' ? '-' : '+'}₦{parseInt(txn.amount_ngn).toLocaleString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
