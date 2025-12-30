import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { motion } from 'framer-motion';
import { User, LogOut, Moon, Sun } from 'lucide-react';
import BalanceWidget from './BalanceWidget';
import TransactionHistory from './TransactionHistory';
import VoiceWidget from './VoiceWidget';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const firstName = user?.given_name || user?.name?.split(' ')[0] || 'User';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex transition-colors duration-300">
            {/* Sidebar - Desktop */}
            <motion.aside
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                className="hidden md:flex flex-col w-72 h-screen border-r border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] backdrop-blur-xl fixed left-0 top-0 z-50 p-6 transition-colors duration-300"
            >
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-white dark:text-black">T</div>
                    <span className="font-bold text-lg tracking-wide">TunjiaX</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <NavItem active icon="🏠">Dashboard</NavItem>
                    <NavItem icon="💸">Transactions</NavItem>
                    <NavItem icon="👥">Beneficiaries</NavItem>
                    <NavItem icon="🎙️">Voice Agent</NavItem>
                </nav>

                <div className="pt-6 border-t border-gray-200 dark:border-white/10 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all w-full text-left"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all w-full text-left">
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 p-6 md:p-12 relative transition-colors duration-300">

                {/* Header Mobile/Desktop */}
                <header className="flex justify-between items-center mb-12">
                    <div className="md:hidden flex items-center gap-4">
                        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-white dark:text-black">T</div>
                        <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-400">
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-brand">{user?.email}</p>
                        </div>
                        {user?.picture ? (
                            <img src={user.picture} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                <User size={20} />
                            </div>
                        )}
                    </div>
                </header>

                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white">hello, {firstName}.</h1>
                        <p className="text-gray-500 dark:text-gray-400">Here's your financial overview for today.</p>
                    </motion.div>

                    {/* Widgets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="col-span-2 h-[340px]"
                        >
                            <BalanceWidget />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="h-[340px]"
                        >
                            <VoiceWidget />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="col-span-3 h-[500px]"
                        >
                            <TransactionHistory />
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ children, icon, active }) {
    return (
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active
            ? 'bg-brand/10 text-brand border border-brand/20'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}>
            <span className="text-lg">{icon}</span>
            {children}
        </button>
    )
}
