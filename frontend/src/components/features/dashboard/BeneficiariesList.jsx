import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus, Send, MoreVertical, Phone, Building2 } from 'lucide-react';

export default function BeneficiariesList() {
    const { user } = useAuth();
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const userId = user?.user?.user_id || 1;

    useEffect(() => {
        fetch(`${backendUrl}/beneficiaries?user_id=${userId}`)
            .then(res => res.json())
            .then(data => {
                setBeneficiaries(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [userId]);

    // Generate a consistent color based on name
    const getAvatarColor = (name) => {
        const colors = [
            'from-brand-400 to-brand-600',
            'from-emerald-400 to-emerald-600',
            'from-amber-400 to-amber-600',
            'from-rose-400 to-rose-600',
            'from-violet-400 to-violet-600',
            'from-sky-400 to-sky-600',
        ];
        const index = name?.charCodeAt(0) % colors.length || 0;
        return colors[index];
    };

    return (
        <Card variant="flat" padding="none" className="h-full flex flex-col bg-transparent">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-slate-500 text-sm">
                        {beneficiaries.length} saved {beneficiaries.length === 1 ? 'beneficiary' : 'beneficiaries'}
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    icon={<UserPlus className="w-4 h-4" />}
                >
                    Add New
                </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-surface-200 animate-pulse">
                                <div className="w-14 h-14 rounded-2xl bg-surface-200" />
                                <div className="flex-1">
                                    <div className="h-5 bg-surface-200 rounded w-1/3 mb-2" />
                                    <div className="h-4 bg-surface-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : beneficiaries.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 bg-surface-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium mb-2">No beneficiaries yet</p>
                        <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                            Save frequently used recipients for quick transfers
                        </p>
                        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />}>
                            Add Beneficiary
                        </Button>
                    </motion.div>
                ) : (
                    beneficiaries.map((bnf, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-surface-200 shadow-soft hover:shadow-medium hover:border-brand-200 transition-all group"
                        >
                            {/* Avatar */}
                            <div className={`
                                w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg
                                bg-gradient-to-br ${getAvatarColor(bnf.alias_name || bnf.account_name)}
                            `}>
                                {(bnf.alias_name || bnf.account_name)?.charAt(0).toUpperCase()}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 text-lg truncate">
                                    {bnf.alias_name}
                                </p>
                                <p className="text-sm text-slate-500 truncate flex items-center gap-2">
                                    <span>{bnf.account_name}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <Building2 className="w-3 h-3" />
                                    <span>{bnf.bank_name}</span>
                                </p>
                                <p className="text-xs text-slate-400 font-mono mt-1">
                                    {bnf.account_number}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={<Send className="w-4 h-4" />}
                                >
                                    Send
                                </Button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-surface-100 rounded-lg transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Frequency badge */}
                            {bnf.frequency_count > 0 && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-full border border-brand-100">
                                    {bnf.frequency_count}x
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </Card>
    );
}
