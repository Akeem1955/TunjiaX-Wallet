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

// Setup Route - requires auth but NOT profile image
function SetupRoute({ children }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [hasProfileImage, setHasProfileImage] = useState(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        if (user && !user.user?.is_new_user) {
            // Check if user already has profile image
            fetch(`${backendUrl}/check-profile-image?user_id=${user.user?.user_id || 1}`)
                .then(res => res.json())
                .then(data => {
                    if (data.has_image) {
                        navigate('/dashboard', { replace: true });
                    } else {
                        setHasProfileImage(false);
                    }
                })
                .catch(() => setHasProfileImage(false));
        } else if (user?.user?.is_new_user) {
            setHasProfileImage(false);
        }
    }, [user, navigate, backendUrl]);

    if (loading || hasProfileImage === null) {
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
    const [checking, setChecking] = useState(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        if (user) {
            // New users must complete setup first
            if (user.user?.is_new_user) {
                navigate('/setup', { replace: true });
                return;
            }

            // Check if user has profile image
            fetch(`${backendUrl}/check-profile-image?user_id=${user.user?.user_id || 1}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.has_image) {
                        navigate('/setup', { replace: true });
                    } else {
                        setChecking(false);
                    }
                })
                .catch(() => setChecking(false));
        }
    }, [user, navigate, backendUrl]);

    if (loading || checking) {
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

            {/* Setup route - for new users or users without profile image */}
            <Route
                path="/setup"
                element={
                    <SetupRoute>
                        <PersonalDetails />
                    </SetupRoute>
                }
            />

            {/* Protected dashboard route */}
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
