import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authService.getCurrentAdmin();
      if (data && data.success && data.admin) {
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
    } catch (_) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data && data.admin) {
      setAdmin(data.admin);
    }
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        setAdmin,
        isAuthenticated: Boolean(admin),
        loading,
        login,
        logout,
        refreshAdmin: checkAuth
      }}
    >
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

