/**
 * Home Screen - Ad Viewer (Instagram Reels style)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../context/AuthContext';
import { adsAPI } from '../services/api';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const AdItem = ({ item, isActive, onWatchComplete, isGuest }) => {
  const videoRef = useRef(null);
  const [watchTime, setWatchTime] = useState(0);
  const [hasEarnedPoints, setHasEarnedPoints] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const watchTimerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
      startWatchTimer();
    } else {
      videoRef.current?.pauseAsync();
      stopWatchTimer();
      setWatchTime(0);
      setHasEarnedPoints(false);
    }

    return () => stopWatchTimer();
  }, [isActive]);

  const startWatchTimer = () => {
    watchTimerRef.current = setInterval(() => {
      setWatchTime(prev => {
        const newTime = prev + 1;
        // Earn points after 60 seconds
        if (newTime >= 60 && !hasEarnedPoints && !isGuest) {
          setHasEarnedPoints(true);
          onWatchComplete(item.id, 60);
        }
        return newTime;
      });
    }, 1000);
  };

  const stopWatchTimer = () => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
      watchTimerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((watchTime / 60) * 100, 100);

  return (
    <View style={styles.adContainer}>
      <Video
        ref={videoRef}
        source={{ uri: item.video_url }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isActive}
        onPlaybackStatusUpdate={(status) => {
          setIsBuffering(status.isBuffering);
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(watchTime)}</Text>
            {!isGuest && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            )}
          </View>
          {hasEarnedPoints && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+1 نقطة! 🎉</Text>
            </View>
          )}
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.advertiserName}>@{item.advertiser}</Text>
          <Text style={styles.adTitle}>{item.title}</Text>
          <Text style={styles.adDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        {/* Buffering Indicator */}
        {isBuffering && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Guest Warning */}
        {isGuest && (
          <View style={styles.guestWarning}>
            <Text style={styles.guestWarningText}>
              🔒 سجّل الدخول لكسب النقاط
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const { user, isGuest, refreshUser, updatePoints } = useAuth();
  const [ads, setAds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const data = await adsAPI.getAds();
      setAds(data);
    } catch (error) {
      console.error('Failed to load ads:', error);
      Alert.alert('خطأ', 'فشل تحميل الإعلانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchComplete = async (adId, watchTime) => {
    if (isGuest) {
      Alert.alert(
        '🔒 سجّل الدخول',
        'قم بتسجيل الدخول للحصول على نقاط عند مشاهدة الإعلانات'
      );
      return;
    }

    try {
      const result = await adsAPI.watchAd(adId, watchTime);
      updatePoints(result.user_points, result.total_earned || user.total_earned);
      Alert.alert('🎉 رائع!', `حصلت على ${result.points_earned} نقطة!`);
    } catch (error) {
      if (error.response?.status === 400) {
        // Already watched
        console.log('Ad already watched');
      } else {
        console.error('Watch ad error:', error);
      }
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>جاري تحميل الإعلانات...</Text>
      </View>
    );
  }

  if (ads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyText}>لا توجد إعلانات حالياً</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadAds}>
          <Text style={styles.refreshText}>تحديث</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Points Header */}
      <View style={styles.pointsHeader}>
        <View style={styles.pointsBox}>
          <Text style={styles.pointsLabel}>نقاطك</Text>
          <Text style={styles.pointsValue}>{user?.points || 0}</Text>
        </View>
      </View>

      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AdItem
            item={item}
            isActive={index === activeIndex}
            onWatchComplete={handleWatchComplete}
            isGuest={isGuest}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT - 150}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pointsHeader: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
  },
  pointsBox: {
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  pointsValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  adContainer: {
    height: SCREEN_HEIGHT - 150,
    width: SCREEN_WIDTH,
  },
  video: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 100,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  pointsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomInfo: {
    padding: 16,
    paddingBottom: 24,
  },
  advertiserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  adTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  adDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  guestWarning: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  guestWarningText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default HomeScreen;
