import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this with your backend URL
const BACKEND_URL = 'https://pointads.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

// Token management
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('saqr_token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const setToken = async (token) => {
  try {
    await AsyncStorage.setItem('saqr_token', token);
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('saqr_token');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

const createAuthHeaders = async () => {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth APIs
export const authAPI = {
  login: async (provider, userData) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        provider: provider,
        provider_id: userData.id
      });
      
      if (response.data.token) {
        await setToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  getMe: async () => {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.get(`${API}/auth/me`, { headers });
      return response.data;
    } catch (error) {
      console.error('Get me error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    await removeToken();
  }
};

// Ad APIs
export const adAPI = {
  getAds: async () => {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.get(`${API}/ads`, { headers });
      return response.data;
    } catch (error) {
      console.error('Get ads error:', error);
      throw error;
    }
  },
  
  watchAd: async (adId, watchTime) => {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.post(
        `${API}/ads/watch`,
        { ad_id: adId, watch_time: watchTime },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Watch ad error:', error);
      throw error;
    }
  }
};

// Withdrawal APIs
export const withdrawalAPI = {
  createWithdrawal: async (data) => {
    try {
      const headers = await createAuthHeaders();
      const response = await axios.post(`${API}/withdrawals`, data, { headers });
      return response.data;
    } catch (error) {
      console.error('Create withdrawal error:', error);
      throw error;
    }
  }
};

export { getToken, setToken, removeToken };