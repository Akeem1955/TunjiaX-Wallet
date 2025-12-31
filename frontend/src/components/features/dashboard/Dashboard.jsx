import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, LogOut, LayoutDashboard, Send, Users,
    Menu, X, ChevronRight, Bell, MessageCircle
} from 'lucide-react';
import BalanceWidget from './BalanceWidget';
import TransactionHistory from './TransactionHistory';
import VoiceWidget from './VoiceWidget';
import ChatWidget from './ChatWidget';
import BeneficiariesList from './BeneficiariesList';
import BiometricModal from './BiometricModal';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const firstName = user?.user?.full_name?.split(' ')[0] || 'User';
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showBiometric, setShowBiometric] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'chat', label: 'Chat Banking', icon: <MessageCircle className="w-5 h-5" /> },
        { id: 'transactions', label: 'Transactions', icon: <Send className="w-5 h-5" /> },
        { id: 'beneficiaries', label: 'Beneficiaries', icon: <Users className="w-5 h-5" /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'chat':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Chat Banking</h2>
                        <ChatWidget />
                    </motion.div>
                );
            case 'transactions':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Transaction History</h2>
                        <TransactionHistory fullPage />
                    </motion.div>
                );
            case 'beneficiaries':
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Beneficiaries</h2>
                        <BeneficiariesList />
                    </motion.div>
                );
            default:
                return (
                    <div className="space-y-6">
                        {/* Balance Widget */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <BalanceWidget />
                        </motion.div>

                        {/* Voice Widget - Main CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <VoiceWidget onBiometricRequest={() => setShowBiometric(true)} />
                        </motion.div>

                        {/* Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div
                                onClick={() => setActiveTab('transactions')}
                                className="p-4 bg-white rounded-2xl border border-surface-200 shadow-soft cursor-pointer hover:shadow-medium hover:border-brand-200 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Send className="w-5 h-5 text-brand-600" />
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
                                </div>
                                <p className="text-sm text-slate-500">Recent</p>
                                <p className="font-semibold text-slate-800">Transactions</p>
                            </div>
                            <div
                                onClick={() => setActiveTab('beneficiaries')}
                                className="p-4 bg-white rounded-2xl border border-surface-200 shadow-soft cursor-pointer hover:shadow-medium hover:border-brand-200 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Users className="w-5 h-5 text-accent-emerald" />
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-accent-emerald transition-colors" />
                                </div>
                                <p className="text-sm text-slate-500">Saved</p>
                                <p className="font-semibold text-slate-800">Beneficiaries</p>
                            </div>
                        </motion.div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-surface-100">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 bg-white border-r border-surface-200 shadow-soft z-50">
                {/* Logo */}
                <div className="p-6 border-b border-surface-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-brand">
                            <span className="text-lg font-bold text-white">T</span>
                        </div>
                        <span className="font-bold text-lg text-slate-800">TunjiaX</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                                ${activeTab === item.id
                                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                                    : 'text-slate-600 hover:bg-surface-100 hover:text-slate-800'
                                }
                            `}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-surface-200">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-100 mb-3">
                        {user?.picture ? (
                            <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-brand-600" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{user?.user?.full_name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-surface-200 shadow-soft z-40 flex items-center justify-between px-4">
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 text-slate-600 hover:bg-surface-100 rounded-xl"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-white">T</span>
                    </div>
                    <span className="font-bold text-slate-800">TunjiaX</span>
                </div>

                <button className="p-2 text-slate-600 hover:bg-surface-100 rounded-xl relative">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white shadow-strong z-50"
                        >
                            <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                                        <span className="text-lg font-bold text-white">T</span>
                                    </div>
                                    <span className="font-bold text-lg text-slate-800">TunjiaX</span>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 text-slate-600 hover:bg-surface-100 rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="p-4 space-y-1">
                                {navItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                                            ${activeTab === item.id
                                                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                                                : 'text-slate-600 hover:bg-surface-100'
                                            }
                                        `}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                ))}
                            </nav>

                            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-200">
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="lg:ml-72 pt-20 lg:pt-0 min-h-screen">
                <div className="max-w-4xl mx-auto p-4 lg:p-8">
                    {/* Welcome Header */}
                    {activeTab === 'dashboard' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                                Hello, {firstName} 👋
                            </h1>
                            <p className="text-slate-500">Here's your financial overview</p>
                        </motion.div>
                    )}

                    {/* Dynamic Content */}
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </main>

            {/* Biometric Modal */}
            {showBiometric && (
                <BiometricModal
                    onClose={() => setShowBiometric(false)}
                    onSuccess={() => {
                        setShowBiometric(false);
                        // Handle transfer completion
                    }}
                />
            )}
        </div>
    );
}
