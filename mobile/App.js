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
  Modal,
  Platform,
  Vibration,
  PanResponder,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';

// ============ CONFIGURATION ============
const API_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL || ''}/api`;
const { width, height } = Dimensions.get('window');

const REQUIRED_WATCH_TIME = 30;
const POINTS_PER_AD = 5;

// ============ THEME ============
const theme = {
  dark: {
    primary: '#000000',
    secondary: '#1a1a1a',
    accent: '#FFD700',
    success: '#10B981',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.6)',
  }
};

// ============ FULL SCREEN AD VIEWER - Clean Version ============
const FullScreenAdViewer = ({ ads, onClose, onPointsEarned, user }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
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
    if (showControls) {
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
        }).start(() => setShowControls(false));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showControls]);

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

  // التنقل: أعلى/أسفل للإعلانات، يمين/يسار للخروج
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 50;
      },
      onPanResponderRelease: (_, gestureState) => {
        // سحب أفقي للخروج
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          if (Math.abs(gestureState.dx) > 80) {
            onClose(); // خروج يمين أو يسار
          }
        } else {
          // سحب عمودي للتنقل بين الإعلانات
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
  };

  if (!ads || ads.length === 0) {
    return (
      <View style={styles.fullScreenContainer}>
        <Text style={styles.noAdsText}>لا توجد إعلانات متاحة</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentAd = ads[currentIndex];
  const progress = (watchTime / REQUIRED_WATCH_TIME) * 100;

  return (
    <View style={styles.fullScreenContainer} {...panResponder.panHandlers}>
      <StatusBar hidden />
      
      {/* محتوى الإعلان - شاشة كاملة */}
      <Animated.View 
        style={[styles.adContent, { transform: [{ translateY }] }]}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleTap}
          style={styles.adTouchable}
        >
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
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.adPlaceholder}
            >
              <Text style={styles.adTitle}>{currentAd.title}</Text>
              <Text style={styles.adDescription}>{currentAd.description}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* شريط التقدم - رفيع في الأعلى */}
      <View style={styles.progressContainerThin}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* عداد الوقت - يظهر عند اللمس فقط */}
      <Animated.View style={[styles.timerContainerClean, { opacity: controlsOpacity }]}>
        <View style={styles.timerBadgeClean}>
          {watchTime >= REQUIRED_WATCH_TIME ? (
            <Text style={styles.timerComplete}>✓ +{POINTS_PER_AD}</Text>
          ) : (
            <Text style={styles.timerTextClean}>{REQUIRED_WATCH_TIME - watchTime}s</Text>
          )}
        </View>
      </Animated.View>

      {/* نقاط مكتسبة في الجلسة */}
      {earnedPoints > 0 && (
        <View style={styles.totalPointsContainerClean}>
          <Text style={styles.totalPointsTextClean}>⭐ {earnedPoints}</Text>
        </View>
      )}

      {/* تأثير النقاط */}
      {showPointsAnimation && (
        <View style={styles.pointsAnimationContainer}>
          <Animated.Text style={[styles.pointsAnimationTextBig, { transform: [{ scale: pointsScale }] }]}>
            +{POINTS_PER_AD} 🎉
          </Animated.Text>
        </View>
      )}

      {/* مؤشرات التنقل - تظهر عند اللمس */}
      <Animated.View style={[styles.swipeHintTopClean, { opacity: controlsOpacity }]}>
        {currentIndex > 0 && <Text style={styles.swipeArrow}>⬆</Text>}
      </Animated.View>
      
      <Animated.View style={[styles.swipeHintBottomClean, { opacity: controlsOpacity }]}>
        {currentIndex < ads.length - 1 && <Text style={styles.swipeArrow}>⬇</Text>}
      </Animated.View>

      {/* تلميح الخروج */}
      <Animated.View style={[styles.exitHint, { opacity: controlsOpacity }]}>
        <Text style={styles.exitHintText}>← →</Text>
      </Animated.View>
    </View>
  );
};

// ============ MAIN APP ============
export default function App() {
  const [screen, setScreen] = useState('loading');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ads, setAds] = useState([]);
  const [showAdsViewer, setShowAdsViewer] = useState(false);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('saqr_token');
      const savedUser = await AsyncStorage.getItem('saqr_user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        await loadAds();
        setScreen('main');
      } else {
        setScreen('login');
      }
    } catch (e) {
      setScreen('login');
    }
  };

  const loadAds = async () => {
    try {
      const response = await fetch(`${API_URL}/ads`);
      const data = await response.json();
      if (data) {
        setAds(data.sort(() => Math.random() - 0.5));
      }
    } catch (e) {
      console.log('Failed to load ads');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد وكلمة المرور');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        await AsyncStorage.setItem('saqr_token', data.token);
        await AsyncStorage.setItem('saqr_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        await loadAds();
        setScreen('main');
      } else {
        Alert.alert('خطأ', data.detail || 'فشل تسجيل الدخول');
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() })
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        await AsyncStorage.setItem('saqr_token', data.token);
        await AsyncStorage.setItem('saqr_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        await loadAds();
        setScreen('main');
      } else {
        Alert.alert('خطأ', data.detail || 'فشل إنشاء الحساب');
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
    setLoading(false);
  };

  const guestLogin = async () => {
    const guestUser = { 
      id: 'guest_' + Date.now(), 
      name: 'زائر', 
      points: 0, 
      isGuest: true 
    };
    await AsyncStorage.setItem('saqr_user', JSON.stringify(guestUser));
    setUser(guestUser);
    await loadAds();
    setScreen('main');
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['saqr_token', 'saqr_user']);
    setToken(null);
    setUser(null);
    setScreen('login');
  };

  const handlePointsEarned = async (points) => {
    const newPoints = (user.points || 0) + points;
    const updatedUser = { ...user, points: newPoints };
    setUser(updatedUser);
    await AsyncStorage.setItem('saqr_user', JSON.stringify(updatedUser));
  };

  // Loading Screen
  if (screen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>صقر</Text>
        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
        <StatusBar style="light" />
      </View>
    );
  }

  // Login Screen
  if (screen === 'login') {
    return (
      <View style={styles.loginContainer}>
        <StatusBar style="light" />
        
        <Text style={styles.loginLogo}>صقر</Text>
        <Text style={styles.loginSubtitle}>شاهد واكسب</Text>
        
        <View style={styles.formContainer}>
          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="الاسم"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegister ? 'إنشاء حساب' : 'دخول'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.switchText}>
              {isRegister ? 'لديك حساب؟ سجل دخول' : 'جديد؟ أنشئ حساب'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.guestButton} onPress={guestLogin}>
          <Text style={styles.guestButtonText}>دخول كزائر</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main Screen
  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* Full Screen Ads Viewer */}
      {showAdsViewer && (
        <FullScreenAdViewer
          ads={ads}
          onClose={() => setShowAdsViewer(false)}
          onPointsEarned={handlePointsEarned}
          user={user}
        />
      )}
      
      {!showAdsViewer && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>صقر</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{user?.points || 0} ⭐</Text>
            </View>
          </View>
          
          {/* Main Content */}
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeText}>مرحباً {user?.name || 'زائر'} 👋</Text>
              <Text style={styles.welcomeSubtext}>شاهد الإعلانات واكسب النقاط</Text>
            </View>
            
            {/* Start Watching Button */}
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setShowAdsViewer(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF0050', '#FF4081']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonIcon}>▶️</Text>
                <Text style={styles.startButtonText}>ابدأ المشاهدة</Text>
                <Text style={styles.startButtonSubtext}>{ads.length} إعلان متاح</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{user?.points || 0}</Text>
                <Text style={styles.statLabel}>نقاطك</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${((user?.points || 0) / 500).toFixed(2)}</Text>
                <Text style={styles.statLabel}>رصيدك</Text>
              </View>
            </View>
            
            {/* Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>كيف تكسب؟</Text>
              <Text style={styles.infoText}>• شاهد إعلان 30 ثانية = {POINTS_PER_AD} نقاط</Text>
              <Text style={styles.infoText}>• اسحب للأعلى/الأسفل للتنقل</Text>
              <Text style={styles.infoText}>• اسحب لليسار للخروج</Text>
              <Text style={styles.infoText}>• 500 نقطة = 1 دولار</Text>
            </View>
          </ScrollView>
          
          {/* Bottom Nav - فقط: الرئيسية، حسابي، إعلانات */}
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => {}}>
              <Text style={styles.navIcon}>🏠</Text>
              <Text style={styles.navLabel}>الرئيسية</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => {}}>
              <Text style={styles.navIcon}>👤</Text>
              <Text style={styles.navLabel}>حسابي</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navItem, styles.navItemHighlight]}
              onPress={() => setShowAdsViewer(true)}
            >
              <Text style={styles.navIcon}>▶️</Text>
              <Text style={[styles.navLabel, styles.navLabelHighlight]}>إعلانات</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  // Full Screen Viewer
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  adContent: {
    flex: 1,
  },
  adTouchable: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  adPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  adDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  rightControls: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
  },
  controlItem: {
    alignItems: 'center',
    marginBottom: 24,
  },
  controlIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIconActive: {
    backgroundColor: '#FFD700',
  },
  iconEmoji: {
    fontSize: 24,
  },
  controlText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  timerContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
  },
  timerBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timerComplete: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  closeContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalPointsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  totalPointsText: {
    backgroundColor: '#FFD700',
    color: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontWeight: 'bold',
    fontSize: 14,
  },
  pointsAnimationContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pointsAnimationText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  swipeHintTop: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintBottom: {
    position: 'absolute',
    bottom: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintLeft: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -50 }],
  },
  swipeHintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  swipeHintTextVertical: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    transform: [{ rotate: '-90deg' }],
  },
  adCounter: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  adCounterText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  noAdsText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  closeButton: {
    marginTop: 30,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFD700',
  },

  // Login
  loginContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginLogo: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#FFF',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#FFD700',
    textAlign: 'center',
    fontSize: 14,
  },
  guestButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  guestButtonText: {
    color: '#FFF',
    fontSize: 16,
  },

  // Main
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFF',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  startButton: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  startButtonIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  startButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    textAlign: 'right',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navItemHighlight: {
    backgroundColor: '#FF0050',
    borderRadius: 20,
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  navLabelHighlight: {
    color: '#FFF',
    fontWeight: '600',
  },
  
  // Clean Ads Viewer Styles
  progressContainerThin: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  timerContainerClean: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  timerBadgeClean: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerTextClean: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  totalPointsContainerClean: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  totalPointsTextClean: {
    backgroundColor: 'rgba(255,215,0,0.9)',
    color: '#000',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    fontWeight: 'bold',
    fontSize: 14,
  },
  pointsAnimationTextBig: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  swipeHintTopClean: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintBottomClean: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeArrow: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 20,
  },
  exitHint: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  exitHintText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});
