import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useConversation } from '@11labs/react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Lock, Scan, CheckCircle, XCircle } from 'lucide-react';

// CONFIG: The User provided Agent ID
const AGENT_ID = "2344jhhshhsu83";
const BACKEND_URL = "http://localhost:8080";

export default function App() {
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, scanning, success, failed
  const webcamRef = useRef(null);

  // THE EARS & MOUTH (Step 1 & 3 & 4)
  const conversation = useConversation({
    onConnect: () => console.log("Connected to ElevenLabs Agent"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (msg) => {
      console.log("Message:", msg);
      // Fallback: If the Agent says specific words, trigger security.
      // Ideally, we use clientTools, but text matching is a robust backup for demos.
      if (msg.message?.text?.toLowerCase().includes("scan your face")) {
        console.log("Trigger detected via text");
        setIsBiometricOpen(true);
      }
    },
    onError: (err) => console.error("Error:", err),
    // THE SECURITY TRIGGER (Step 5)
    // If you configured a Client Tool in ElevenLabs UI named "triggerBiometric":
    clientTools: {
      triggerBiometric: () => {
        console.log("Trigger detected via Client Tool");
        setIsBiometricOpen(true);
        return "Biometric UI Opened";
      }
    }
  });

  const captureAndVerify = async () => {
    if (!webcamRef.current) return;
    setVerificationStatus('scanning');

    // Capture "Real Web Reality" Image
    const imageSrc = webcamRef.current.getScreenshot();

    try {
      // Send to "The Brain" (Google Cloud Run / Backend)
      const response = await fetch(`${BACKEND_URL}/verify-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc })
      });

      const data = await response.json();

      if (data.verified) {
        setVerificationStatus('success');
        // Notify the Agent (The Loop)
        // conversation.send("Biometric Verified"); // Optional: Send text back to Agent if needed
        setTimeout(() => setIsBiometricOpen(false), 2000);
      } else {
        setVerificationStatus('failed');
        setTimeout(() => setVerificationStatus('idle'), 2000);
      }
    } catch (e) {
      console.error("Verification error", e);
      setVerificationStatus('failed');
    }
  };

  const startSession = async () => {
    try {
      // Step 1: Input (WebSocket init)
      await conversation.startSession({
        agentId: AGENT_ID,
      });
    } catch (e) {
      console.error("Failed to start conversation", e);
    }
  };

  const stopSession = async () => {
    await conversation.endSession();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
      {/* Background UI */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="absolute top-8 left-0 right-0 flex justify-between items-center px-8 z-10">
        <h1 className="text-2xl font-bold tracking-tighter text-cyan-400">TunjiaX<span className="text-white">-Wallet</span></h1>
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest">
          <div className={`w-2 h-2 rounded-full ${conversation.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          {conversation.status === 'connected' ? 'System Online' : 'Offline'}
        </div>
      </header>

      {/* Main Interface */}
      <main className="relative z-10 flex flex-col items-center gap-12 max-w-md w-full">

        {/* Visualizer / Status Orb */}
        <motion.div
          animate={{
            scale: conversation.isSpeaking ? [1, 1.1, 1] : 1,
            boxShadow: conversation.isSpeaking ? "0 0 50px rgba(6,182,212,0.5)" : "0 0 0px rgba(0,0,0,0)"
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-48 h-48 rounded-full border-2 border-cyan-500/30 flex items-center justify-center bg-black/50 backdrop-blur-sm relative"
        >
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 border-t-cyan-500 animate-spin transition-all duration-[3s]"></div>

          <button
            onClick={conversation.status === 'connected' ? stopSession : startSession}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${conversation.status === 'connected' ? 'bg-cyan-500/10 hover:bg-red-500/20' : 'bg-cyan-500 hover:bg-cyan-400'}`}
          >
            {conversation.status === 'connected' ? <MicOff size={40} className="text-cyan-400" /> : <Mic size={40} className="text-black" />}
          </button>
        </motion.div>

        {/* Status Text */}
        <div className="text-center space-y-2 h-16">
          <p className="text-lg font-medium text-gray-200">
            {conversation.status === 'connected' ? (conversation.isSpeaking ? "TunjiaX is speaking..." : "Listening...") : "Tap to Authenticate"}
          </p>
          <p className="text-sm text-gray-500">
            {conversation.status === 'connected' ? "Secure Channel Active" : "Session Terminated"}
          </p>
        </div>

      </main>

      {/* Biometric Security Modal (Step 5) */}
      <AnimatePresence>
        {isBiometricOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 text-center border-b border-gray-800">
                <h2 className="text-xl font-bold text-white mb-1">Identity Verification</h2>
                <p className="text-gray-400 text-sm">Gemini Vision Analysis Required</p>
              </div>

              <div className="relative aspect-[3/4] bg-black">
                {/* Real Webcam Stream */}
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover opacity-80"
                  videoConstraints={{ facingMode: "user" }}
                />

                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {verificationStatus === 'scanning' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-cyan-500/20 z-10 animate-pulse" />
                  )}
                  {verificationStatus === 'idle' && (
                    <motion.div
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] z-20"
                    />
                  )}
                  {verificationStatus === 'success' && <CheckCircle className="text-green-500 w-24 h-24 z-30 drop-shadow-lg" />}
                  {verificationStatus === 'failed' && <XCircle className="text-red-500 w-24 h-24 z-30 drop-shadow-lg" />}
                </div>
              </div>

              <div className="p-6">
                <button
                  onClick={captureAndVerify}
                  disabled={verificationStatus === 'scanning' || verificationStatus === 'success'}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${verificationStatus === 'success' ? 'bg-green-500 text-black' :
                      verificationStatus === 'failed' ? 'bg-red-500 text-white' : 'bg-cyan-500 text-black hover:bg-cyan-400'
                    }`}
                >
                  {verificationStatus === 'idle' && <><Scan size={20} /> SCAN FACE</>}
                  {verificationStatus === 'scanning' && "VERIFYING..."}
                  {verificationStatus === 'success' && "VERIFIED"}
                  {verificationStatus === 'failed' && "RETRY"}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
