import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setCsrfToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      if (data?.user) {
        setUser(data.user);
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data.user) {
      setUser(data.user);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.post('/auth/register', { name, email, password });
    if (data.user) {
      setUser(data.user);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Proceed with clearing local state regardless
    } finally {
      setUser(null);
      setCsrfToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
