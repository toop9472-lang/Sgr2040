/**
 * Rewarded Ad Button Component
 * Shows a button to watch rewarded ads and earn points
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { adMobService, ADMOB_REWARDED_AD_UNIT_ID } from '../services/admob';

// Note: react-native-google-mobile-ads needs to be installed
// Run: npx expo install react-native-google-mobile-ads

let RewardedAd, RewardedAdEventType, AdEventType;

try {
  const mobileAds = require('react-native-google-mobile-ads');
  RewardedAd = mobileAds.RewardedAd;
  RewardedAdEventType = mobileAds.RewardedAdEventType;
  AdEventType = mobileAds.AdEventType;
} catch (e) {
  console.log('react-native-google-mobile-ads not installed yet');
}

const RewardedAdButton = ({ onRewardEarned, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [adError, setAdError] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [status, setStatus] = useState(null);
  const [rewardedAd, setRewardedAd] = useState(null);

  useEffect(() => {
    initializeAdMob();
  }, []);

  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const initializeAdMob = async () => {
    const initialized = await adMobService.initialize();
    if (initialized) {
      setStatus(adMobService.getStatus());
      loadAd();
    }
  };

  const loadAd = useCallback(() => {
    if (!RewardedAd) {
      console.log('AdMob SDK not available');
      return;
    }

    setIsLoading(true);
    setAdError(null);

    const adUnitId = adMobService.getRewardedAdUnitId();
    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsAdLoaded(true);
      setIsLoading(false);
      console.log('Rewarded ad loaded');
    });

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async (reward) => {
        console.log('User earned reward:', reward);
        const result = await adMobService.recordAdWatch();
        setStatus(adMobService.getStatus());
        
        // Start cooldown
        setCooldownRemaining(adMobService.settings?.cooldown || 30);
        
        if (onRewardEarned) {
          onRewardEarned(result.pointsEarned);
        }
        
        Alert.alert(
          '🎉 مبروك!',
          `حصلت على ${result.pointsEarned} نقاط!\n\nمتبقي لك ${result.adsRemaining} إعلان اليوم`,
          [{ text: 'رائع!' }]
        );
      }
    );

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsAdLoaded(false);
      // Load next ad
      setTimeout(loadAd, 1000);
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Ad error:', error);
      setAdError('فشل تحميل الإعلان');
      setIsLoading(false);
      // Retry after delay
      setTimeout(loadAd, 5000);
    });

    ad.load();
    setRewardedAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [onRewardEarned]);

  const showAd = async () => {
    const { canWatch, reason } = adMobService.canWatchAd();
    
    if (!canWatch) {
      Alert.alert('⏳ انتظر', reason);
      return;
    }

    if (rewardedAd && isAdLoaded) {
      await rewardedAd.show();
    } else {
      Alert.alert('⏳ جاري التحميل', 'يرجى الانتظار حتى يتم تحميل الإعلان');
      loadAd();
    }
  };

  // If AdMob SDK not installed, show placeholder
  if (!RewardedAd) {
    return (
      <View style={styles.container}>
        <View style={[styles.button, styles.buttonDisabled]}>
          <Text style={styles.buttonText}>📺 إعلانات المكافآت</Text>
          <Text style={styles.subText}>يتطلب تثبيت التطبيق</Text>
        </View>
      </View>
    );
  }

  const isButtonDisabled = disabled || isLoading || !isAdLoaded || cooldownRemaining > 0;

  return (
    <View style={styles.container}>
      {/* Status Info */}
      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            📊 شاهدت {status.dailyWatched}/{status.dailyLimit} إعلان اليوم
          </Text>
          <Text style={styles.pointsText}>
            🎁 {status.pointsPerAd} نقطة لكل إعلان
          </Text>
        </View>
      )}

      {/* Watch Ad Button */}
      <TouchableOpacity
        style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
        onPress={showAd}
        disabled={isButtonDisabled}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : cooldownRemaining > 0 ? (
          <>
            <Text style={styles.buttonText}>⏳ انتظر {cooldownRemaining}s</Text>
          </>
        ) : (
          <>
            <Text style={styles.buttonText}>🎬 شاهد إعلان واكسب نقاط</Text>
            <Text style={styles.subText}>+{status?.pointsPerAd || 5} نقطة</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {adError && (
        <Text style={styles.errorText}>{adError}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  statusContainer: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  statusText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  pointsText: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RewardedAdButton;
