import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceWidget() {
    const [isActive, setIsActive] = useState(false);

    return (
        <Card className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            {isActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-32 h-32 rounded-full border border-brand/30"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                        className="w-32 h-32 rounded-full border border-brand/30 absolute"
                    />
                </div>
            )}

            <div className="relative z-10">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${isActive ? 'bg-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-brand/10 text-brand'
                    }`}>
                    <span className="text-3xl">🎙️</span>
                </div>

                <h3 className="text-xl font-bold mb-1">Voice Agent</h3>
                <p className="text-sm text-gray-500 mb-6">
                    {isActive ? "Listening..." : "Tap to speak"}
                </p>

                <Button
                    variant={isActive ? "danger" : "primary"}
                    onClick={() => setIsActive(!isActive)}
                    className="w-full"
                >
                    {isActive ? "Stop" : "Activate"}
                </Button>
            </div>
        </Card>
    );
}
