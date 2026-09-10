import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const verifySession = useCallback(async () => {
        const token = localStorage.getItem('super_admin_token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/admin/verify-session');
            if (res.data && res.data.user) {
                setUser(res.data.user);
            } else {
                logout();
            }
        } catch (err) {
            console.error('Session verification failed:', err);
            logout();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        verifySession();
    }, [verifySession]);

    const login = async (email, password) => {
        // 1. Authenticate with backend auth endpoint
        const loginRes = await api.post('/auth/login', {
            email,
            password,
            device_info: 'Web Admin Portal',
            device_id: 'web_portal'
        });
        const responseData = loginRes.data?.data || loginRes.data;
        const token = responseData?.accessToken || responseData?.token;

        if (!token) {
            throw new Error('Authentication failed. No token received.');
        }

        // Save token temporarily to test super-admin verification
        localStorage.setItem('super_admin_token', token);

        try {
            // 2. Verify Super-Admin Role
            const verifyRes = await api.get('/admin/verify-session');
            if (verifyRes.data && verifyRes.data.user) {
                setUser(verifyRes.data.user);
                return verifyRes.data.user;
            } else {
                throw new Error('Access Denied: Web Dashboard is reserved for Super-Admins.');
            }
        } catch (err) {
            localStorage.removeItem('super_admin_token');
            setUser(null);
            const errorMsg = err.response?.data?.message || err.message || 'Access Denied. Only Super-Admins can access this portal.';
            throw new Error(errorMsg);
        }
    };

    const logout = () => {
        localStorage.removeItem('super_admin_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, verifySession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
