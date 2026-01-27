// Storage Service - Wrapper for AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
};

export const storage = {
  // Token
  async getToken() {
    return AsyncStorage.getItem(KEYS.USER_TOKEN);
  },
  
  async setToken(token) {
    return AsyncStorage.setItem(KEYS.USER_TOKEN, token);
  },
  
  async removeToken() {
    return AsyncStorage.removeItem(KEYS.USER_TOKEN);
  },

  // User Data
  async getUserData() {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },
  
  async setUserData(user) {
    return AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
  },
  
  async removeUserData() {
    return AsyncStorage.removeItem(KEYS.USER_DATA);
  },

  // Theme
  async getTheme() {
    return AsyncStorage.getItem(KEYS.THEME);
  },
  
  async setTheme(theme) {
    return AsyncStorage.setItem(KEYS.THEME, theme);
  },

  // Clear all
  async clearAll() {
    return AsyncStorage.multiRemove([KEYS.USER_TOKEN, KEYS.USER_DATA]);
  },
};

export default storage;
