import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'brightloop_staff_token';
const USER_KEY = 'brightloop_staff_user';

// Safely retrieve the saved user
const getSavedUser = () => {
  try {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

// Clear only this application's authentication data
const clearStaffSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getSavedUser);
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [loading, setLoading] = useState(true);

  // Restore and verify an existing session
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const restoredUser = res?.data?.user;

        // Only STAFF accounts can use this frontend
        if (
          !res?.success ||
          !restoredUser ||
          restoredUser.role !== 'STAFF'
        ) {
          throw new Error('Invalid staff session');
        }

        setUser(restoredUser);
        setToken(storedToken);

        localStorage.setItem(
          USER_KEY,
          JSON.stringify(restoredUser)
        );
      } catch (error) {
        console.error('Failed to restore staff session:', error);

        clearStaffSession();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Staff login
  const login = async (email, password) => {
    const res = await api.post('/auth/login', {
      email: email.trim(),
      password,
      expectedRole: 'STAFF',
    });

    if (!res?.success || !res?.data?.token || !res?.data?.user) {
      return {
        success: false,
        message: res?.message || 'Login failed.',
      };
    }

    const { token: accessToken, user: loggedInUser } = res.data;

    // Additional frontend role verification
    if (loggedInUser.role !== 'STAFF') {
      return {
        success: false,
        message: 'Access denied. Staff accounts only.',
      };
    }

    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));

    setToken(accessToken);
    setUser(loggedInUser);

    return {
      success: true,
      user: loggedInUser,
    };
  };

  // Staff logout
  const logout = async () => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);

    try {
      if (activeToken) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearStaffSession();
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isStaff: user?.role === 'STAFF',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);