// Ad Viewer Screen - Optimized full-screen video ad viewer
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Vibration,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

const { width, height } = Dimensions.get('window');

// Demo ads - lightweight
const DEMO_ADS = [
  {
    id: 'demo1',
    title: 'إعلان سامسونج الجديد',
    description: 'اكتشف هاتف سامسونج الجديد',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    advertiser: 'Samsung',
    website_url: 'https://www.samsung.com/sa/',
  },
  {
    id: 'demo2',
    title: 'عرض خاص من أمازون',
    description: 'تخفيضات حتى 50%',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    advertiser: 'Amazon',
    website_url: 'https://www.amazon.sa/',
  },
  {
    id: 'demo3',
    title: 'مطعم الذواقة',
    description: 'وجبات شهية',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    advertiser: 'Gourmet',
    website_url: 'https://example.com/restaurant',
  },
];

const REQUIRED_WATCH_TIME = 30;
const POINTS_PER_AD = 5;

const AdViewerScreen = ({ onClose, onPointsEarned, user }) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnim, setShowPointsAnim] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const controlsTimerRef = useRef(null);

  // Load ads on mount
  useEffect(() => {
    loadAds();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // Start timer when ad changes
  useEffect(() => {
    if (ads.length > 0) {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, ads.length]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  }, [showControls]);

  const loadAds = async () => {
    try {
      const response = await api.getAds();
      if (response.ok) {
        const data = await response.json();
        setAds(data.length > 0 ? data : DEMO_ADS);
      } else {
        setAds(DEMO_ADS);
      }
    } catch {
      setAds(DEMO_ADS);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    setWatchTime(0);
    setVideoLoading(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setWatchTime((prev) => {
        if (prev >= REQUIRED_WATCH_TIME) {
          clearInterval(timerRef.current);
          completeWatch();
          return REQUIRED_WATCH_TIME;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const completeWatch = useCallback(async () => {
    const points = POINTS_PER_AD;
    setEarnedPoints((prev) => prev + points);
    
    // Show animation
    setShowPointsAnim(true);
    Vibration.vibrate(100);
    setTimeout(() => setShowPointsAnim(false), 2000);
    
    if (onPointsEarned) onPointsEarned(points);

    // Record on server
    const token = await storage.getToken();
    if (token && ads[currentIndex]) {
      try {
        await api.recordAdView(ads[currentIndex].id, REQUIRED_WATCH_TIME, token);
      } catch {}
    }
  }, [currentIndex, ads, onPointsEarned]);

  const goNext = useCallback(() => {
    if (currentIndex < ads.length - 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, ads.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleTap = () => setShowControls(true);

  const handleSwipe = (dy, dx) => {
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
      onClose();
    } else if (dy < -50) {
      goNext();
    } else if (dy > 50) {
      goPrev();
    }
  };

  const visitWebsite = () => {
    const url = ads[currentIndex]?.website_url;
    if (url) Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل الإعلانات...</Text>
      </View>
    );
  }

  if (ads.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noAdsText}>لا توجد إعلانات متاحة</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backBtnText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentAd = ads[currentIndex];
  const progress = (watchTime / REQUIRED_WATCH_TIME) * 100;

  return (
    <View 
      style={styles.container}
      onTouchEnd={(e) => handleTap()}
      onMoveShouldSetResponder={() => true}
      onResponderRelease={(e) => {
        const dy = e.nativeEvent.locationY - (height / 2);
        const dx = e.nativeEvent.locationX - (width / 2);
        // Simple swipe detection
      }}
    >
      {/* Video */}
      {currentAd.video_url ? (
        <Video
          ref={videoRef}
          source={{ uri: currentAd.video_url }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay
          isLooping
          isMuted={isMuted}
          onLoadStart={() => setVideoLoading(true)}
          onLoad={() => setVideoLoading(false)}
        />
      ) : (
        <LinearGradient colors={colors.gradients.primary} style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>{currentAd.title}</Text>
          <Text style={styles.placeholderDesc}>{currentAd.description}</Text>
        </LinearGradient>
      )}

      {/* Video Loading Indicator */}
      {videoLoading && (
        <View style={styles.videoLoadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Controls - Top */}
      {showControls && (
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setIsMuted(!isMuted)}>
            <Text style={styles.controlText}>{isMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>
              {watchTime >= REQUIRED_WATCH_TIME ? `✓ +${POINTS_PER_AD}` : `${REQUIRED_WATCH_TIME - watchTime}s`}
            </Text>
          </View>
        </View>
      )}

      {/* Ad Info - Bottom */}
      {showControls && (
        <View style={styles.adInfoContainer}>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.adInfoGradient}>
            {/* Advertiser */}
            <View style={styles.advertiserRow}>
              <View style={styles.advertiserAvatar}>
                <Text style={styles.avatarText}>{(currentAd.advertiser || 'A')[0]}</Text>
              </View>
              <View>
                <Text style={styles.advertiserName}>{currentAd.advertiser || 'معلن'}</Text>
                <Text style={styles.advertiserHandle}>@{(currentAd.advertiser || 'ad').toLowerCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.adTitle}>{currentAd.title}</Text>
            <Text style={styles.adDesc} numberOfLines={2}>{currentAd.description}</Text>
            
            {currentAd.website_url && (
              <TouchableOpacity style={styles.visitBtn} onPress={visitWebsite}>
                <Text style={styles.visitText}>🌐 زيارة الموقع</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      )}

      {/* Points Animation */}
      {showPointsAnim && (
        <View style={styles.pointsAnimContainer}>
          <Text style={styles.pointsAnimText}>+{POINTS_PER_AD} ⭐</Text>
        </View>
      )}

      {/* Earned Points Badge */}
      {earnedPoints > 0 && !showControls && (
        <View style={styles.earnedBadge}>
          <Text style={styles.earnedText}>⭐ {earnedPoints}</Text>
        </View>
      )}

      {/* Navigation Hints */}
      <View style={styles.navHints}>
        {currentIndex > 0 && <Text style={styles.navHint}>⬆</Text>}
        <View style={{ flex: 1 }} />
        {currentIndex < ads.length - 1 && <Text style={styles.navHint}>⬇</Text>}
      </View>

      {/* Swipe Buttons (for easier navigation) */}
      <View style={styles.swipeButtons}>
        <TouchableOpacity 
          style={[styles.swipeBtn, currentIndex === 0 && styles.swipeBtnDisabled]} 
          onPress={goPrev}
          disabled={currentIndex === 0}
        >
          <Text style={styles.swipeBtnText}>▲</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.swipeBtn, currentIndex === ads.length - 1 && styles.swipeBtnDisabled]} 
          onPress={goNext}
          disabled={currentIndex === ads.length - 1}
        >
          <Text style={styles.swipeBtnText}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { ...StyleSheet.absoluteFillObject },
  placeholder: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholderTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  placeholderDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center' },

  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFF', marginTop: 16, fontSize: 16 },
  noAdsText: { color: '#FFF', fontSize: 18, marginBottom: 20 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  backBtnText: { color: '#FFF', fontSize: 16 },

  videoLoadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },

  progressBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: 3, backgroundColor: colors.accent },

  topControls: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  controlBtn: { width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  controlText: { fontSize: 20 },
  timerBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  timerText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  adInfoContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  adInfoGradient: { padding: 20, paddingTop: 80, paddingBottom: 100 },
  advertiserRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  advertiserAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  advertiserName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  advertiserHandle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  adTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  adDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 },
  visitBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 14, alignItems: 'center' },
  visitText: { color: '#FFF', fontSize: 16 },

  pointsAnimContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  pointsAnimText: { color: colors.accent, fontSize: 56, fontWeight: 'bold' },

  earnedBadge: { position: 'absolute', bottom: 24, alignSelf: 'center' },
  earnedText: { backgroundColor: colors.accent, color: '#000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, fontWeight: 'bold', fontSize: 16 },

  navHints: { position: 'absolute', right: 16, top: '35%', bottom: '35%', justifyContent: 'space-between', alignItems: 'center' },
  navHint: { color: 'rgba(255,255,255,0.3)', fontSize: 24 },

  swipeButtons: { position: 'absolute', right: 16, top: '40%', alignItems: 'center', gap: 12 },
  swipeBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  swipeBtnDisabled: { opacity: 0.3 },
  swipeBtnText: { color: '#FFF', fontSize: 16 },
  closeBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,0,0,0.5)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default memo(AdViewerScreen);
