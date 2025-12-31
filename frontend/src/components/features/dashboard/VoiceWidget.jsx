import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation } from '@11labs/react';
import { useAuth } from '../../../context/AuthContext';
import { Mic, MicOff, MessageCircle, Zap, Camera, X, ShieldCheck, Loader2 } from 'lucide-react';

export default function VoiceWidget() {
    const { user } = useAuth();
    const [transcript, setTranscript] = useState([]);
    const [showBiometricModal, setShowBiometricModal] = useState(false);
    const [pendingTransfer, setPendingTransfer] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    const conversation = useConversation({
        onConnect: () => {
            console.log('Connected to ElevenLabs');
            setTranscript([]);
        },
        onDisconnect: () => {
            console.log('Disconnected from ElevenLabs');
        },
        onMessage: (message) => {
            console.log('Message:', message);
            // Add message to transcript
            if (message.message) {
                setTranscript(prev => [...prev, { role: 'assistant', text: message.message }]);

                // Check if message indicates biometric needed
                if (message.message.toLowerCase().includes('face recognition') ||
                    message.message.toLowerCase().includes('verify your identity')) {
                    setPendingTransfer({});
                    setShowBiometricModal(true);
                }
            }
        },
        onError: (error) => {
            console.error('Error:', error);
        },
        // Handle tool calls from ElevenLabs
        onToolCall: async (toolCall) => {
            console.log('Tool call received:', toolCall);

            if (toolCall.name === 'triggerBiometric' || toolCall.name === 'trigger_biometric_auth') {
                const args = toolCall.parameters || {};
                setPendingTransfer(args);
                setShowBiometricModal(true);
                return { success: true, message: 'Biometric modal opened' };
            }

            return { error: 'Unknown tool' };
        }
    });

    const isConnected = conversation.status === 'connected';
    const isConnecting = conversation.status === 'connecting';

    const toggleConversation = useCallback(async () => {
        if (isConnected) {
            await conversation.endSession();
        } else {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });

                await conversation.startSession({
                    agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
                    dynamicVariables: {
                        user_id: String(user?.user?.user_id || 1),
                    }
                });
            } catch (error) {
                console.error('Failed to start conversation:', error);
                alert('Could not access microphone or connect to agent.');
            }
        }
    }, [conversation, isConnected, user]);

    // Start webcam for biometric
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            alert('Could not access camera');
        }
    };

    // Stop webcam
    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    // Capture and verify face
    const verifyFace = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setVerifying(true);
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');

        try {
            const response = await fetch(`${backendUrl}/verify-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageData,
                    user_id: user?.user?.user_id || 1,
                    session_id: `voice_${user?.user?.user_id || 1}`,
                    ...pendingTransfer
                })
            });

            const result = await response.json();

            if (result.verified) {
                stopCamera();
                setShowBiometricModal(false);

                if (result.transfer?.status === 'success') {
                    setTranscript(prev => [...prev, {
                        role: 'assistant',
                        text: `✅ ${result.transfer.message} New balance: ${result.transfer.new_balance_ngn}`
                    }]);
                } else {
                    setTranscript(prev => [...prev, {
                        role: 'assistant',
                        text: '✅ Face verified successfully!'
                    }]);
                }
            } else {
                setTranscript(prev => [...prev, {
                    role: 'assistant',
                    text: '❌ Face verification failed. Please try again.'
                }]);
            }
        } catch (err) {
            console.error('Verification error:', err);
            setTranscript(prev => [...prev, {
                role: 'assistant',
                text: 'Error during verification. Please try again.'
            }]);
        } finally {
            setVerifying(false);
        }
    };

    // Open modal and start camera
    useEffect(() => {
        if (showBiometricModal) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [showBiometricModal]);

    return (
        <Card variant="elevated" padding="lg" className="relative overflow-hidden">
            {/* Background animation when connected */}
            <AnimatePresence>
                {isConnected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.5, 2], opacity: [0.3, 0.1, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-brand-400"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.5, 2], opacity: [0.3, 0.1, 0] }}
                            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-brand-300"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.5, 2], opacity: [0.3, 0.1, 0] }}
                            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-brand-200"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isConnected ? 'bg-brand-100 text-brand-600' : 'bg-surface-200 text-slate-500'
                            }`}>
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">Voice Assistant</p>
                            <p className={`text-sm ${isConnected ? 'text-brand-600' : 'text-slate-500'}`}>
                                {isConnected ? 'Listening...' : isConnecting ? 'Connecting...' : 'Tap to start'}
                            </p>
                        </div>
                    </div>

                    {isConnected && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-full border border-brand-200">
                            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-brand-700">Live</span>
                        </div>
                    )}
                </div>

                {/* Main Voice Button */}
                <div className="flex flex-col items-center py-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleConversation}
                        disabled={isConnecting}
                        className={`
                            w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-300
                            ${isConnected
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 rotate-3'
                                : isConnecting
                                    ? 'bg-brand-400 text-white animate-pulse'
                                    : 'bg-brand-600 text-white shadow-brand-lg hover:bg-brand-700'
                            }
                        `}
                    >
                        {isConnected ? (
                            <Mic className="w-10 h-10" />
                        ) : (
                            <MicOff className="w-10 h-10" />
                        )}
                    </motion.button>

                    <p className="mt-4 text-center text-slate-600 max-w-xs">
                        {isConnected
                            ? '"Send 5000 to Tunde" or "Pay Aminat 10k"'
                            : 'Send to: Akeem, Tunde, or Aminat'}
                    </p>
                </div>

                {/* Transcript preview */}
                {transcript.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-surface-100 rounded-xl border border-surface-200 max-h-32 overflow-y-auto custom-scrollbar"
                    >
                        {transcript.slice(-3).map((msg, i) => (
                            <p key={i} className="text-sm text-slate-600 mb-1 last:mb-0">
                                <span className="font-medium text-brand-600">AI:</span> {msg.text}
                            </p>
                        ))}
                    </motion.div>
                )}

                {/* Action Button */}
                <div className="mt-6">
                    <Button
                        variant={isConnected ? 'danger' : 'primary'}
                        onClick={toggleConversation}
                        disabled={isConnecting}
                        fullWidth
                        size="lg"
                        icon={isConnected ? <MicOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    >
                        {isConnected ? 'End Session' : isConnecting ? 'Connecting...' : 'Start Voice Banking'}
                    </Button>
                </div>

                {/* Quick tips */}
                <div className="mt-6 pt-6 border-t border-surface-200">
                    <p className="text-xs text-slate-500 text-center">
                        💳 Send to: Akeem (0321230165) • Tunde (0987654321) • Aminat (1234567890)
                    </p>
                </div>
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Biometric Modal */}
            <AnimatePresence>
                {showBiometricModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                                        <ShieldCheck className="w-6 h-6 text-brand-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Face Verification</h3>
                                        <p className="text-sm text-slate-500">Confirm your identity</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBiometricModal(false)}
                                    className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 mb-4">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                                <div className="absolute inset-0 border-4 border-brand-400 rounded-2xl pointer-events-none" />
                                <div className="absolute bottom-2 left-2 right-2 bg-black/50 rounded-lg px-3 py-2">
                                    <p className="text-white text-xs text-center">Position your face in the frame</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowBiometricModal(false)}
                                    fullWidth
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={verifyFace}
                                    disabled={verifying}
                                    fullWidth
                                    icon={verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                >
                                    {verifying ? 'Verifying...' : 'Verify'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
