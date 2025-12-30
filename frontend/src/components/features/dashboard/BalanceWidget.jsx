import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Plus, ArrowUpRight, Wallet, TrendingUp } from 'lucide-react';

export default function BalanceWidget() {
    const { user } = useAuth();
    const [balance, setBalance] = useState({ balance_ngn: '0', balance_kobo: 0 });
    const [loading, setLoading] = useState(true);
    const [funding, setFunding] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const userId = user?.user?.user_id || 1;

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/balance?user_id=${userId}`);
            const data = await res.json();
            setBalance(data);
        } catch (err) {
            console.error('Failed to fetch balance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [userId]);

    const handleFund = async () => {
        const amount = prompt('Enter amount to fund (NGN):');
        if (amount && !isNaN(amount)) {
            setFunding(true);
            try {
                const kobo = parseInt(amount) * 100;
                await fetch(`${backendUrl}/fund-wallet?user_id=${userId}&amount_kobo=${kobo}`, {
                    method: 'POST'
                });
                await fetchBalance();
            } catch (err) {
                console.error('Funding failed:', err);
            } finally {
                setFunding(false);
            }
        }
    };

    // Format balance with commas
    const formattedBalance = loading
        ? '---'
        : `₦${parseInt(balance.balance_ngn?.replace(/,/g, '') || 0).toLocaleString()}`;

    return (
        <Card variant="brand" padding="lg" className="relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-brand-100 text-sm">Total Balance</p>
                            <p className="text-white/60 text-xs">Nigerian Naira</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full text-sm text-brand-100">
                        <TrendingUp className="w-4 h-4" />
                        <span>Active</span>
                    </div>
                </div>

                {/* Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h2 className={`text-4xl md:text-5xl font-bold text-white tracking-tight ${loading ? 'animate-pulse' : ''}`}>
                        {formattedBalance}
                    </h2>
                </motion.div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleFund}
                        loading={funding}
                        icon={<Plus className="w-5 h-5" />}
                        className="flex-1 bg-white text-brand-700 hover:bg-brand-50 border-0 shadow-lg"
                    >
                        Add Money
                    </Button>
                    <Button
                        variant="secondary"
                        icon={<ArrowUpRight className="w-5 h-5" />}
                        className="flex-1 bg-white/10 text-white hover:bg-white/20 border border-white/20"
                    >
                        Transfer
                    </Button>
                </div>
            </div>
        </Card>
    );
}
