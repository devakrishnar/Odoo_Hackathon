import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('brightloop_admin_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Logout clears local storage and resets state
  const logout = useCallback(async () => {
    try {
      const activeToken = localStorage.getItem('brightloop_admin_token');
      if (activeToken) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('brightloop_admin_token');
      localStorage.removeItem('brightloop_admin_user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // Verify stored session with backend on app launch
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('brightloop_admin_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const currentUser = res?.data?.user;

        // Strict role validation: Reject non-admin tokens
        if (currentUser && currentUser.role === 'ADMIN') {
          if (isMounted) {
            setUser(currentUser);
            localStorage.setItem('brightloop_admin_user', JSON.stringify(currentUser));
          }
        } else {
          // Token belongs to STAFF or CUSTOMER; invalidate from admin portal
          await logout();
        }
      } catch {
        // Expired or invalid token
        await logout();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  // Login strictly through shared backend API
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        expectedRole: 'ADMIN',
      });

      if (res?.success && res.data) {
        const { token: receivedToken, user: receivedUser } = res.data;

        // Security check: Only allow ADMIN role into admin portal
        if (receivedUser?.role !== 'ADMIN') {
          return {
            success: false,
            message: `Access denied. Role '${receivedUser?.role}' is not authorized for the Admin Console. Please use your designated portal.`,
          };
        }

        // Store session adhering to agreed convention
        localStorage.setItem('brightloop_admin_token', receivedToken);
        localStorage.setItem('brightloop_admin_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);

        return { success: true, user: receivedUser };
      }

      return {
        success: false,
        message: res?.message || 'Authentication failed. Please verify credentials.',
      };
    } catch (err) {
      // Backend structured error message
      const serverMsg = err?.response?.data?.message || err?.message;

      if (!err?.response && (err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK')) {
        return {
          success: false,
          message: 'Cannot connect to authentication server. Please ensure the backend is running at http://localhost:5000',
        };
      }

      return {
        success: false,
        message: serverMsg || 'Login failed. Please check your credentials.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(token && user?.role === 'ADMIN'),
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
