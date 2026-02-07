// AdMob Service using expo-ads-admob
import { Platform } from 'react-native';
import * as AdMob from 'expo-ads-admob';
import Constants from 'expo-constants';

// Get AdMob config from app.json extra
const admobConfig = Constants.expoConfig?.extra?.admob || {};

// Ad Unit IDs
const AD_UNIT_IDS = {
  ios: admobConfig.ios?.rewardedAdUnitId || 'ca-app-pub-5132559433385403/2999033852',
  android: admobConfig.android?.rewardedAdUnitId || 'ca-app-pub-5132559433385403/2999033852',
};

// Test Ad Unit IDs
const TEST_AD_UNIT_IDS = {
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
};

class AdMobService {
  constructor() {
    this.isInitialized = false;
    this.isAdLoaded = false;
    this.onRewardEarned = null;
    this.onAdClosed = null;
    this.onError = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request tracking permissions on iOS
      if (Platform.OS === 'ios') {
        await AdMob.requestPermissionsAsync();
      }

      // Set test device IDs in development
      if (__DEV__) {
        await AdMob.setTestDeviceIDAsync('EMULATOR');
      }

      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('AdMob initialization error:', error);
      if (this.onError) this.onError(error);
    }
  }

  getRewardedAdUnitId() {
    // Use test ads in development
    if (__DEV__) {
      return Platform.OS === 'ios' ? TEST_AD_UNIT_IDS.ios : TEST_AD_UNIT_IDS.android;
    }
    return Platform.OS === 'ios' ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;
  }

  async loadRewardedAd() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const adUnitId = this.getRewardedAdUnitId();
      
      // Set up event handlers
      AdMob.setRewardedAdDidRewardUserWithRewardCallback((reward) => {
        console.log('User earned reward:', reward);
        if (this.onRewardEarned) {
          this.onRewardEarned(reward);
        }
      });

      AdMob.setRewardedAdDidDismissCallback(() => {
        console.log('Rewarded ad dismissed');
        this.isAdLoaded = false;
        if (this.onAdClosed) {
          this.onAdClosed();
        }
        // Preload next ad
        this.loadRewardedAd();
      });

      AdMob.setRewardedAdDidFailToLoadCallback((error) => {
        console.error('Failed to load rewarded ad:', error);
        this.isAdLoaded = false;
        if (this.onError) {
          this.onError(error);
        }
      });

      // Load the ad
      await AdMob.setRewardedAdUnitIDAsync(adUnitId);
      await AdMob.requestRewardedAdAsync();
      
      this.isAdLoaded = true;
      console.log('Rewarded ad loaded successfully');
    } catch (error) {
      console.error('Error loading rewarded ad:', error);
      this.isAdLoaded = false;
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  async showRewardedAd() {
    if (!this.isAdLoaded) {
      console.log('Ad not loaded, loading now...');
      await this.loadRewardedAd();
      // Wait a bit for ad to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!this.isAdLoaded) {
      console.log('Ad still not ready');
      return false;
    }

    try {
      await AdMob.showRewardedAdAsync();
      return true;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      this.isAdLoaded = false;
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }

  setOnRewardEarned(callback) {
    this.onRewardEarned = callback;
  }

  setOnAdClosed(callback) {
    this.onAdClosed = callback;
  }

  setOnError(callback) {
    this.onError = callback;
  }

  isAdReady() {
    return this.isAdLoaded;
  }
}

export const adMobService = new AdMobService();
export default adMobService;
