import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, MessageCircle, Camera, X, ShieldCheck } from 'lucide-react';

export default function ChatWidget() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I\'m Nugar, your voice banking assistant. 💳\n\nYou can send money to:\n• Akeem Oluwaseun (0321230165)\n• Tunde Bakare (0987654321)\n• Aminat Adetunji (1234567890)\n\nTry: "Send 5000 to Tunde"' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showBiometricModal, setShowBiometricModal] = useState(false);
    const [pendingTransfer, setPendingTransfer] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const messagesEndRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            // Call the same endpoint ElevenLabs uses
            const apiKey = import.meta.env.VITE_ELEVENLABS_CUSTOM_LLM_SECRET;
            const response = await fetch(`${backendUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'X-User-ID': String(user?.user?.user_id || 1)
                },
                body: JSON.stringify({
                    model: 'gemini-2.0-flash',
                    messages: [
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMessage }
                    ],
                    stream: true  // Enable streaming for faster response
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = '';

            // Add empty assistant message to update as we stream
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    const data = line.replace('data: ', '').trim();
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        assistantMessage += content;

                        // Check for tool calls (biometric trigger)
                        const toolCalls = parsed.choices?.[0]?.message?.tool_calls || [];
                        for (const tc of toolCalls) {
                            if (tc.function?.name === 'triggerBiometric') {
                                const args = JSON.parse(tc.function.arguments || '{}');
                                setPendingTransfer(args);
                                setShowBiometricModal(true);
                            }
                        }

                        // Update the last message with accumulated content
                        setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1] = {
                                role: 'assistant',
                                content: assistantMessage
                            };
                            return newMessages;
                        });
                    } catch (e) {
                        // Skip malformed JSON chunks
                    }
                }
            }

            // Also check if message text indicates biometric needed
            if (assistantMessage.toLowerCase().includes('face recognition') ||
                assistantMessage.toLowerCase().includes('verify your identity')) {
                // Parse transfer details from context - for now use defaults
                setPendingTransfer({});
                setShowBiometricModal(true);
            }
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I had trouble connecting. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

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
                    session_id: `chat_${user?.user?.user_id || 1}`,
                    ...pendingTransfer
                })
            });

            const result = await response.json();

            if (result.verified) {
                stopCamera();
                setShowBiometricModal(false);

                if (result.transfer?.status === 'success') {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `✅ ${result.transfer.message}\n💰 New balance: ${result.transfer.new_balance_ngn}`
                    }]);
                } else {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: '✅ Face verified! Would you like me to save this beneficiary?'
                    }]);
                }
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '❌ Face verification failed. Please try again.'
                }]);
            }
        } catch (err) {
            console.error('Verification error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error during verification. Please try again.'
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
        <Card variant="elevated" padding="none" className="flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-surface-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Chat with Nugar</h3>
                    <p className="text-sm text-slate-500">Text-based banking assistant</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                ${msg.role === 'user'
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-surface-200 text-slate-600'
                                }
                            `}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`
                                max-w-[75%] px-4 py-3 rounded-2xl
                                ${msg.role === 'user'
                                    ? 'bg-brand-600 text-white rounded-tr-sm'
                                    : 'bg-surface-100 text-slate-700 rounded-tl-sm border border-surface-200'
                                }
                            `}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-lg bg-surface-200 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="px-4 py-3 bg-surface-100 rounded-2xl rounded-tl-sm border border-surface-200">
                            <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-surface-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message... (e.g., 'Send 5000 to Mama')"
                        className="flex-1 px-4 py-3 bg-surface-100 border border-surface-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || !input.trim()}
                        icon={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    >
                        Send
                    </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                    💡 Try: "Transfer 10,000 to Bisola" or "Check my balance"
                </p>
            </form>

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
