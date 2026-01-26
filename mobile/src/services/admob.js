/**
 * AdMob Service for Saqr Mobile App
 * Handles Google AdMob rewarded video ads integration
 * 
 * App ID: ca-app-pub-5132559433385403~1073385732
 * Rewarded Ad Unit ID: ca-app-pub-5132559433385403/3389052725
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://saqr-ads.preview.emergentagent.com';

// Production Ad Unit IDs
const PRODUCTION_AD_UNITS = {
  appId: 'ca-app-pub-5132559433385403~1073385732',
  rewardedAdUnitId: 'ca-app-pub-5132559433385403/3389052725'
};

// Test Ad Unit IDs (for development/testing)
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
    this.useTestAds = __DEV__; // Use test ads in development
  }

  /**
   * Initialize AdMob with settings from backend
   */
  async initialize() {
    try {
      // Fetch AdMob settings from backend
      const response = await fetch(`${API_URL}/api/settings/public/admob`);
      const data = await response.json();
      
      if (data.enabled) {
        this.settings = {
          enabled: true,
          appId: PRODUCTION_AD_UNITS.appId,
          rewardedAdUnitId: this.useTestAds 
            ? TEST_AD_UNITS[Platform.OS] 
            : PRODUCTION_AD_UNITS.rewardedAdUnitId,
          pointsPerAd: data.points_per_ad || 5,
          dailyLimit: data.daily_limit || 20,
          cooldown: data.cooldown || 30
        };

        // Load daily count from storage
        await this.loadDailyCount();
        
        this.isInitialized = true;
        console.log('AdMob initialized successfully');
        console.log('Using', this.useTestAds ? 'TEST' : 'PRODUCTION', 'ads');
        return true;
      }
      
      console.log('AdMob is disabled in settings');
      return false;
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
      return false;
    }
  }

  /**
   * Get App ID
   */
  getAppId() {
    return PRODUCTION_AD_UNITS.appId;
  }

  /**
   * Get Rewarded Ad Unit ID
   */
  getRewardedAdUnitId() {
    if (this.useTestAds) {
      return TEST_AD_UNITS[Platform.OS];
    }
    return this.settings?.rewardedAdUnitId || PRODUCTION_AD_UNITS.rewardedAdUnitId;
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
      cooldown: this.settings?.cooldown || 30,
      useTestAds: this.useTestAds
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
   * Set test mode (for development)
   */
  setTestMode(useTest) {
    this.useTestAds = useTest;
    if (this.settings) {
      this.settings.rewardedAdUnitId = useTest 
        ? TEST_AD_UNITS[Platform.OS] 
        : PRODUCTION_AD_UNITS.rewardedAdUnitId;
    }
  }
}

// Export singleton instance
export const adMobService = new AdMobService();
export default adMobService;

// Export constants for direct use
export const ADMOB_APP_ID = PRODUCTION_AD_UNITS.appId;
export const ADMOB_REWARDED_AD_UNIT_ID = PRODUCTION_AD_UNITS.rewardedAdUnitId;
