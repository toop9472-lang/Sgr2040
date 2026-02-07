// Ad Viewer Screen - نظام مشاهدة الإعلانات المحسّن مع مكافحة الغش
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
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

const { width, height } = Dimensions.get('window');

// إعلانات تجريبية
const DEMO_ADS = [
  {
    id: 'demo1',
    title: 'إعلان سامسونج الجديد',
    description: 'اكتشف هاتف سامسونج الجديد',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    advertiser: 'Samsung',
    website_url: 'https://www.samsung.com/sa/',
    duration: 60,
  },
  {
    id: 'demo2',
    title: 'عرض خاص من أمازون',
    description: 'تخفيضات حتى 50%',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    advertiser: 'Amazon',
    website_url: 'https://www.amazon.sa/',
    duration: 45,
  },
  {
    id: 'demo3',
    title: 'مطعم الذواقة',
    description: 'وجبات شهية',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    advertiser: 'Gourmet',
    website_url: 'https://example.com/restaurant',
    duration: 30,
  },
];

const SECONDS_PER_POINT = 60; // نقطة واحدة كل 60 ثانية

const AdViewerScreen = ({ onClose, onPointsEarned, user }) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAdTime, setCurrentAdTime] = useState(0);
  const [totalValidTime, setTotalValidTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnim, setShowPointsAnim] = useState(false);
  const [pointsAnimValue, setPointsAnimValue] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [completedAdsCount, setCompletedAdsCount] = useState(0);
  const [adDuration, setAdDuration] = useState(30);
  const [isAdComplete, setIsAdComplete] = useState(false);
  
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // تحميل الإعلانات
  useEffect(() => {
    loadAds();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // بدء العداد عند تغيير الإعلان
  useEffect(() => {
    if (ads.length > 0) {
      startAdTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, ads.length]);

  // إخفاء عناصر التحكم تلقائياً
  useEffect(() => {
    if (showControls) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000);
    }
  }, [showControls]);

  const loadAds = async () => {
    try {
      const response = await api.getAds();
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          // خلط الإعلانات عشوائياً
          const shuffled = data.sort(() => Math.random() - 0.5);
          setAds(shuffled);
        } else {
          setAds(DEMO_ADS);
        }
      } else {
        setAds(DEMO_ADS);
      }
    } catch {
      setAds(DEMO_ADS);
    } finally {
      setIsLoading(false);
    }
  };

  const startAdTimer = () => {
    setCurrentAdTime(0);
    setIsAdComplete(false);
    setVideoLoading(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // تحديد مدة الإعلان من البيانات
    const currentAd = ads[currentIndex];
    const duration = currentAd?.duration || 30;
    setAdDuration(duration);
    
    timerRef.current = setInterval(() => {
      setCurrentAdTime((prev) => {
        const newTime = prev + 1;
        
        // التحقق من إكمال الإعلان
        if (newTime >= duration) {
          handleAdCompleted(newTime, duration);
          return duration;
        }
        
        return newTime;
      });
    }, 1000);
  };

  const handleAdCompleted = async (watchedTime, duration) => {
    // إيقاف العداد
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsAdComplete(true);
    
    // حفظ معرف الإعلان الحالي
    const completedAdId = ads[currentIndex]?.id;
    
    // إضافة وقت الإعلان للوقت الإجمالي
    const newTotalTime = totalValidTime + watchedTime;
    setTotalValidTime(newTotalTime);
    setCompletedAdsCount(prev => prev + 1);
    
    // حساب النقاط
    const previousPoints = Math.floor(totalValidTime / SECONDS_PER_POINT);
    const newPoints = Math.floor(newTotalTime / SECONDS_PER_POINT);
    
    if (newPoints > previousPoints) {
      const pointsEarned = newPoints - previousPoints;
      setEarnedPoints(prev => prev + pointsEarned);
      setPointsAnimValue(pointsEarned);
      setShowPointsAnim(true);
      Vibration.vibrate(100);
      setTimeout(() => setShowPointsAnim(false), 2000);
      
      if (onPointsEarned) onPointsEarned(pointsEarned);
      await recordPointsToServer(pointsEarned, completedAdId, duration);
    }
    
    // الانتقال للإعلان التالي تلقائياً
    setTimeout(() => {
      if (currentIndex < ads.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1500);
  };

  const recordPointsToServer = async (points, adId, duration) => {
    const token = await storage.getToken();
    if (!token) return;
    
    try {
      await api.recordAdView(adId, duration, token, points);
    } catch (e) {
      console.log('Failed to record points');
    }
  };

  // التنقل - حر بدون قيود (لكن الوقت لا يُحسب إذا لم يكتمل)
  const goNext = useCallback(() => {
    if (currentIndex < ads.length - 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, ads.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentIndex(prev => prev - 1);
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

  // دالة تنسيق الوقت
  const formatTime = (seconds) => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}ث`;
  };

  // حساب الأرقام للعرض
  const adProgress = Math.min((currentAdTime / adDuration) * 100, 100);
  const adRemaining = Math.max(0, adDuration - currentAdTime);
  const timeToNextPoint = SECONDS_PER_POINT - (totalValidTime % SECONDS_PER_POINT);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (ads.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>لا توجد إعلانات متاحة</Text>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentAd = ads[currentIndex];

  return (
    <View 
      style={styles.container}
      onTouchStart={(e) => {
        this.touchStartY = e.nativeEvent.pageY;
        this.touchStartX = e.nativeEvent.pageX;
      }}
      onTouchEnd={(e) => {
        const dy = e.nativeEvent.pageY - this.touchStartY;
        const dx = e.nativeEvent.pageX - this.touchStartX;
        if (Math.abs(dy) > 30 || Math.abs(dx) > 30) {
          handleSwipe(dy, dx);
        } else {
          handleTap();
        }
      }}
    >
      {/* شريط التقدم العلوي */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { 
          width: `${adProgress}%`,
          backgroundColor: isAdComplete ? '#22c55e' : '#f59e0b'
        }]} />
      </View>

      {/* الفيديو أو الصورة */}
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
        <View style={styles.imagePlaceholder}>
          <LinearGradient
            colors={['#1e3a5f', '#0a1628']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {videoLoading && (
        <View style={styles.videoLoading}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}

      {/* العداد المصغّر في الأعلى */}
      <View style={styles.counterContainer}>
        <View style={styles.counter}>
          {/* وقت الإعلان الحالي */}
          <View style={styles.counterItem}>
            <View style={[styles.statusDot, { backgroundColor: isAdComplete ? '#22c55e' : '#f59e0b' }]} />
            <Text style={[styles.counterValue, { color: isAdComplete ? '#22c55e' : '#f59e0b' }]}>
              {formatTime(currentAdTime)}
            </Text>
            <Text style={styles.counterDivider}>/ {formatTime(adDuration)}</Text>
          </View>
          
          <View style={styles.counterSeparator} />
          
          {/* الوقت المحتسب */}
          <View style={styles.counterItem}>
            <Ionicons name="eye-outline" size={12} color="#60a5fa" />
            <Text style={[styles.counterValue, { color: '#60a5fa' }]}>
              {formatTime(totalValidTime)}
            </Text>
          </View>
          
          <View style={styles.counterSeparator} />
          
          {/* للنقطة التالية */}
          <View style={styles.counterItem}>
            <Ionicons name="time-outline" size={12} color="#fbbf24" />
            <Text style={[styles.counterValue, { color: '#fbbf24' }]}>
              {formatTime(timeToNextPoint)}
            </Text>
          </View>
          
          <View style={styles.counterSeparator} />
          
          {/* النقاط */}
          <View style={styles.counterItem}>
            <Ionicons name="star" size={12} color="#22c55e" />
            <Text style={[styles.counterValue, { color: '#22c55e' }]}>
              {earnedPoints}
            </Text>
          </View>
        </View>
      </View>

      {/* زر الإغلاق */}
      {showControls && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* زر كتم الصوت */}
      {showControls && (
        <TouchableOpacity style={styles.muteButton} onPress={() => setIsMuted(!isMuted)}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* أزرار التنقل */}
      {showControls && currentIndex > 0 && (
        <TouchableOpacity style={styles.prevButton} onPress={goPrev}>
          <Ionicons name="chevron-up" size={28} color="#fff" />
          <Text style={styles.navText}>السابق</Text>
        </TouchableOpacity>
      )}

      {showControls && currentIndex < ads.length - 1 && (
        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Text style={styles.navText}>التالي</Text>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* شريط التقدم الجانبي */}
      <View style={styles.sideProgressContainer}>
        <View style={styles.sideProgressBg}>
          <View style={[styles.sideProgressFill, { 
            height: `${((currentIndex + 1) / ads.length) * 100}%` 
          }]} />
        </View>
      </View>

      {/* تحذير يجب إكمال المشاهدة */}
      {!isAdComplete && currentAdTime > 3 && (
        <View style={styles.warningContainer}>
          <View style={styles.warningBubble}>
            <Text style={styles.warningText}>
              ⏱️ أكمل مشاهدة الإعلان ({formatTime(adRemaining)} متبقي) لاحتساب الوقت
            </Text>
          </View>
        </View>
      )}

      {/* بيانات المعلن */}
      {showControls && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.bottomGradient}
        >
          <View style={styles.adInfo}>
            <View style={styles.advertiserRow}>
              <View style={styles.advertiserAvatar}>
                <Text style={styles.avatarText}>
                  {(currentAd.advertiser || currentAd.title)?.[0]?.toUpperCase() || 'A'}
                </Text>
              </View>
              <View>
                <Text style={styles.advertiserName}>{currentAd.advertiser || 'معلن'}</Text>
                <Text style={styles.adCount}>إعلان {currentIndex + 1} من {ads.length}</Text>
              </View>
            </View>
            <Text style={styles.adTitle}>{currentAd.title}</Text>
            <Text style={styles.adDescription} numberOfLines={2}>{currentAd.description}</Text>
            
            {currentAd.website_url && (
              <TouchableOpacity style={styles.visitButton} onPress={visitWebsite}>
                <Ionicons name="open-outline" size={18} color="#fff" />
                <Text style={styles.visitButtonText}>زيارة الموقع</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      )}

      {/* أنيميشن النقاط */}
      {showPointsAnim && (
        <View style={styles.pointsAnimContainer}>
          <View style={styles.pointsAnimBubble}>
            <Ionicons name="star" size={32} color="#fff" />
            <Text style={styles.pointsAnimText}>+{pointsAnimValue}</Text>
          </View>
          <Text style={styles.pointsAnimSubtext}>نقطة جديدة!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  progressBar: {
    height: '100%',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
  },
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  // العداد المصغّر
  counterContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  counterValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  counterDivider: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  counterSeparator: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10,
  },
  // الأزرار
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  muteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  prevButton: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    marginLeft: -30,
    alignItems: 'center',
    zIndex: 20,
  },
  nextButton: {
    position: 'absolute',
    bottom: '30%',
    left: '50%',
    marginLeft: -30,
    alignItems: 'center',
    zIndex: 20,
  },
  navText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  // شريط التقدم الجانبي
  sideProgressContainer: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -48,
    zIndex: 10,
  },
  sideProgressBg: {
    width: 2,
    height: 96,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  sideProgressFill: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  // التحذير
  warningContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  warningBubble: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 11,
    textAlign: 'center',
  },
  // بيانات المعلن
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
    zIndex: 15,
  },
  adInfo: {
    gap: 8,
  },
  advertiserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  advertiserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  advertiserName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  adCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  adTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  visitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // أنيميشن النقاط
  pointsAnimContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
  },
  pointsAnimBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  pointsAnimText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  pointsAnimSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
});

export default memo(AdViewerScreen);
