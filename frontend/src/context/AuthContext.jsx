import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);

    // Set default axios header
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = async (type, value, password) => {
        setLoading(true);
        try {
            const res = await axios.post('/api/login', { type, value, password });
            const { token: newToken, user: userData } = res.data;

            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));
            toast.success('Successfully logged in!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.error || 'Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (type, value, password) => {
        setLoading(true);
        try {
            const res = await axios.post('/api/signup', { type, value, password });
            const { token: newToken, user: userData } = res.data;

            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));
            toast.success('Account created!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.error || 'Signup failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast('Logged out', { icon: '👋' });
    };

    return (
        <AuthContext.Provider value={{ token, user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
