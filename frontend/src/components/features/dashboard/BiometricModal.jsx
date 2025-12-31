import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../ui/Button';
import { X, Camera, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function BiometricModal({ onClose, onSuccess, onFailure }) {
    const { user } = useAuth();
    const [status, setStatus] = useState('idle'); // idle, capturing, verifying, success, failed
    const [error, setError] = useState(null);
    const webcamRef = useRef(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const userId = user?.user?.user_id || 1;

    const captureAndVerify = useCallback(async () => {
        if (!webcamRef.current) return;

        setStatus('capturing');
        const imageSrc = webcamRef.current.getScreenshot();

        if (!imageSrc) {
            setError('Could not capture image');
            setStatus('failed');
            return;
        }

        setStatus('verifying');

        try {
            const response = await fetch(`${backendUrl}/verify-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageSrc,
                    user_id: userId
                })
            });

            const result = await response.json();

            if (result.verified) {
                setStatus('success');
                setTimeout(() => {
                    onSuccess?.(result);
                }, 1500);
            } else {
                setError(result.reason || 'Verification failed');
                setStatus('failed');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Network error. Please try again.');
            setStatus('failed');
        }
    }, [backendUrl, userId, onSuccess]);

    const retry = () => {
        setStatus('idle');
        setError(null);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl sm:rounded-3xl shadow-strong w-full max-w-[90vw] sm:max-w-md overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                                <Shield className="w-5 h-5 text-brand-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Verify Identity</h3>
                                <p className="text-sm text-slate-500">Face authentication required</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-surface-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                        {/* Webcam / Status Display */}
                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 mb-6">
                            {status === 'success' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 bg-emerald-50 flex flex-col items-center justify-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                                        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4"
                                    >
                                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                                    </motion.div>
                                    <p className="text-lg font-bold text-emerald-700">Verified!</p>
                                    <p className="text-sm text-emerald-600">Processing transaction...</p>
                                </motion.div>
                            ) : status === 'failed' ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-rose-50 flex flex-col items-center justify-center p-6"
                                >
                                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                                        <XCircle className="w-10 h-10 text-rose-600" />
                                    </div>
                                    <p className="text-lg font-bold text-rose-700 mb-2">Verification Failed</p>
                                    <p className="text-sm text-rose-600 text-center">{error}</p>
                                </motion.div>
                            ) : (
                                <>
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                        videoConstraints={{
                                            facingMode: 'user',
                                            width: 640,
                                            height: 480
                                        }}
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Face guide */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <motion.div
                                                animate={status === 'verifying' ? {
                                                    borderColor: ['#0891b2', '#22d3ee', '#0891b2']
                                                } : {}}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                className={`
                                                    w-28 h-36 sm:w-40 sm:h-52 border-4 rounded-[2rem] sm:rounded-[3rem]
                                                    ${status === 'verifying' ? 'border-brand-400' : 'border-white/80'}
                                                `}
                                            />
                                        </div>

                                        {/* Status overlay */}
                                        {status === 'verifying' && (
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3">
                                                    <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                                                    <span className="font-medium text-slate-700">Verifying...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Instructions */}
                        {status === 'idle' && (
                            <p className="text-sm text-slate-500 text-center mb-6">
                                Position your face in the frame and tap the button below
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            {status === 'failed' ? (
                                <>
                                    <Button variant="secondary" onClick={onClose} fullWidth>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onClick={retry} fullWidth>
                                        Try Again
                                    </Button>
                                </>
                            ) : status === 'success' ? (
                                <Button variant="success" fullWidth disabled>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Verified
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={captureAndVerify}
                                    loading={status === 'capturing' || status === 'verifying'}
                                    fullWidth
                                    size="lg"
                                    icon={<Camera className="w-5 h-5" />}
                                >
                                    {status === 'verifying' ? 'Verifying...' : 'Scan My Face'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                        <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3" />
                            Biometric data is processed securely
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
