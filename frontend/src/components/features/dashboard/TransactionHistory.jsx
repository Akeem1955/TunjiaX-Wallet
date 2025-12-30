import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TransactionHistory({ fullPage = false }) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const userId = user?.user?.user_id || 1;

    useEffect(() => {
        fetch(`${backendUrl}/transactions?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [userId]);

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-rose-500" />;
            default:
                return <Clock className="w-4 h-4 text-amber-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'failed':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    return (
        <Card variant={fullPage ? 'flat' : 'elevated'} padding={fullPage ? 'none' : 'default'} className="h-full flex flex-col">
            {!fullPage && (
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                    <button className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                        View All
                    </button>
                </div>
            )}

            <div className={`flex-1 overflow-y-auto ${fullPage ? '' : 'max-h-80'} custom-scrollbar`}>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-100 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-surface-200" />
                                <div className="flex-1">
                                    <div className="h-4 bg-surface-200 rounded w-1/3 mb-2" />
                                    <div className="h-3 bg-surface-200 rounded w-1/2" />
                                </div>
                                <div className="h-5 bg-surface-200 rounded w-20" />
                            </div>
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No transactions yet</p>
                        <p className="text-sm text-slate-400 mt-1">Your activity will appear here</p>
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((txn, i) => (
                            <motion.div
                                key={txn.transaction_id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-100 transition-colors group cursor-pointer border border-transparent hover:border-surface-200"
                            >
                                {/* Icon */}
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                                    ${txn.type === 'DEBIT'
                                        ? 'bg-rose-50 text-rose-600'
                                        : 'bg-emerald-50 text-emerald-600'
                                    }
                                `}>
                                    {txn.type === 'DEBIT'
                                        ? <ArrowUpRight className="w-5 h-5" />
                                        : <ArrowDownLeft className="w-5 h-5" />
                                    }
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">
                                        {txn.recipient || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-slate-500 truncate">
                                        {txn.date} • {txn.bank || 'Bank'}
                                    </p>
                                </div>

                                {/* Amount & Status */}
                                <div className="text-right flex-shrink-0">
                                    <p className={`font-bold tabular-nums ${txn.type === 'DEBIT' ? 'text-slate-700' : 'text-emerald-600'
                                        }`}>
                                        {txn.type === 'DEBIT' ? '-' : '+'}₦{parseInt(txn.amount_ngn?.replace(/,/g, '') || 0).toLocaleString()}
                                    </p>
                                    <div className={`
                                        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 border
                                        ${getStatusColor(txn.status)}
                                    `}>
                                        {getStatusIcon(txn.status)}
                                        <span className="capitalize">{txn.status || 'Pending'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}
