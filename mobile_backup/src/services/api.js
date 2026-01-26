/**
 * API Service for Saqr Mobile App
 * Handles all backend communication
 * 
 * NOTE: For production deployment, update the apiUrl in app.json
 * or set EXPO_PUBLIC_API_URL environment variable
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// API URL priority: 
// 1. Environment variable (EXPO_PUBLIC_API_URL)
// 2. app.json extra.apiUrl
// 3. Fallback for development
const API_URL = process.env.EXPO_PUBLIC_API_URL || 
                Constants.expoConfig?.extra?.apiUrl || 
                'https://rewardviewer-2.preview.emergentagent.com';
const API_BASE = `${API_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'saqr_session_token';

export const setToken = async (token) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// Add auth header to requests
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  // Unified signin - works for both users and admins
  signin: async (data) => {
    const response = await api.post('/auth/signin', data);
    return response.data;
  },
  
  // Legacy - keeping for backward compatibility
  loginEmail: async (data) => {
    const response = await api.post('/auth/signin', data);
    return response.data;
  },
  
  processSession: async (sessionId) => {
    const response = await api.post('/auth/session', { session_id: sessionId });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    await removeToken();
    return response.data;
  },
};

// Ads API
export const adsAPI = {
  getAds: async () => {
    const response = await api.get('/ads');
    return response.data;
  },
  
  watchAd: async (adId, watchTime) => {
    const response = await api.post('/ads/watch', {
      ad_id: adId,
      watch_time: watchTime,
    });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  registerDevice: async (token, platform) => {
    const response = await api.post('/notifications/register-device', { token, platform });
    return response.data;
  },
  
  unregisterDevice: async (token) => {
    const response = await api.delete('/notifications/unregister-device', { params: { token } });
    return response.data;
  },
  
  getMyNotifications: async (limit = 50) => {
    const response = await api.get('/notifications/my-notifications', { params: { limit } });
    return response.data;
  },
  
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/mark-read/${notificationId}`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updatePoints: async (adId, watchTime) => {
    const response = await api.post('/users/update_points', {
      ad_id: adId,
      watch_time: watchTime,
    });
    return response.data;
  },
};

// Withdrawal API
export const withdrawalAPI = {
  getWithdrawals: async () => {
    const response = await api.get('/withdrawals');
    return response.data;
  },
  
  createWithdrawal: async (data) => {
    const response = await api.post('/withdrawals', data);
    return response.data;
  },
  
  getMethods: async () => {
    const response = await api.get('/withdrawals/methods');
    return response.data;
  },
};

// Advertiser API
export const advertiserAPI = {
  getPricing: async () => {
    const response = await api.get('/advertiser/pricing');
    return response.data;
  },
  
  createAd: async (data) => {
    const response = await api.post('/advertiser/ads', data);
    return response.data;
  },
  
  submitPayment: async (adId, data) => {
    const response = await api.post(`/advertiser/ads/${adId}/payment`, data);
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  getPackages: async () => {
    const response = await api.get('/payments/packages');
    return response.data;
  },
  
  createCheckout: async (data) => {
    const response = await api.post('/payments/checkout', data);
    return response.data;
  },
  
  getStatus: async (sessionId) => {
    const response = await api.get(`/payments/status/${sessionId}`);
    return response.data;
  },
};

export default api;
