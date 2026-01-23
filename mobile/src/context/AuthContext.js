/**
 * Auth Context for Saqr Mobile App
 * Manages authentication state globally
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, setToken, removeToken } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const userData = await authAPI.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.log('Not authenticated:', error.message);
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData) => {
    setUser(userData);
    setIsGuest(false);
  };

  const loginAsGuest = () => {
    setUser({
      user_id: 'guest_' + Date.now(),
      name: 'زائر',
      email: 'guest@saqr.app',
      points: 0,
      total_earned: 0,
      watched_ads: [],
    });
    setIsGuest(true);
  };

  const logout = async () => {
    try {
      if (!isGuest) {
        await authAPI.logout();
      }
    } catch (error) {
      console.log('Logout error:', error);
    }
    await removeToken();
    setUser(null);
    setIsGuest(false);
  };

  const refreshUser = async () => {
    if (isGuest) return;
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch (error) {
      console.log('Failed to refresh user:', error);
    }
  };

  const updatePoints = (newPoints, totalEarned) => {
    setUser(prev => ({
      ...prev,
      points: newPoints,
      total_earned: totalEarned,
    }));
  };

  const value = {
    user,
    isLoading,
    isGuest,
    isAuthenticated: !!user,
    login,
    loginAsGuest,
    logout,
    refreshUser,
    updatePoints,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
