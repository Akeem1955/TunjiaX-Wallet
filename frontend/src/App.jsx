import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/features/auth/Login';
import Dashboard from './components/features/dashboard/Dashboard';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AppContent() {
    const { user } = useAuth();

    // Simple router for now
    if (!user) {
        return <Login />;
    }

    return <Dashboard />;
}

export default function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}
