import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export default function BalanceWidget() {
    const { user } = useAuth();
    const [balance, setBalance] = useState({ balance_ngn: '0' });
    const [loading, setLoading] = useState(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const fetchBalance = () => {
        setLoading(true);
        fetch(`${backendUrl}/balance?user_id=${user?.user_id || 1}`)
            .then(res => res.json())
            .then(data => {
                setBalance(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchBalance();
    }, [user]);

    const handleFund = async () => {
        // Basic implementation for now
        const amount = prompt("Enter amount to fund (NGN):");
        if (amount) {
            const kobo = parseInt(amount) * 100;
            await fetch(`${backendUrl}/fund-wallet?user_id=${user?.user_id || 1}&amount_kobo=${kobo}`, {
                method: 'POST'
            });
            fetchBalance();
        }
    };

    return (
        <Card className="h-full flex flex-col justify-between relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-32 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/10 transition-all duration-500" />

            <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</p>
                <div className="mb-6">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        {loading ? (
                            <span className="animate-pulse bg-white/10 rounded-lg text-transparent">00,000</span>
                        ) : (
                            `₦${parseInt(balance.balance_ngn).toLocaleString()}`
                        )}
                    </h2>
                </div>
            </div>

            <div className="flex gap-3 relative z-10">
                <Button variant="primary" onClick={handleFund} icon="+" className="flex-1">
                    Add Money
                </Button>
                <Button variant="secondary" icon="↗" className="flex-1">
                    Transfer
                </Button>
            </div>
        </Card>
    );
}
