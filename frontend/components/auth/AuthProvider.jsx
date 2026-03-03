'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await authApi.me();
                    setUser(res.data.data);
                } catch (err) {
                    console.error('Auth check failed', err);
                    localStorage.removeItem('token');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await authApi.login(email, password);
            const { access_token } = res.data;
            localStorage.setItem('token', access_token);

            const userRes = await authApi.me();
            setUser(userRes.data.data);

            toast.success('Successfully logged in');
            router.push('/dashboard');
        } catch (err) {
            toast.error('Login failed', {
                description: err.response?.data?.detail || 'Invalid credentials',
            });
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
