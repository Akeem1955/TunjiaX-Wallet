import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Camera, RefreshCw, Check, Lightbulb, User, Glasses, Shield } from 'lucide-react';

export default function PersonalDetails() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [capturedImage, setCapturedImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const webcamRef = useRef(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const userId = user?.user?.user_id || 1;

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
    }, [webcamRef]);

    const retake = () => {
        setCapturedImage(null);
        setSuccess(false);
    };

    const handleSubmit = async () => {
        if (!capturedImage) return;

        setUploading(true);
        try {
            const response = await fetch(`${backendUrl}/upload-profile-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    image: capturedImage
                })
            });

            if (response.ok) {
                setSuccess(true);
                // Navigate to dashboard after a brief success message
                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 1500);
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    const tips = [
        { icon: <Lightbulb className="w-5 h-5" />, text: 'Ensure good lighting on your face' },
        { icon: <User className="w-5 h-5" />, text: 'Look directly at the camera' },
        { icon: <Glasses className="w-5 h-5" />, text: 'Remove glasses if possible' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-50/20 to-surface-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
            >
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-medium mb-4 border border-brand-200">
                        <Shield className="w-4 h-4" />
                        Biometric Setup
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
                        Secure Your Account
                    </h1>
                    <p className="text-slate-500 text-lg max-w-md mx-auto">
                        We'll use your face for quick and secure transaction verification
                    </p>
                </motion.div>

                {/* Main Card */}
                <Card variant="elevated" padding="lg" className="relative overflow-hidden">
                    {/* Success overlay */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 10 }}
                                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4"
                            >
                                <Check className="w-10 h-10 text-emerald-600" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">All Set!</h3>
                            <p className="text-slate-500">Redirecting to dashboard...</p>
                        </motion.div>
                    )}

                    {/* Webcam container */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-6 border-2 border-surface-200">
                        {capturedImage ? (
                            <motion.img
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{
                                    facingMode: 'user',
                                    width: 1280,
                                    height: 720
                                }}
                            />
                        )}

                        {/* Face guide overlay */}
                        {!capturedImage && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.02, 1],
                                        opacity: [0.8, 1, 0.8]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-48 h-64 md:w-56 md:h-72 border-4 border-brand-400 rounded-[4rem] relative"
                                >
                                    {/* Corner indicators */}
                                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-2xl" />
                                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-2xl" />
                                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-2xl" />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-2xl" />
                                </motion.div>

                                {/* Instruction label */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-2 bg-slate-900/80 text-white text-sm font-medium rounded-full">
                                        Position your face in the frame
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                        {tips.map((tip, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-center gap-3 p-3 bg-surface-100 rounded-xl border border-surface-200"
                            >
                                <div className="text-brand-600">{tip.icon}</div>
                                <span className="text-sm text-slate-600">{tip.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        {capturedImage ? (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={retake}
                                    icon={<RefreshCw className="w-5 h-5" />}
                                    fullWidth
                                    size="lg"
                                >
                                    Retake
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    loading={uploading}
                                    icon={<Check className="w-5 h-5" />}
                                    fullWidth
                                    size="lg"
                                >
                                    {uploading ? 'Uploading...' : 'Confirm & Continue'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={capture}
                                icon={<Camera className="w-5 h-5" />}
                                fullWidth
                                size="lg"
                            >
                                Capture Photo
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Security note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-6"
                >
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Your image is encrypted and securely stored
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
