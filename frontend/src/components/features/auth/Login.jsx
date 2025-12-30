import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import { Card } from '../../ui/Card';
import { Shield, Mic, Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
    const { loginWithGoogle, error } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        await loginWithGoogle(credentialResponse.credential);
        setIsLoading(false);
    };

    const features = [
        { icon: <Mic className="w-5 h-5" />, title: 'Voice Banking', desc: 'Speak to transact instantly' },
        { icon: <Shield className="w-5 h-5" />, title: 'Face Verification', desc: 'Biometric security' },
        { icon: <Sparkles className="w-5 h-5" />, title: 'AI Powered', desc: 'Gemini & ElevenLabs' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-50/30 to-surface-100 flex">
            {/* Left Panel - Hero Section */}
            <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-200 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/3" />

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 relative z-10"
                >
                    <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-brand">
                        <span className="text-2xl font-bold text-white">T</span>
                    </div>
                    <span className="text-xl font-bold text-slate-800">TunjiaX-Wallet</span>
                </motion.div>

                {/* Main content */}
                <div className="relative z-10 max-w-lg">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl font-extrabold text-slate-900 leading-tight mb-6"
                    >
                        Banking at the
                        <br />
                        <span className="text-brand-600">Speed of Thought</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-600 mb-10"
                    >
                        Transfer money with just your voice. No typing, no waiting.
                        Designed for the hustle of Nigerian markets.
                    </motion.p>

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                    >
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-surface-200 shadow-soft">
                                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600">
                                    {feature.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{feature.title}</p>
                                    <p className="text-sm text-slate-500">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-6 text-sm text-slate-500 relative z-10"
                >
                    <span>© {new Date().getFullYear()} TunjiaX</span>
                    <a href="#" className="hover:text-brand-600 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-brand-600 transition-colors">Terms</a>
                </motion.div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white lg:rounded-l-[3rem] lg:shadow-strong relative">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand">
                            <span className="text-3xl font-bold text-white">T</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">TunjiaX-Wallet</h2>
                        <p className="text-slate-500 mt-1">Voice Banking</p>
                    </div>

                    <Card variant="elevated" padding="lg" className="relative overflow-hidden">
                        {/* Card accent line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />

                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4 border border-emerald-100">
                                <Shield className="w-4 h-4" />
                                Secure Login
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                            <p className="text-slate-500">Sign in to continue to your account</p>
                        </div>

                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="py-4 px-6 bg-brand-50 rounded-xl text-brand-700 animate-pulse text-center border border-brand-100">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                                        Authenticating...
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center">
                                    <GoogleLogin
                                        onSuccess={handleSuccess}
                                        onError={() => console.log('Login Failed')}
                                        theme="outline"
                                        size="large"
                                        text="continue_with"
                                        shape="rectangular"
                                        width="100%"
                                    />
                                </div>
                            )}

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm text-center"
                                    role="alert"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-surface-200 text-center">
                            <p className="text-sm text-slate-500">
                                New user?{' '}
                                <span className="text-brand-600 font-medium">
                                    Sign in to create account
                                </span>
                            </p>
                        </div>
                    </Card>

                    {/* Trust badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 flex items-center justify-center gap-6 text-slate-400"
                    >
                        <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4" />
                            <span>256-bit SSL</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <div className="flex items-center gap-2 text-sm">
                            <span>NDIC Insured</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
