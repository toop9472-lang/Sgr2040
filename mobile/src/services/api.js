// API Service - Lightweight API handler
const API_URL = 'https://eagle-reels.preview.emergentagent.com';

export const api = {
  baseUrl: API_URL,
  
  // Generic fetch with error handling
  async fetch(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Auth
  async login(email, password) {
    return this.fetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email, password, name) {
    return this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  // Ads
  async getAds() {
    return this.fetch('/api/ads');
  },

  // Settings
  async getRewardsSettings() {
    return this.fetch('/api/settings/public/rewards');
  },

  // AI Chat
  async sendChatMessage(message, token = null) {
    const endpoint = token ? '/api/claude-ai/chat' : '/api/claude-ai/chat/guest';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        messages: [{ role: 'user', content: message }],
        system_message: 'أنت مساعد ذكي في تطبيق صقر. ساعد المستخدم باللغة العربية.'
      }),
    });
  },

  // Record ad view
  async recordAdView(adId, watchDuration, token, pointsEarned = 0) {
    return this.fetch('/api/rewarded-ads/complete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ad_type: 'video',
        ad_id: adId,
        completed: true,
        watch_duration: watchDuration,
        points_earned: pointsEarned,
      }),
    });
  },

  // Submit advertiser ad
  async submitAdvertiserAd(adData, token = null) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.fetch('/api/advertiser/create-ad', {
      method: 'POST',
      headers,
      body: JSON.stringify(adData),
    });
  },
};

export default api;
