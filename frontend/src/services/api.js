import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('saqr_token');
};

// Set token in localStorage
const setToken = (token) => {
  localStorage.setItem('saqr_token', token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem('saqr_token');
};

// Create axios instance with auth header
const createAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth APIs
export const authAPI = {
  // Mock login (will be replaced with real OAuth later)
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
        setToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  getMe: async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: createAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get me error:', error);
      throw error;
    }
  },
  
  logout: () => {
    removeToken();
  }
};

// User APIs
export const userAPI = {
  getProfile: async () => {
    try {
      const response = await axios.get(`${API}/users/profile`, {
        headers: createAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  updateProfile: async (data) => {
    try {
      const response = await axios.put(`${API}/users/profile`, data, {
        headers: createAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Ad APIs
export const adAPI = {
  getAds: async () => {
    try {
      const response = await axios.get(`${API}/ads`, {
        headers: createAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get ads error:', error);
      throw error;
    }
  },
  
  getAd: async (adId) => {
    try {
      const response = await axios.get(`${API}/ads/${adId}`, {
        headers: createAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get ad error:', error);
      throw error;
    }
  },
  
  watchAd: async (adId, watchTime) => {
    try {
      const response = await axios.post(
        `${API}/ads/watch`,
        { ad_id: adId, watch_time: watchTime },
        { headers: createAuthHeaders() }
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
  getWithdrawals: async () => {
    try {
      const response = await axios.get(`${API}/withdrawals`, {
        headers: createAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get withdrawals error:', error);
      throw error;
    }
  },
  
  createWithdrawal: async (data) => {
    try {
      const response = await axios.post(`${API}/withdrawals`, data, {
        headers: createAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Create withdrawal error:', error);
      throw error;
    }
  },
  
  getWithdrawal: async (withdrawalId) => {
    try {
      const response = await axios.get(`${API}/withdrawals/${withdrawalId}`, {
        headers: createAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Get withdrawal error:', error);
      throw error;
    }
  }
};

export { getToken, setToken, removeToken };
