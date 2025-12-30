import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Lock, Wallet } from 'lucide-react';

export default function LoginPage() {
    const { loginWithGoogle, error } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        try {
            await loginWithGoogle(credentialResponse.credential);
        } catch (err) {
            console.error('Login failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        console.error('Google login failed');
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full"></div>
            </div>

            {/* Main Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo/Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-4">
                        <Wallet className="w-16 h-16 text-cyan-400" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                        <span className="text-cyan-400">TunjiaX</span>
                        <span className="text-white">-Wallet</span>
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Voice-Powered Banking with Gemini AI
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6 text-gray-300">
                        <Lock className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm">Secure Authentication Required</span>
                    </div>

                    {/* Google Sign-In Button */}
                    <div className="flex flex-col items-center gap-4">
                        {isLoading ? (
                            <div className="w-full py-3 bg-cyan-500/10 rounded-lg text-center text-cyan-400 animate-pulse">
                                Authenticating...
                            </div>
                        ) : (
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                                theme="filled_black"
                                size="large"
                                text="signin_with"
                                shape="rectangular"
                            />
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </div>

                    {/* Features List */}
                    <div className="mt-8 pt-6 border-t border-gray-800">
                        <p className="text-xs text-gray-500 text-center mb-4">
                            WHAT YOU GET
                        </p>
                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                                <span>Voice-activated transfers</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                                <span>Biometric security (Gemini Vision)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                                <span>Instant beneficiary lookup</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-600 mt-6">
                    Powered by Google Cloud × ElevenLabs × Gemini 2.0
                </p>
            </motion.div>
        </div>
    );
}
