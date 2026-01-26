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
  Easing,
  Switch,
  AppState
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// ============ CONFIGURATION ============
const API_URL = 'https://rewardviewer-2.preview.emergentagent.com/api';
const { width, height } = Dimensions.get('window');

// Security constants
const MIN_WATCH_TIME = 25;
const REQUIRED_WATCH_TIME = 30;
const POINTS_PER_AD = 5;
const AD_COOLDOWN = 30; // seconds

// ============ THEME CONFIGURATION ============
const themes = {
  dark: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    tertiary: '#0f3460',
    accent: '#FFD700',
    accentSecondary: '#FFA500',
    success: '#10B981',
    error: '#EF4444',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    card: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    statusBar: 'light'
  },
  light: {
    primary: '#F8FAFC',
    secondary: '#E2E8F0',
    tertiary: '#CBD5E1',
    accent: '#6366F1',
    accentSecondary: '#8B5CF6',
    success: '#10B981',
    error: '#EF4444',
    text: '#1E293B',
    textSecondary: 'rgba(30, 41, 59, 0.7)',
    textMuted: 'rgba(30, 41, 59, 0.5)',
    card: 'rgba(0, 0, 0, 0.03)',
    cardBorder: 'rgba(0, 0, 0, 0.1)',
    statusBar: 'dark'
  }
};

