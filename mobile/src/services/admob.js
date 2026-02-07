// AdMob Service for Rewarded Ads
import { Platform } from 'react-native';
import mobileAds, { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';

// Production Ad Unit IDs
const REWARDED_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-5132559433385403/2999033852',
  android: 'ca-app-pub-5132559433385403/2999033852',
});

class AdMobService {
  constructor() {
    this.rewardedAd = null;
    this.isInitialized = false;
    this.isAdLoaded = false;
    this.onRewardEarned = null;
    this.onAdClosed = null;
    this.onError = null;
  }

  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      await mobileAds().initialize();
      this.isInitialized = true;
      console.log('AdMob SDK initialized');
      return true;
    } catch (error) {
      console.error('AdMob init error:', error);
      return false;
    }
  }

  getAdUnitId() {
    // Use test ads in development
    if (__DEV__) {
      return TestIds.REWARDED;
    }
    return REWARDED_AD_UNIT_ID;
  }

  async loadRewardedAd() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Clean up previous ad if exists
    if (this.rewardedAd) {
      this.rewardedAd.removeAllListeners();
      this.rewardedAd = null;
    }

    const adUnitId = this.getAdUnitId();
    
    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
      keywords: ['rewards', 'earn', 'points', 'money'],
    });

    // Set up listeners
    const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('Rewarded ad loaded');
        this.isAdLoaded = true;
      }
    );

    const unsubscribeEarned = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('User earned reward:', reward);
        if (this.onRewardEarned) {
          this.onRewardEarned(reward);
        }
      }
    );

    const unsubscribeClosed = this.rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('Ad closed');
        this.isAdLoaded = false;
        if (this.onAdClosed) {
          this.onAdClosed();
        }
        // Preload next ad
        setTimeout(() => this.loadRewardedAd(), 1000);
      }
    );

    const unsubscribeError = this.rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('Ad error:', error);
        this.isAdLoaded = false;
        if (this.onError) {
          this.onError(error);
        }
      }
    );

    // Load the ad
    try {
      await this.rewardedAd.load();
    } catch (error) {
      console.error('Failed to load ad:', error);
      this.isAdLoaded = false;
    }
  }

  async showRewardedAd() {
    if (!this.isAdLoaded || !this.rewardedAd) {
      console.log('Ad not ready, loading...');
      await this.loadRewardedAd();
      // Wait for ad to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (!this.isAdLoaded) {
        return false;
      }
    }

    try {
      await this.rewardedAd.show();
      return true;
    } catch (error) {
      console.error('Failed to show ad:', error);
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
    return this.isAdLoaded;
  }
}

export const adMobService = new AdMobService();
export default adMobService;
