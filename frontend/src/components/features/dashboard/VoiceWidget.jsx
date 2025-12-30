import React, { useCallback, useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation } from '@11labs/react';
import { useAuth } from '../../../context/AuthContext';
import { Mic, MicOff, MessageCircle, Zap, Fingerprint } from 'lucide-react';

export default function VoiceWidget({ onBiometricRequest }) {
    const { user } = useAuth();
    const [transcript, setTranscript] = useState([]);

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
            }
        },
        onError: (error) => {
            console.error('Error:', error);
        },
    });

    const isConnected = conversation.status === 'connected';
    const isConnecting = conversation.status === 'connecting';

    // Check for biometric trigger (this would come from the conversation)
    useEffect(() => {
        // Listen for tool calls that trigger biometric
        // This is a placeholder - actual implementation depends on ElevenLabs SDK
    }, [conversation]);

    const toggleConversation = useCallback(async () => {
        if (isConnected) {
            await conversation.endSession();
        } else {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });

                await conversation.startSession({
                    agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
                    // Pass user context via dynamic variables if supported
                    dynamicVariables: {
                        user_id: user?.user?.user_id || 1,
                    }
                });
            } catch (error) {
                console.error('Failed to start conversation:', error);
                alert('Could not access microphone or connect to agent.');
            }
        }
    }, [conversation, isConnected, user]);

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
                            ? '"Transfer 5k to Bisola"'
                            : 'Speak naturally to send money'}
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
                        💡 Try: "Send 10,000 to Mama" or "Pay Tunde 5k"
                    </p>
                </div>
            </div>
        </Card>
    );
}
