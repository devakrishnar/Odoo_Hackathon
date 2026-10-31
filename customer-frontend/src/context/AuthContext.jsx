import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_customer_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('brightloop_customer_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('brightloop_customer_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('brightloop_customer_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Failed to restore customer session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', {
      email,
      password,
      expectedRole: 'CUSTOMER',
    });

    if (res.success && res.data) {
      const { token, user } = res.data;
      localStorage.setItem('brightloop_customer_token', token);
      localStorage.setItem('brightloop_customer_user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      return { success: true, user };
    }
    return { success: false, message: res.message };
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', {
      ...userData,
      role: 'CUSTOMER',
    });
    return res;
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res;
  };

  const resetPassword = async (token, password) => {
    const res = await api.post('/auth/reset-password', { token, password });
    return res;
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('brightloop_customer_user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      console.warn('Could not refresh user profile:', e);
    }
  };

  const logout = async () => {
    try {
      if (token) await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('brightloop_customer_token');
      localStorage.removeItem('brightloop_customer_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        forgotPassword,
        resetPassword,
        refreshUser,
        logout,
        isCustomer: user?.role === 'CUSTOMER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
