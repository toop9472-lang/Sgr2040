import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  Vibration,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';

// ============ CONFIGURATION ============
const API_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL || 'https://saqr-ads-1.preview.emergentagent.com'}/api`;
const { width, height } = Dimensions.get('window');

const REQUIRED_WATCH_TIME = 30;
const POINTS_PER_AD = 5;

// ============ FULL SCREEN AD VIEWER ============
const FullScreenAdViewer = ({ ads, onClose, onPointsEarned, user, isDark }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showAdInfo, setShowAdInfo] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  
  const translateY = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const pointsScale = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);
  const watchTimerRef = useRef(null);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, [currentIndex]);

  useEffect(() => {
    if (showControls || showAdInfo) {
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
      
      const timer = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }).start(() => {
          setShowControls(false);
          setShowAdInfo(false);
        });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showControls, showAdInfo]);

  const startWatching = () => {
    setWatchTime(0);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    watchTimerRef.current = setInterval(() => {
      setWatchTime(prev => {
        if (prev >= REQUIRED_WATCH_TIME) {
          clearInterval(watchTimerRef.current);
          completeAdWatch();
          return REQUIRED_WATCH_TIME;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const completeAdWatch = async () => {
    const points = POINTS_PER_AD;
    setEarnedPoints(prev => prev + points);
    
    setShowPointsAnimation(true);
    Animated.sequence([
      Animated.spring(pointsScale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(pointsScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    
    Vibration.vibrate([100, 100, 100]);
    setTimeout(() => setShowPointsAnimation(false), 2000);
    
    if (onPointsEarned) onPointsEarned(points);
    
    // Save points to backend
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        await fetch(`${API_URL}/rewarded-ads/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ad_type: 'video',
            ad_id: ads[currentIndex]?.id,
            completed: true,
            watch_duration: REQUIRED_WATCH_TIME
          })
        });
      }
    } catch (e) {
      console.log('Failed to save points');
    }
  };

  const goToNext = () => {
    if (currentIndex < ads.length - 1) {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      Animated.timing(translateY, {
        toValue: -height,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setCurrentIndex(prev => prev + 1);
        translateY.setValue(0);
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setCurrentIndex(prev => prev - 1);
        translateY.setValue(0);
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 50;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          if (Math.abs(gestureState.dx) > 80) {
            onClose();
          }
        } else {
          if (gestureState.dy < -50) {
            goToNext();
          } else if (gestureState.dy > 50) {
            goToPrevious();
          }
        }
      }
    })
  ).current;

  const handleTap = () => {
    setShowControls(true);
    setShowAdInfo(true);
  };

  if (!ads || ads.length === 0) {
    return (
      <View style={styles.fullScreenContainer}>
        <Text style={styles.noAdsText}>لا توجد إعلانات متاحة</Text>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentAd = ads[currentIndex];
  const progress = (watchTime / REQUIRED_WATCH_TIME) * 100;

  return (
    <View style={styles.fullScreenContainer} {...panResponder.panHandlers}>
      <StatusBar hidden />
      
      <Animated.View style={[styles.adContent, { transform: [{ translateY }] }]}>
        <TouchableOpacity activeOpacity={1} onPress={handleTap} style={styles.adTouchable}>
          {currentAd.video_url ? (
            <Video
              ref={videoRef}
              source={{ uri: currentAd.video_url }}
              style={styles.video}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted={false}
            />
          ) : (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.adPlaceholder}>
              <Text style={styles.adTitle}>{currentAd.title}</Text>
              <Text style={styles.adDescription}>{currentAd.description}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Timer */}
      <Animated.View style={[styles.timerContainer, { opacity: controlsOpacity }]}>
        <View style={styles.timerBadge}>
          {watchTime >= REQUIRED_WATCH_TIME ? (
            <Text style={styles.timerComplete}>✓ +{POINTS_PER_AD}</Text>
          ) : (
            <Text style={styles.timerText}>{REQUIRED_WATCH_TIME - watchTime}s</Text>
          )}
        </View>
      </Animated.View>

      {/* Ad Info */}
      <Animated.View style={[styles.adInfoContainer, { opacity: controlsOpacity }]}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.adInfoGradient}>
          <View style={styles.advertiserRow}>
            <View style={styles.advertiserAvatar}>
              <Text style={styles.avatarText}>{(currentAd.advertiser || 'A')[0]}</Text>
            </View>
            <View>
              <Text style={styles.advertiserName}>{currentAd.advertiser || 'معلن'}</Text>
              <Text style={styles.advertiserHandle}>@{(currentAd.advertiser || 'advertiser').toLowerCase().replace(/\s/g, '_')}</Text>
            </View>
          </View>
          <Text style={styles.adInfoTitle}>{currentAd.title}</Text>
          <Text style={styles.adInfoDesc}>{currentAd.description}</Text>
          {currentAd.website_url && (
            <TouchableOpacity style={styles.visitButton}>
              <Text style={styles.visitButtonText}>زيارة الموقع</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Points Animation */}
      {showPointsAnimation && (
        <View style={styles.pointsAnimation}>
          <Animated.Text style={[styles.pointsAnimationText, { transform: [{ scale: pointsScale }] }]}>
            +{POINTS_PER_AD} 🎉
          </Animated.Text>
        </View>
      )}

      {/* Earned Points */}
      {earnedPoints > 0 && !showAdInfo && (
        <View style={styles.earnedPointsContainer}>
          <Text style={styles.earnedPointsText}>⭐ {earnedPoints}</Text>
        </View>
      )}
    </View>
  );
};

// ============ HOME PAGE ============
const HomePage = ({ user, onNavigateToAds, isDark, onToggleTheme }) => {
  const [settings, setSettings] = useState(null);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    loadSettings();
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/public/rewards`);
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.log('Failed to load settings');
    }
  };

  const userPoints = user?.points || 0;
  const pointsPerDollar = settings?.points_per_dollar || 500;
  const userBalance = (userPoints / pointsPerDollar).toFixed(2);
  const pointsPerAd = settings?.points_per_ad || 5;
  const dailyLimit = settings?.daily_limit || 50;
  const watchedToday = user?.watched_today || 0;

  const tips = settings?.tips || [
    { icon: '💡', text: 'شاهد الإعلانات واكسب النقاط!' },
  ];

  const challenges = settings?.daily_challenges || [
    { title: 'المشاهد النشط', target: 5, reward: 25, icon: '👁️', desc: 'شاهد 5 إعلانات' },
  ];
  const dailyChallenge = challenges[new Date().getDate() % challenges.length];

  const bgColors = isDark ? ['#1a1a2e', '#16213e', '#0f0f23'] : ['#f8fafc', '#e2e8f0', '#f1f5f9'];
  const textColor = isDark ? '#FFF' : '#1e293b';
  const mutedColor = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFF';

  return (
    <LinearGradient colors={bgColors} style={styles.homeContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeScroll}>
        {/* Header */}
        <View style={styles.homeHeader}>
          <View>
            <Text style={[styles.welcomeText, { color: textColor }]}>مرحباً {user?.name || 'صديقي'} 👋</Text>
            <Text style={[styles.subText, { color: mutedColor }]}>جاهز لكسب المزيد اليوم؟</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.themeButton} onPress={onToggleTheme}>
              <Text style={styles.themeButtonText}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <View style={[styles.pointsBadge, { backgroundColor: isDark ? 'rgba(251,191,36,0.2)' : '#fef3c7' }]}>
              <Text style={styles.pointsBadgeText}>{userPoints} ⭐</Text>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <View>
              <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
              <Text style={styles.balanceAmount}>${userBalance}</Text>
              <Text style={styles.balancePoints}>{userPoints} نقطة</Text>
            </View>
            <View style={styles.balanceIcon}>
              <Text style={styles.balanceIconText}>📈</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Start Watching Button */}
        <TouchableOpacity onPress={onNavigateToAds} activeOpacity={0.9}>
          <LinearGradient colors={['#ef4444', '#ec4899']} style={styles.watchButton}>
            <View style={styles.watchButtonContent}>
              <View style={styles.playIcon}>
                <Text style={styles.playIconText}>▶️</Text>
              </View>
              <View>
                <Text style={styles.watchButtonTitle}>ابدأ المشاهدة الآن</Text>
                <Text style={styles.watchButtonSub}>اكسب {pointsPerAd} نقاط لكل إعلان</Text>
              </View>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.statsTitle, { color: textColor }]}>📊 إحصائياتك</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9' }]}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{watchedToday}</Text>
              <Text style={[styles.statLabel, { color: mutedColor }]}>اليوم</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9' }]}>
              <Text style={styles.statIcon}>⏳</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{dailyLimit - watchedToday}</Text>
              <Text style={[styles.statLabel, { color: mutedColor }]}>المتبقي</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9' }]}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={[styles.statValue, { color: textColor }]}>{pointsPerAd}</Text>
              <Text style={[styles.statLabel, { color: mutedColor }]}>نقاط/إعلان</Text>
            </View>
          </View>
        </View>

        {/* Daily Challenge */}
        {dailyChallenge && (
          <View style={[styles.challengeCard, { backgroundColor: isDark ? 'rgba(251,191,36,0.1)' : '#fffbeb' }]}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeIcon}>{dailyChallenge.icon}</Text>
              <View>
                <Text style={styles.challengeTitle}>التحدي اليومي</Text>
                <Text style={[styles.challengeName, { color: mutedColor }]}>{dailyChallenge.title}</Text>
              </View>
            </View>
            <Text style={[styles.challengeDesc, { color: mutedColor }]}>{dailyChallenge.desc}</Text>
            <View style={styles.challengeProgress}>
              <View style={styles.challengeProgressBar}>
                <View style={[styles.challengeProgressFill, { width: `${Math.min((watchedToday / dailyChallenge.target) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.challengeReward}>+{dailyChallenge.reward} ⭐</Text>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={[styles.tipCard, { backgroundColor: cardBg }]}>
          <Text style={styles.tipIcon}>{tips[currentTip % tips.length]?.icon || '💡'}</Text>
          <Text style={[styles.tipText, { color: mutedColor }]}>{tips[currentTip % tips.length]?.text || ''}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

// ============ LOGIN PAGE ============
const LoginPage = ({ onLogin, onGuestMode, isDark }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await AsyncStorage.setItem('user_token', data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        Alert.alert('خطأ', data.detail || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={isDark ? ['#1a1a2e', '#16213e'] : ['#f8fafc', '#e2e8f0']} style={styles.loginContainer}>
      <View style={styles.loginContent}>
        <Text style={styles.logo}>🦅</Text>
        <Text style={[styles.appName, { color: isDark ? '#FFF' : '#1e293b' }]}>صقر</Text>
        <Text style={[styles.tagline, { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }]}>شاهد واكسب</Text>
        
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFF', color: isDark ? '#FFF' : '#000' }]}
          placeholder="البريد الإلكتروني"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFF', color: isDark ? '#FFF' : '#000' }]}
          placeholder="كلمة المرور"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.loginButtonGradient}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.guestButton} onPress={onGuestMode}>
          <Text style={[styles.guestButtonText, { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }]}>الدخول كزائر</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// ============ MAIN APP ============
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [showAdsViewer, setShowAdsViewer] = useState(false);
  const [ads, setAds] = useState([]);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    checkAuth();
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const theme = await AsyncStorage.getItem('theme');
      if (theme) setIsDark(theme === 'dark');
    } catch (e) {}
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
      
      await loadAds();
    } catch (error) {
      console.log('Auth check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAds = async () => {
    try {
      const response = await fetch(`${API_URL}/ads`);
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.log('Failed to load ads');
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleGuestMode = () => {
    setUser({ name: 'زائر', points: 0, is_guest: true });
    setIsAuthenticated(true);
  };

  const handlePointsEarned = (points) => {
    if (user && !user.is_guest) {
      setUser(prev => ({ ...prev, points: (prev.points || 0) + points }));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a2e' : '#f8fafc' }]}>
        <Text style={styles.loadingLogo}>🦅</Text>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (showAdsViewer) {
    return (
      <FullScreenAdViewer
        ads={ads}
        onClose={() => setShowAdsViewer(false)}
        onPointsEarned={handlePointsEarned}
        user={user}
        isDark={isDark}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onGuestMode={handleGuestMode} isDark={isDark} />;
  }

  return (
    <View style={styles.container}>
      <HomePage
        user={user}
        onNavigateToAds={() => setShowAdsViewer(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
      
      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: isDark ? '#1a1a2e' : '#FFF' }]}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }]}>الرئيسية</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }]}>حسابي</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemHighlight]} onPress={() => setShowAdsViewer(true)}>
          <Text style={styles.navIcon}>▶️</Text>
          <Text style={styles.navLabelHighlight}>إعلانات</Text>
        </TouchableOpacity>
      </View>
      
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { fontSize: 60, marginBottom: 20 },
  
  // Login
  loginContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  loginContent: { alignItems: 'center' },
  logo: { fontSize: 80, marginBottom: 8 },
  appName: { fontSize: 36, fontWeight: 'bold', marginBottom: 4 },
  tagline: { fontSize: 16, marginBottom: 40 },
  input: { width: '100%', height: 50, borderRadius: 12, paddingHorizontal: 16, marginBottom: 12, fontSize: 16 },
  loginButton: { width: '100%', marginTop: 8 },
  loginButtonGradient: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  guestButton: { marginTop: 20, padding: 12 },
  guestButtonText: { fontSize: 14 },
  
  // Home
  homeContainer: { flex: 1 },
  homeScroll: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcomeText: { fontSize: 24, fontWeight: 'bold' },
  subText: { fontSize: 14, marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  themeButtonText: { fontSize: 20 },
  pointsBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  pointsBadgeText: { color: '#f59e0b', fontWeight: 'bold' },
  
  balanceCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
  balanceContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balanceAmount: { color: '#FFF', fontSize: 40, fontWeight: 'bold', marginTop: 4 },
  balancePoints: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  balanceIcon: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  balanceIconText: { fontSize: 28 },
  
  watchButton: { borderRadius: 20, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  watchButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  playIcon: { width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  playIconText: { fontSize: 24 },
  watchButtonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  watchButtonSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  arrowIcon: { color: '#FFF', fontSize: 24 },
  
  statsCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 10, marginTop: 2 },
  
  challengeCard: { borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  challengeIcon: { fontSize: 28 },
  challengeTitle: { color: '#f59e0b', fontWeight: 'bold' },
  challengeName: { fontSize: 12 },
  challengeDesc: { fontSize: 14, marginBottom: 12 },
  challengeProgress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  challengeProgressBar: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4 },
  challengeProgressFill: { height: 8, backgroundColor: '#f59e0b', borderRadius: 4 },
  challengeReward: { color: '#f59e0b', fontWeight: 'bold' },
  
  tipCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipIcon: { fontSize: 24 },
  tipText: { flex: 1, fontSize: 14 },
  
  // Full Screen Ads
  fullScreenContainer: { flex: 1, backgroundColor: '#000' },
  adContent: { flex: 1 },
  adTouchable: { flex: 1 },
  video: { flex: 1 },
  adPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  adTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  adDescription: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center' },
  noAdsText: { color: '#FFF', fontSize: 18, textAlign: 'center' },
  backButton: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, marginTop: 20 },
  backButtonText: { color: '#FFF', fontSize: 16, textAlign: 'center' },
  
  progressBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressFill: { height: 2, backgroundColor: '#FFD700' },
  
  timerContainer: { position: 'absolute', top: 50, right: 16 },
  timerBadge: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  timerText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  timerComplete: { color: '#FFD700', fontSize: 12, fontWeight: '600' },
  
  adInfoContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  adInfoGradient: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  advertiserRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  advertiserAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  advertiserName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  advertiserHandle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  adInfoTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  adInfoDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 },
  visitButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 14, alignItems: 'center' },
  visitButtonText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  
  pointsAnimation: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  pointsAnimationText: { color: '#FFD700', fontSize: 48, fontWeight: 'bold' },
  
  earnedPointsContainer: { position: 'absolute', bottom: 20, alignSelf: 'center' },
  earnedPointsText: { backgroundColor: 'rgba(255,215,0,0.9)', color: '#000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, fontWeight: 'bold' },
  
  // Bottom Nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navItemHighlight: { backgroundColor: '#ef4444', marginHorizontal: 8, borderRadius: 16, paddingVertical: 8 },
  navIcon: { fontSize: 24 },
  navLabel: { fontSize: 10 },
  navLabelHighlight: { color: '#FFF', fontSize: 10, fontWeight: '600' },
});
