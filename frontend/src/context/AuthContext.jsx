import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const loginWithGoogle = async (credential) => {
        try {
            const decoded = jwtDecode(credential);

            const res = await fetch(`${backendUrl}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: credential,
                    email: decoded.email,
                    name: decoded.name,
                    picture: decoded.picture
                }),
            });

            if (!res.ok) {
                throw new Error('Login failed on server');
            }

            const data = await res.json();
            const userData = { ...data, picture: decoded.picture };

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to login. Please try again.');
        }
    };

    const logout = () => {
        googleLogout();
        setUser(null);
        localStorage.removeItem('user');
    };

    const value = {
        user,
        loading,
        error,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
