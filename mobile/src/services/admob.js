/**
 * AdMob Service for Saqr Mobile App
 * Handles Google AdMob rewarded video ads integration
 * 
 * Note: This service requires react-native-google-mobile-ads package
 * which should be installed once the app is ready for production
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

// AdMob Test Ad Unit IDs (for development)
const TEST_AD_UNITS = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313'
};

class AdMobService {
  constructor() {
    this.settings = null;
    this.isInitialized = false;
    this.dailyAdsWatched = 0;
    this.lastAdTime = null;
  }

  /**
   * Initialize AdMob with settings from backend
   */
  async initialize() {
    try {
      // Fetch AdMob settings from backend
      const response = await fetch(`${API_URL}/settings/public/admob`);
      const data = await response.json();
      
      if (data.enabled) {
        this.settings = {
          enabled: true,
          appId: Platform.OS === 'ios' ? data.app_id_ios : data.app_id_android,
          rewardedAdUnitId: Platform.OS === 'ios' ? data.rewarded_ad_unit_ios : data.rewarded_ad_unit_android,
          pointsPerAd: data.points_per_ad || 5,
          dailyLimit: data.daily_limit || 20,
          cooldown: data.cooldown || 30
        };

        // Use test ads if no real ad unit configured
        if (!this.settings.rewardedAdUnitId) {
          this.settings.rewardedAdUnitId = TEST_AD_UNITS[Platform.OS];
          console.log('Using test ad unit');
        }

        // Load daily count from storage
        await this.loadDailyCount();
        
        this.isInitialized = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
      return false;
    }
  }

  /**
   * Load today's ad watch count from storage
   */
  async loadDailyCount() {
    try {
      const today = new Date().toDateString();
      const stored = await AsyncStorage.getItem('admob_daily_count');
      
      if (stored) {
        const { date, count } = JSON.parse(stored);
        if (date === today) {
          this.dailyAdsWatched = count;
        } else {
          // New day, reset count
          this.dailyAdsWatched = 0;
          await this.saveDailyCount();
        }
      }
    } catch (error) {
      console.error('Failed to load daily count:', error);
    }
  }

  /**
   * Save today's ad watch count to storage
   */
  async saveDailyCount() {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem('admob_daily_count', JSON.stringify({
        date: today,
        count: this.dailyAdsWatched
      }));
    } catch (error) {
      console.error('Failed to save daily count:', error);
    }
  }

  /**
   * Check if user can watch another ad
   */
  canWatchAd() {
    if (!this.settings?.enabled) {
      return { canWatch: false, reason: 'AdMob غير مفعل' };
    }

    if (this.dailyAdsWatched >= this.settings.dailyLimit) {
      return { canWatch: false, reason: 'وصلت للحد الأقصى اليومي' };
    }

    if (this.lastAdTime) {
      const secondsSince = (Date.now() - this.lastAdTime) / 1000;
      if (secondsSince < this.settings.cooldown) {
        const remaining = Math.ceil(this.settings.cooldown - secondsSince);
        return { canWatch: false, reason: `انتظر ${remaining} ثانية` };
      }
    }

    return { canWatch: true };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      enabled: this.settings?.enabled || false,
      dailyWatched: this.dailyAdsWatched,
      dailyLimit: this.settings?.dailyLimit || 20,
      pointsPerAd: this.settings?.pointsPerAd || 5,
      cooldown: this.settings?.cooldown || 30
    };
  }

  /**
   * Record that user watched an ad
   */
  async recordAdWatch() {
    this.dailyAdsWatched++;
    this.lastAdTime = Date.now();
    await this.saveDailyCount();
    
    return {
      pointsEarned: this.settings?.pointsPerAd || 5,
      adsRemaining: this.settings.dailyLimit - this.dailyAdsWatched
    };
  }

  /**
   * Get ad unit ID for rewarded ads
   */
  getRewardedAdUnitId() {
    return this.settings?.rewardedAdUnitId || TEST_AD_UNITS[Platform.OS];
  }
}

// Export singleton instance
export const adMobService = new AdMobService();
export default adMobService;
