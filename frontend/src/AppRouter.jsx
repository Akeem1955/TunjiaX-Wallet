import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/features/auth/Login';
import PersonalDetails from './components/PersonalDetails';
import Dashboard from './components/features/dashboard/Dashboard';

// Protected Route wrapper - requires authentication
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

// Setup Route - just needs auth
function SetupRoute({ children }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [hasImage, setHasImage] = useState(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    useEffect(() => {
        if (user) {
            // Check if already has profile image - redirect to dashboard if yes
            fetch(`${backendUrl}/check-profile-image?user_id=${user.user?.user_id || 1}`)
                .then(res => res.json())
                .then(data => {
                    if (data.has_image) {
                        navigate('/dashboard', { replace: true });
                    } else {
                        setHasImage(false);
                    }
                })
                .catch(() => setHasImage(false));
        }
    }, [user, navigate, backendUrl]);

    if (loading || hasImage === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Dashboard Route - requires auth AND profile image
function DashboardRoute({ children }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [hasImage, setHasImage] = useState(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    useEffect(() => {
        if (user) {
            // Check if user has profile image
            fetch(`${backendUrl}/check-profile-image?user_id=${user.user?.user_id || 1}`)
                .then(res => res.json())
                .then(data => {
                    if (data.has_image) {
                        setHasImage(true);
                    } else {
                        // No profile image - redirect to setup
                        navigate('/setup', { replace: true });
                    }
                })
                .catch(() => setHasImage(true)); // On error, let them through
        }
    }, [user, navigate, backendUrl]);

    if (loading || hasImage === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function AppRouter() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public route */}
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />

            {/* Setup route - for users without profile image */}
            <Route
                path="/setup"
                element={
                    <SetupRoute>
                        <PersonalDetails />
                    </SetupRoute>
                }
            />

            {/* Protected dashboard route - requires profile image */}
            <Route
                path="/dashboard"
                element={
                    <DashboardRoute>
                        <Dashboard />
                    </DashboardRoute>
                }
            />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
    );
}
