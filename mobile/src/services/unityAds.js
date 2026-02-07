// Unity Ads Service - شبكة إعلانات احتياطية
import { Platform } from 'react-native';

// Unity Ads Game IDs (يجب الحصول عليها من Unity Dashboard)
const UNITY_GAME_IDS = {
  ios: 'YOUR_IOS_GAME_ID', // سيتم تحديثها لاحقاً
  android: 'YOUR_ANDROID_GAME_ID', // سيتم تحديثها لاحقاً
};

const REWARDED_PLACEMENT_ID = 'Rewarded_iOS'; // أو Rewarded_Android

let UnityAds = null;

class UnityAdsService {
  constructor() {
    this.isInitialized = false;
    this.isAdReady = false;
    this.onRewardEarned = null;
    this.onAdClosed = null;
    this.onError = null;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Dynamic import for Unity Ads
      const UnityAdsModule = require('react-native-unity-ads');
      UnityAds = UnityAdsModule.default || UnityAdsModule;

      const gameId = Platform.OS === 'ios' 
        ? UNITY_GAME_IDS.ios 
        : UNITY_GAME_IDS.android;

      if (gameId.includes('YOUR_')) {
        console.log('Unity Ads: Game ID not configured');
        return false;
      }

      await UnityAds.initialize(gameId, __DEV__);
      this.isInitialized = true;
      console.log('Unity Ads initialized');

      // Set up listeners
      UnityAds.addListener('onUnityAdsReady', (placementId) => {
        if (placementId === REWARDED_PLACEMENT_ID) {
          this.isAdReady = true;
          console.log('Unity rewarded ad ready');
        }
      });

      UnityAds.addListener('onUnityAdsFinish', (placementId, result) => {
        if (placementId === REWARDED_PLACEMENT_ID) {
          if (result === 'COMPLETED') {
            console.log('Unity ad completed - reward earned');
            if (this.onRewardEarned) {
              this.onRewardEarned({ amount: 5, type: 'points' });
            }
          }
          this.isAdReady = false;
          if (this.onAdClosed) {
            this.onAdClosed();
          }
        }
      });

      UnityAds.addListener('onUnityAdsError', (error) => {
        console.error('Unity Ads error:', error);
        if (this.onError) {
          this.onError(error);
        }
      });

      return true;
    } catch (error) {
      console.error('Unity Ads init error:', error);
      return false;
    }
  }

  async loadRewardedAd() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (UnityAds) {
        await UnityAds.load(REWARDED_PLACEMENT_ID);
      }
    } catch (error) {
      console.error('Failed to load Unity ad:', error);
    }
  }

  async showRewardedAd() {
    if (!this.isAdReady || !UnityAds) {
      console.log('Unity ad not ready');
      return false;
    }

    try {
      await UnityAds.show(REWARDED_PLACEMENT_ID);
      return true;
    } catch (error) {
      console.error('Failed to show Unity ad:', error);
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

  isReady() {
    return this.isAdReady;
  }
}

export const unityAdsService = new UnityAdsService();
export default unityAdsService;
