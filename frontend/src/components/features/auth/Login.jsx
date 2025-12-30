import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import { Card } from '../../ui/Card';

export default function Login() {
    const { loginWithGoogle, error } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        await loginWithGoogle(credentialResponse.credential);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex text-gray-900 dark:text-white overflow-hidden relative transition-colors duration-300">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-brand/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-brand-gold/5 blur-[150px] rounded-full" />
            </div>

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-16 border-r border-gray-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-3xl relative z-10 w-1/2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                        <span className="text-2xl font-bold text-white dark:text-black">T</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">TunjiaX-Wallet</span>
                </div>

                <div className="max-w-md">
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">Voice Banking</span>
                        <br /> is Here.
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                        Experience the next generation of financial control. Powered by Gemini AI for seamless voice-activated transactions.
                    </p>
                </div>

                <div className="flex gap-8 text-sm text-gray-500 font-medium">
                    <span>© 2024 TunjiaX</span>
                    <span>Privacy</span>
                    <span>Terms</span>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 relative z-10 w-full lg:w-1/2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-sm"
                >
                    <div className="lg:hidden text-center mb-12">
                        <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                            <span className="text-3xl font-bold text-white dark:text-black">T</span>
                        </div>
                        <h2 className="text-3xl font-bold">TunjiaX</h2>
                    </div>

                    <Card className="shadow-xl shadow-brand/5 border-gray-100 dark:border-white/10 bg-white dark:bg-white/5">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to access your dashboard</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-center">
                                {isLoading ? (
                                    <div className="py-3 px-6 bg-brand/10 rounded-lg text-brand animate-pulse">
                                        Authenticating...
                                    </div>
                                ) : (
                                    <GoogleLogin
                                        onSuccess={handleSuccess}
                                        onError={() => console.log('Login Failed')}
                                        theme="filled_black"
                                        size="large"
                                        width="300"
                                        shape="pill"
                                    />
                                )}
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 dark:text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
