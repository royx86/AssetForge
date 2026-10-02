import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('assetforge_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('assetforge_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('assetforge_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Failed to verify token, logging out:', err.message);
          setToken(null);
          setUser(null);
          localStorage.removeItem('assetforge_token');
          localStorage.removeItem('assetforge_user');
        }
      }
      setLoading(false);
    }
    loadMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token: jwtToken } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('assetforge_token', jwtToken);
    localStorage.setItem('assetforge_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { user: userData, token: jwtToken } = res.data;
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('assetforge_token', jwtToken);
    localStorage.setItem('assetforge_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    try {
      authAPI.logout().catch(() => {});
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('assetforge_token');
      localStorage.removeItem('assetforge_user');
      localStorage.removeItem('assetforge_active_project_id');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout
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
