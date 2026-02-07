// AdMob Service for Rewarded Ads
import { Platform } from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType,
} from 'react-native-google-mobile-ads';

// Production Ad Unit IDs
const AD_UNIT_IDS = {
  ios: {
    rewarded: 'ca-app-pub-5132559433385403/2999033852',
  },
  android: {
    rewarded: 'ca-app-pub-5132559433385403/2999033852', // Update with Android Ad Unit ID when available
  },
};

// Use test IDs in development
const USE_TEST_ADS = __DEV__;

class AdMobService {
  constructor() {
    this.rewardedAd = null;
    this.isLoading = false;
    this.isLoaded = false;
    this.onRewardEarned = null;
    this.onAdClosed = null;
    this.onError = null;
  }

  getRewardedAdUnitId() {
    if (USE_TEST_ADS) {
      return TestIds.REWARDED;
    }
    return Platform.OS === 'ios' 
      ? AD_UNIT_IDS.ios.rewarded 
      : AD_UNIT_IDS.android.rewarded;
  }

  async loadRewardedAd() {
    if (this.isLoading || this.isLoaded) {
      return;
    }

    this.isLoading = true;
    const adUnitId = this.getRewardedAdUnitId();
    
    try {
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['rewards', 'points', 'earn', 'مكافآت', 'نقاط'],
      });

      // Set up event listeners
      this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        console.log('Rewarded ad loaded');
        this.isLoading = false;
        this.isLoaded = true;
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
        console.log('User earned reward:', reward);
        if (this.onRewardEarned) {
          this.onRewardEarned(reward);
        }
      });

      this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('Rewarded ad closed');
        this.isLoaded = false;
        if (this.onAdClosed) {
          this.onAdClosed();
        }
        // Preload next ad
        this.loadRewardedAd();
      });

      this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('Rewarded ad error:', error);
        this.isLoading = false;
        this.isLoaded = false;
        if (this.onError) {
          this.onError(error);
        }
      });

      // Load the ad
      await this.rewardedAd.load();
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
      this.isLoading = false;
      this.isLoaded = false;
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  async showRewardedAd() {
    if (!this.isLoaded || !this.rewardedAd) {
      console.log('Rewarded ad not loaded yet');
      // Try to load if not loaded
      await this.loadRewardedAd();
      return false;
    }

    try {
      await this.rewardedAd.show();
      return true;
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      this.isLoaded = false;
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
    return this.isLoaded;
  }

  cleanup() {
    if (this.rewardedAd) {
      this.rewardedAd.removeAllListeners();
      this.rewardedAd = null;
    }
    this.isLoaded = false;
    this.isLoading = false;
  }
}

// Export singleton instance
export const adMobService = new AdMobService();
export default adMobService;