// ============ SECURITY UTILITIES ============
const generateDeviceFingerprint = async () => {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${Platform.OS}_${Platform.Version}_${timestamp}_${random}`;
  } catch (e) {
    return `unknown_${Date.now()}`;
  }
};

const validateWatchSession = (startTime, endTime, expectedDuration) => {
  const actualDuration = (endTime - startTime) / 1000;
  // Allow small tolerance for timing variations
  return actualDuration >= expectedDuration * 0.8;
};

// ============ ANIMATED COMPONENTS ============

// Floating Particles
const FloatingParticles = ({ theme }) => {
  const particles = Array(6).fill(0).map((_, i) => {
    const anim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const delay = i * 400;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [height + 50, -50]
    });

    const opacity = anim.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 0.5, 0.5, 0]
    });

    return (
      <Animated.View
        key={i}
        style={[
          styles.particle,
          {
            left: Math.random() * width,
            transform: [{ translateY }],
            opacity,
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            backgroundColor: theme.accent + '60',
          }
        ]}
      />
    );
  });

  return <View style={styles.particlesContainer}>{particles}</View>;
};

// Circular Progress
const CircularProgress = ({ progress, size = 120, strokeWidth = 8, theme }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);
  
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: theme.cardBorder,
        position: 'absolute'
      }} />
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: theme.success,
        borderTopColor: 'transparent',
        borderRightColor: progress > 0.25 ? theme.success : 'transparent',
        borderBottomColor: progress > 0.5 ? theme.success : 'transparent',
        borderLeftColor: progress > 0.75 ? theme.success : 'transparent',
        position: 'absolute',
        transform: [{ rotate: '-90deg' }]
      }} />
    </View>
  );
};

// Stats Card with Animation
const StatsCard = ({ value, label, icon, color, theme, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true })
    ]).start();

    // Animate counter
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const duration = 1000;
    const steps = 30;
    const increment = numericValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(typeof value === 'number' ? numericValue : value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Animated.View style={[
      styles.statsCard,
      { 
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
        transform: [{ scale: scaleAnim }] 
      }
    ]}>
      <Text style={styles.statsIcon}>{icon}</Text>
      <Text style={[styles.statsValue, { color }]}>
        {typeof value === 'number' ? displayValue : value}
      </Text>
      <Text style={[styles.statsLabel, { color: theme.textMuted }]}>{label}</Text>
    </Animated.View>
  );
};

// Achievement Badge
const AchievementBadge = ({ title, description, icon, unlocked, progress, theme }) => (
  <View style={[
    styles.achievementBadge, 
    { backgroundColor: theme.card, borderColor: theme.cardBorder },
    !unlocked && { opacity: 0.6 }
  ]}>
    <View style={[
      styles.achievementIcon, 
      { backgroundColor: unlocked ? theme.accent + '30' : theme.card }
    ]}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    </View>
    <View style={styles.achievementInfo}>
      <Text style={[styles.achievementTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.achievementDesc, { color: theme.textMuted }]}>{description}</Text>
      {!unlocked && progress !== undefined && (
        <View style={[styles.achievementProgress, { backgroundColor: theme.cardBorder }]}>
          <View style={[styles.achievementProgressFill, { width: `${progress}%`, backgroundColor: theme.accent }]} />
        </View>
      )}
    </View>
    {unlocked && <Text style={[styles.achievementCheck, { color: theme.success }]}>✓</Text>}
  </View>
);

// ============ AD VIEWER COMPONENT ============
const AdViewer = ({ 
  isWatching, 
  watchTime, 
  onStart, 
  onSkip, 
  completed, 
  theme,
  cooldownRemaining,
  dailyRemaining 
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isWatching) {
      Animated.timing(progressAnim, {
        toValue: watchTime / REQUIRED_WATCH_TIME,
        duration: 900,
        useNativeDriver: false
      }).start();
    }
  }, [watchTime]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const remainingTime = REQUIRED_WATCH_TIME - watchTime;
  const canWatch = dailyRemaining > 0 && cooldownRemaining <= 0;

  return (
    <View style={[styles.adContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      {isWatching ? (
        // Watching State
        <>
          <View style={[styles.adVideoContainer, { backgroundColor: theme.primary }]}>
            {/* Video placeholder - will show real ads when AdMob is verified */}
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              style={styles.adVideoGradient}
            >
              <Text style={styles.adPlayingIcon}>📺</Text>
              <Text style={[styles.adPlayingText, { color: theme.textSecondary }]}>
                جاري عرض الإعلان...
              </Text>
              
              {/* Circular Timer */}
              <View style={styles.timerWrapper}>
                <CircularProgress 
                  progress={watchTime / REQUIRED_WATCH_TIME} 
                  size={100} 
                  theme={theme}
                />
                <View style={styles.timerContent}>
                  <Text style={[styles.timerNumber, { color: theme.success }]}>
                    {remainingTime}
                  </Text>
                  <Text style={[styles.timerLabel, { color: theme.textMuted }]}>ثانية</Text>
                </View>
              </View>
              
              {/* Ad Duration Info */}
              <View style={[styles.durationBadge, { backgroundColor: theme.success + '20' }]}>
                <Text style={[styles.durationText, { color: theme.success }]}>
                  ⏱️ مدة الإعلان: {REQUIRED_WATCH_TIME} ثانية
                </Text>
              </View>
            </LinearGradient>
          </View>
          
          {/* Progress Bar */}
          <View style={[styles.progressOuter, { backgroundColor: theme.cardBorder }]}>
            <Animated.View style={[styles.progressInner, { width: progressWidth }]}>
              <LinearGradient
                colors={[theme.success, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>
          
          <Text style={[styles.watchingHint, { color: theme.textSecondary }]}>
            🎁 استمر بالمشاهدة للحصول على {POINTS_PER_AD} نقاط
          </Text>
          
          {/* Progress Details */}
          <View style={styles.progressDetails}>
            <Text style={[styles.progressText, { color: theme.textMuted }]}>
              {watchTime}/{REQUIRED_WATCH_TIME} ثانية
            </Text>
            <Text style={[styles.progressPercent, { color: theme.accent }]}>
              {Math.floor((watchTime / REQUIRED_WATCH_TIME) * 100)}%
            </Text>
          </View>
          
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={[styles.skipButtonText, { color: theme.textMuted }]}>تخطي ❌</Text>
          </TouchableOpacity>
        </>
      ) : completed ? (
        // Completed State
        <View style={styles.completedContainer}>
          <Text style={styles.completedIcon}>🎉</Text>
          <Text style={[styles.completedText, { color: theme.text }]}>مبروك!</Text>
          <Text style={[styles.completedPoints, { color: theme.success }]}>
            +{POINTS_PER_AD} نقاط
          </Text>
          <Text style={[styles.completedSubtext, { color: theme.textMuted }]}>
            يمكنك مشاهدة إعلان آخر بعد {AD_COOLDOWN} ثانية
          </Text>
        </View>
      ) : (
        // Ready State
        <>
          <View style={styles.adReadyContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.adReadyIcon}>🎬</Text>
            </Animated.View>
            <Text style={[styles.adReadyTitle, { color: theme.text }]}>إعلان جاهز للمشاهدة</Text>
            <Text style={[styles.adReadySubtitle, { color: theme.textMuted }]}>
              شاهد {REQUIRED_WATCH_TIME} ثانية واكسب {POINTS_PER_AD} نقاط
            </Text>
            
            {/* Ad Info */}
            <View style={[styles.adInfoBox, { backgroundColor: theme.cardBorder }]}>
              <View style={styles.adInfoRow}>
                <Text style={[styles.adInfoLabel, { color: theme.textMuted }]}>المدة:</Text>
                <Text style={[styles.adInfoValue, { color: theme.text }]}>{REQUIRED_WATCH_TIME} ثانية</Text>
              </View>
              <View style={styles.adInfoRow}>
                <Text style={[styles.adInfoLabel, { color: theme.textMuted }]}>المكافأة:</Text>
                <Text style={[styles.adInfoValue, { color: theme.success }]}>{POINTS_PER_AD} نقاط ⭐</Text>
              </View>
              <View style={styles.adInfoRow}>
                <Text style={[styles.adInfoLabel, { color: theme.textMuted }]}>المتبقي اليوم:</Text>
                <Text style={[styles.adInfoValue, { color: theme.accent }]}>{dailyRemaining} إعلان</Text>
              </View>
            </View>
          </View>
          
          {cooldownRemaining > 0 ? (
            <View style={[styles.cooldownContainer, { backgroundColor: theme.error + '20' }]}>
              <Text style={[styles.cooldownText, { color: theme.error }]}>
                ⏳ انتظر {cooldownRemaining} ثانية
              </Text>
            </View>
          ) : dailyRemaining <= 0 ? (
            <View style={[styles.limitContainer, { backgroundColor: theme.error + '20' }]}>
              <Text style={[styles.limitText, { color: theme.error }]}>
                ⏰ وصلت للحد اليومي - عد غداً
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.watchButton, { backgroundColor: theme.success }]}
              onPress={onStart}
              activeOpacity={0.8}
            >
              <Text style={styles.watchButtonText}>▶️ شاهد الآن</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

// ============ MAIN APP ============
export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? themes.dark : themes.light;
  
  // Screen state
  const [screen, setScreen] = useState('loading');
  const [activeTab, setActiveTab] = useState('home');
  
  // User state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  // Ad watching state
  const [watchTime, setWatchTime] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState(null);
  const [viewToken, setViewToken] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // Stats
  const [todayStats, setTodayStats] = useState({ views: 0, remaining: 50, points: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  
  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  
  // Animations
  const rewardAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // App state tracking (for security)
  const appState = useRef(AppState.currentState);

  // ============ EFFECTS ============

  useEffect(() => {
    initializeApp();
    
    // Monitor app state changes (security measure)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (isWatching && appState.current === 'active' && nextAppState !== 'active') {
        // User left the app while watching - cancel the view
        handleAppBackground();
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, []);

  // Watch timer with security validation
  useEffect(() => {
    let timer;
    if (isWatching && !adCompleted) {
      timer = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          
          // Vibrate every 10 seconds
          if (newTime % 10 === 0 && newTime < REQUIRED_WATCH_TIME) {
            Vibration.vibrate(50);
          }
          
          if (newTime >= REQUIRED_WATCH_TIME) {
            completeAdWatch();
            return REQUIRED_WATCH_TIME;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isWatching, adCompleted]);

  // Cooldown timer
  useEffect(() => {
    let timer;
    if (cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // ============ INITIALIZATION ============

  const initializeApp = async () => {
    try {
      // Load theme preference
      const savedTheme = await AsyncStorage.getItem('saqr_theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
      
      const savedToken = await AsyncStorage.getItem('saqr_token');
      const savedUser = await AsyncStorage.getItem('saqr_user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        await fetchAllData(savedToken);
        setScreen('main');
      } else {
        setScreen('login');
      }
    } catch (e) {
      setScreen('login');
    }
    
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  const fetchAllData = async (authToken) => {
    try {
      // Fetch user stats
      const statsRes = await fetch(`${API_URL}/rewarded-ads/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setTodayStats(data.today || { views: 0, remaining: 50, points: 0 });
      }

      // Fetch leaderboard
      const leaderRes = await fetch(`${API_URL}/rewarded-ads/leaderboard`);
      if (leaderRes.ok) {
        const data = await leaderRes.json();
        setLeaderboard(data.leaderboard || []);
      }

      generateAchievements();
    } catch (e) {
      console.log('Fetch error:', e);
    }
  };

  const generateAchievements = () => {
    const points = user?.points || 0;
    const totalViews = todayStats.views || 0;
    
    setAchievements([
      { id: 1, title: 'البداية', description: 'شاهد أول إعلان', icon: '🎬', unlocked: totalViews >= 1, progress: Math.min(100, totalViews * 100) },
      { id: 2, title: 'مشاهد نشط', description: 'شاهد 10 إعلانات', icon: '👀', unlocked: totalViews >= 10, progress: Math.min(100, totalViews * 10) },
      { id: 3, title: 'جامع النقاط', description: 'اجمع 100 نقطة', icon: '⭐', unlocked: points >= 100, progress: Math.min(100, points) },
      { id: 4, title: 'الثري', description: 'اجمع 500 نقطة', icon: '💰', unlocked: points >= 500, progress: Math.min(100, points / 5) },
      { id: 5, title: 'المليونير', description: 'اجمع 1000 نقطة', icon: '👑', unlocked: points >= 1000, progress: Math.min(100, points / 10) },
    ]);
  };

  // ============ SECURITY HANDLERS ============

  const handleAppBackground = () => {
    // Cancel current ad view if user leaves app
    if (isWatching) {
      setIsWatching(false);
      setWatchTime(0);
      setViewToken(null);
      Alert.alert('تم إلغاء المشاهدة', 'يجب البقاء في التطبيق أثناء مشاهدة الإعلان');
    }
  };

  // ============ AUTH HANDLERS ============

  const handleEmailLogin = async () => {
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
        await fetchAllData(data.token);
        setScreen('main');
        Vibration.vibrate(100);
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
    
    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
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
        setScreen('main');
        Vibration.vibrate([100, 50, 100]);
        Alert.alert('مرحباً! 🎉', 'تم إنشاء حسابك بنجاح');
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
    setScreen('main');
    Vibration.vibrate(50);
  };

  const logout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'خروج', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['saqr_token', 'saqr_user']);
            setToken(null);
            setUser(null);
            setScreen('login');
            setEmail('');
            setPassword('');
            setName('');
            setActiveTab('home');
          }
        }
      ]
    );
  };

  // ============ AD HANDLERS WITH SECURITY ============

  const startWatching = async () => {
    if (todayStats.remaining <= 0 && !user?.isGuest) {
      Alert.alert('تنبيه ⏰', 'وصلت للحد اليومي!\nعد غداً لمشاهدة المزيد');
      return;
    }

    if (cooldownRemaining > 0) {
      Alert.alert('انتظر', `يرجى الانتظار ${cooldownRemaining} ثانية`);
      return;
    }

    // For registered users, validate with server
    if (!user?.isGuest && token) {
      try {
        const response = await fetch(`${API_URL}/security/validate-ad-view`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (!data.allowed) {
          Alert.alert('تنبيه', data.message || 'غير مسموح بالمشاهدة حالياً');
          return;
        }
        
        setViewToken(data.view_token);
      } catch (e) {
        console.log('Validation error:', e);
        // Continue for offline support
      }
    }

    setWatchStartTime(Date.now());
    setIsWatching(true);
    setAdCompleted(false);
    setWatchTime(0);
    Vibration.vibrate(50);
  };

  const completeAdWatch = async () => {
    const endTime = Date.now();
    
    // Validate watch session
    if (!validateWatchSession(watchStartTime, endTime, MIN_WATCH_TIME)) {
      Alert.alert('خطأ', 'مدة المشاهدة غير صالحة');
      setIsWatching(false);
      setWatchTime(0);
      return;
    }

    setAdCompleted(true);
    setIsWatching(false);
    setCooldownRemaining(AD_COOLDOWN);
    
    const pointsEarned = POINTS_PER_AD;
    setEarnedPoints(pointsEarned);
    
    // Show reward animation
    setShowReward(true);
    Animated.sequence([
      Animated.timing(rewardAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(rewardAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowReward(false));

    Vibration.vibrate([100, 100, 100, 100, 200]);

    // Update points
    if (user?.isGuest) {
      const newPoints = (user.points || 0) + pointsEarned;
      const updatedUser = { ...user, points: newPoints };
      setUser(updatedUser);
      await AsyncStorage.setItem('saqr_user', JSON.stringify(updatedUser));
    } else if (token) {
      try {
        const response = await fetch(`${API_URL}/security/complete-ad-view`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            view_token: viewToken,
            watch_duration: REQUIRED_WATCH_TIME
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          const updatedUser = { ...user, points: data.total_points };
          setUser(updatedUser);
          await AsyncStorage.setItem('saqr_user', JSON.stringify(updatedUser));
          fetchAllData(token);
        }
      } catch (e) {
        // Offline fallback
        const newPoints = (user.points || 0) + pointsEarned;
        const updatedUser = { ...user, points: newPoints };
        setUser(updatedUser);
        await AsyncStorage.setItem('saqr_user', JSON.stringify(updatedUser));
      }
    }

    generateAchievements();
    
    setTimeout(() => {
      setWatchTime(0);
      setAdCompleted(false);
      setViewToken(null);
    }, 3000);
  };

  const skipAd = () => {
    Alert.alert(
      'تخطي الإعلان؟',
      'لن تحصل على النقاط إذا تخطيت الإعلان',
      [
        { text: 'متابعة المشاهدة', style: 'cancel' },
        { 
          text: 'تخطي', 
          style: 'destructive',
          onPress: () => {
            setIsWatching(false);
            setWatchTime(0);
            setViewToken(null);
          }
        }
      ]
    );
  };

  // Theme toggle
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem('saqr_theme', newTheme ? 'dark' : 'light');
    Vibration.vibrate(30);
  };

  // ============ RENDER ============

  // Loading Screen
  if (screen === 'loading') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.primary }]}>
        <StatusBar style={theme.statusBar} />
        <FloatingParticles theme={theme} />
        <Text style={[styles.loadingLogo, { color: theme.accent }]}>صقر</Text>
        <Text style={[styles.loadingTagline, { color: theme.textSecondary }]}>شاهد • اكسب • اسحب</Text>
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 30 }} />
      </View>
    );
  }

  // Login Screen
  if (screen === 'login') {
    return (
      <View style={[styles.loginContainer, { backgroundColor: theme.primary }]}>
        <StatusBar style={theme.statusBar} />
        <FloatingParticles theme={theme} />
        
        <ScrollView 
          contentContainerStyle={styles.loginScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.loginContent, { opacity: fadeAnim }]}>
            {/* Theme Toggle */}
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
              <Text style={{ fontSize: 24 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.loginLogoContainer}>
              <View style={[styles.logoGradient, { backgroundColor: theme.accent }]}>
                <Text style={[styles.loginLogoText, { color: theme.primary }]}>صقر</Text>
              </View>
              <Text style={[styles.loginSubtitle, { color: theme.text }]}>منصة مشاهدة الإعلانات</Text>
              <Text style={[styles.loginTagline, { color: theme.textMuted }]}>شاهد • اكسب • اسحب</Text>
            </View>

            {/* Form */}
            <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>
                {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
              </Text>

              {isRegister && (
                <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="الاسم الكامل"
                    placeholderTextColor={theme.textMuted}
                    value={name}
                    onChangeText={setName}
                    textAlign="right"
                  />
                </View>
              )}

              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="البريد الإلكتروني"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="كلمة المرور"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textAlign="right"
                />
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: theme.accent }]}
                onPress={isRegister ? handleRegister : handleEmailLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: theme.primary }]}>
                    {isRegister ? '✨ إنشاء حساب' : '🚀 دخول'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
                <Text style={[styles.switchText, { color: theme.accent }]}>
                  {isRegister ? 'لديك حساب؟ سجل دخول' : 'جديد؟ أنشئ حساب'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>أو</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]} />
            </View>

            {/* Guest Login */}
            <TouchableOpacity 
              style={[styles.guestButton, { borderColor: theme.cardBorder }]}
              onPress={guestLogin}
            >
              <Text style={[styles.guestButtonText, { color: theme.text }]}>👋 دخول كزائر</Text>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={[styles.infoBoxText, { color: theme.textMuted }]}>💰 {POINTS_PER_AD * 100} نقطة = 1 دولار</Text>
              <Text style={[styles.infoBoxText, { color: theme.textMuted }]}>⚡ اكسب حتى {POINTS_PER_AD * 50} نقطة يومياً</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Main App Screen
  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.primary }]}>
      <StatusBar style={theme.statusBar} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={logout} style={styles.headerBtn}>
            <Text style={{ fontSize: 20 }}>⬅️</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerLogo, { color: theme.accent }]}>صقر</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
              <Text style={{ fontSize: 18 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <View style={[styles.pointsBadge, { backgroundColor: theme.accent }]}>
              <Text style={[styles.pointsValue, { color: theme.primary }]}>{user?.points || 0}</Text>
              <Text style={[styles.pointsLabel, { color: theme.primary }]}>نقطة</Text>
            </View>
          </View>
        </View>
        
        {/* User greeting */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingText, { color: theme.text }]}>مرحباً {user?.name || 'زائر'} 👋</Text>
          {user?.isGuest && (
            <TouchableOpacity onPress={() => setScreen('login')}>
              <Text style={[styles.registerPrompt, { color: theme.accent }]}>سجل للحفاظ على نقاطك ➡️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            {/* Ad Viewer */}
            <AdViewer
              isWatching={isWatching}
              watchTime={watchTime}
              onStart={startWatching}
              onSkip={skipAd}
              completed={adCompleted}
              theme={theme}
              cooldownRemaining={cooldownRemaining}
              dailyRemaining={user?.isGuest ? 999 : todayStats.remaining}
            />

            {/* Daily Stats */}
            {!user?.isGuest && (
              <View style={[styles.dailyStatsContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 إحصائيات اليوم</Text>
                <View style={styles.dailyStatsRow}>
                  <View style={styles.dailyStat}>
                    <Text style={[styles.dailyStatValue, { color: theme.accent }]}>{todayStats.views}</Text>
                    <Text style={[styles.dailyStatLabel, { color: theme.textMuted }]}>مشاهدة</Text>
                  </View>
                  <View style={[styles.dailyStatDivider, { backgroundColor: theme.cardBorder }]} />
                  <View style={styles.dailyStat}>
                    <Text style={[styles.dailyStatValue, { color: theme.accent }]}>{todayStats.points || todayStats.views * POINTS_PER_AD}</Text>
                    <Text style={[styles.dailyStatLabel, { color: theme.textMuted }]}>نقطة اليوم</Text>
                  </View>
                  <View style={[styles.dailyStatDivider, { backgroundColor: theme.cardBorder }]} />
                  <View style={styles.dailyStat}>
                    <Text style={[styles.dailyStatValue, { color: theme.success }]}>{todayStats.remaining}</Text>
                    <Text style={[styles.dailyStatLabel, { color: theme.textMuted }]}>متبقي</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Stats Cards */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>💎 إحصائياتك</Text>
            <View style={styles.statsGrid}>
              <StatsCard 
                value={user?.points || 0} 
                label="إجمالي النقاط" 
                icon="⭐" 
                color={theme.accent}
                theme={theme}
                delay={0}
              />
              <StatsCard 
                value={`$${((user?.points || 0) / 500).toFixed(2)}`} 
                label="رصيدك بالدولار" 
                icon="💵" 
                color={theme.success}
                theme={theme}
                delay={100}
              />
            </View>

            {/* Withdraw Button */}
            {(user?.points || 0) >= 500 && !user?.isGuest && (
              <TouchableOpacity 
                style={[styles.withdrawButton, { backgroundColor: theme.accentSecondary }]}
                onPress={() => Alert.alert('قريباً', 'خاصية السحب ستكون متاحة قريباً')}
              >
                <Text style={styles.withdrawButtonText}>💰 اسحب أرباحك</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === 'leaderboard' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🏆 المتصدرين هذا الأسبوع</Text>
            {leaderboard.length > 0 ? (
              <View style={styles.leaderboardContainer}>
                {leaderboard.map((item, index) => (
                  <View key={index} style={[
                    styles.leaderboardItem,
                    { backgroundColor: theme.card, borderColor: theme.cardBorder },
                    index === 0 && { borderColor: '#FFD700' },
                    index === 1 && { borderColor: '#C0C0C0' },
                    index === 2 && { borderColor: '#CD7F32' },
                  ]}>
                    <Text style={styles.leaderboardRank}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </Text>
                    <Text style={[styles.leaderboardName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.leaderboardPoints, { color: theme.accent }]}>{item.points} ⭐</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>كن أول المتصدرين!</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'achievements' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🎖️ الإنجازات</Text>
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  unlocked={achievement.unlocked}
                  progress={achievement.progress}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>👤 الملف الشخصي</Text>
            
            <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.profileAvatar, { backgroundColor: theme.accent }]}>
                <Text style={[styles.profileAvatarText, { color: theme.primary }]}>
                  {(user?.name || 'ز')[0]}
                </Text>
              </View>
              <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'زائر'}</Text>
              <Text style={[styles.profileEmail, { color: theme.textMuted }]}>{user?.email || 'حساب زائر'}</Text>
              
              {/* Theme Toggle in Profile */}
              <View style={styles.profileThemeRow}>
                <Text style={[styles.profileThemeLabel, { color: theme.text }]}>الوضع الليلي</Text>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: theme.cardBorder, true: theme.accent }}
                  thumbColor={isDarkMode ? theme.primary : theme.card}
                />
              </View>
              
              {user?.isGuest && (
                <TouchableOpacity 
                  style={[styles.registerButton, { backgroundColor: theme.accent }]}
                  onPress={() => setScreen('login')}
                >
                  <Text style={[styles.registerButtonText, { color: theme.primary }]}>✨ إنشاء حساب</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.profileStats, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, { color: theme.accent }]}>{user?.points || 0}</Text>
                <Text style={[styles.profileStatLabel, { color: theme.textMuted }]}>النقاط</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, { color: theme.accent }]}>${((user?.points || 0) / 500).toFixed(2)}</Text>
                <Text style={[styles.profileStatLabel, { color: theme.textMuted }]}>الرصيد</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={[styles.profileStatValue, { color: theme.accent }]}>{achievements.filter(a => a.unlocked).length}</Text>
                <Text style={[styles.profileStatLabel, { color: theme.textMuted }]}>الإنجازات</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: theme.error + '20', borderColor: theme.error }]}
              onPress={logout}
            >
              <Text style={[styles.logoutButtonText, { color: theme.error }]}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.secondary, borderTopColor: theme.cardBorder }]}>
        {[
          { id: 'home', icon: '🏠', label: 'الرئيسية' },
          { id: 'leaderboard', icon: '🏆', label: 'المتصدرين' },
          { id: 'achievements', icon: '🎖️', label: 'الإنجازات' },
          { id: 'profile', icon: '👤', label: 'حسابي' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => {
              setActiveTab(tab.id);
              Vibration.vibrate(30);
            }}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text style={[
              styles.navLabel,
              { color: activeTab === tab.id ? theme.accent : theme.textMuted }
            ]}>{tab.label}</Text>
            {activeTab === tab.id && <View style={[styles.navIndicator, { backgroundColor: theme.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Reward Modal */}
      <Modal visible={showReward} transparent animationType="fade">
        <View style={styles.rewardModalOverlay}>
          <Animated.View style={[
            styles.rewardModal,
            {
              opacity: rewardAnim,
              transform: [{
                scale: rewardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1]
                })
              }]
            }
          ]}>
            <View style={[styles.rewardModalContent, { backgroundColor: theme.secondary, borderColor: theme.accent }]}>
              <Text style={styles.rewardEmoji}>🎉</Text>
              <Text style={[styles.rewardTitle, { color: theme.text }]}>مبروك!</Text>
              <Text style={[styles.rewardPoints, { color: theme.success }]}>+{earnedPoints} نقاط</Text>
              <Text style={[styles.rewardSubtitle, { color: theme.textMuted }]}>أحسنت! استمر بالمشاهدة</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  // Particles
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 70,
    fontWeight: 'bold',
  },
  loadingTagline: {
    fontSize: 16,
    marginTop: 10,
    letterSpacing: 2,
  },

  // Login Screen
  loginContainer: {
    flex: 1,
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  loginContent: {
    alignItems: 'center',
  },
  themeToggle: {
    position: 'absolute',
    top: -40,
    right: 0,
    padding: 10,
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
  },
  loginLogoText: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  loginSubtitle: {
    fontSize: 18,
    marginTop: 15,
    fontWeight: '600',
  },
  loginTagline: {
    fontSize: 14,
    marginTop: 5,
    letterSpacing: 3,
  },

  // Form
  formCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  inputIcon: {
    fontSize: 20,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    textAlign: 'center',
    fontSize: 14,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },

  // Guest Button
  guestButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 1,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Info Box
  infoBox: {
    marginTop: 30,
    alignItems: 'center',
  },
  infoBoxText: {
    fontSize: 14,
    marginBottom: 8,
  },

  // Main Container
  mainContainer: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLogo: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeBtn: {
    padding: 8,
  },
  pointsBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  greetingContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  registerPrompt: {
    fontSize: 12,
    marginTop: 4,
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabContent: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
  },

  // Ad Container
  adContainer: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  adVideoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  adVideoGradient: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adPlayingIcon: {
    fontSize: 40,
  },
  adPlayingText: {
    fontSize: 16,
    marginTop: 8,
  },
  timerWrapper: {
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: 12,
  },
  durationBadge: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressOuter: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressInner: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  watchingHint: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  skipButton: {
    alignSelf: 'center',
    padding: 10,
  },
  skipButtonText: {
    fontSize: 14,
  },

  // Ad Ready State
  adReadyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  adReadyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  adReadyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adReadySubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  adInfoBox: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  adInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  adInfoLabel: {
    fontSize: 14,
  },
  adInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  watchButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    width: '100%',
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cooldownContainer: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  cooldownText: {
    fontSize: 16,
    fontWeight: '600',
  },
  limitContainer: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  limitText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Completed State
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completedIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  completedText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completedPoints: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  completedSubtext: {
    fontSize: 14,
    marginTop: 12,
  },

  // Daily Stats
  dailyStatsContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  dailyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 12,
  },
  dailyStat: {
    alignItems: 'center',
  },
  dailyStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  dailyStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  dailyStatDivider: {
    width: 1,
    height: 40,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  statsIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsLabel: {
    fontSize: 12,
    marginTop: 4,
  },

  // Withdraw Button
  withdrawButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Leaderboard
  leaderboardContainer: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  leaderboardRank: {
    fontSize: 24,
    width: 50,
    textAlign: 'center',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardPoints: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
  },

  // Achievements
  achievementsContainer: {
    gap: 12,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  achievementDesc: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  achievementProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementCheck: {
    fontSize: 20,
    marginLeft: 12,
  },

  // Profile
  profileCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 20,
  },
  profileThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  profileThemeLabel: {
    fontSize: 16,
  },
  registerButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 16,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileStats: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 10,
  },
  navIndicator: {
    position: 'absolute',
    top: 0,
    width: 30,
    height: 3,
    borderRadius: 2,
  },

  // Reward Modal
  rewardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardModal: {
    width: width * 0.8,
  },
  rewardModalContent: {
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
  },
  rewardEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardPoints: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardSubtitle: {
    fontSize: 16,
  },
});
