import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Platform,
  Vibration,
  Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// API Configuration
const API_URL = 'https://rewardviewer-2.preview.emergentagent.com/api';

const { width, height } = Dimensions.get('window');

// ============ CUSTOM COMPONENTS ============

// Animated Background Gradient
const AnimatedGradient = ({ children, colors }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(animValue, { toValue: 0, duration: 3000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient colors={colors} style={styles.gradientBg}>
      {children}
    </LinearGradient>
  );
};

// Floating Particles Effect
const FloatingParticles = () => {
  const particles = Array(8).fill(0).map((_, i) => {
    const anim = useRef(new Animated.Value(0)).current;
    const delay = i * 500;
    
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 4000 + Math.random() * 2000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 4000 + Math.random() * 2000, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [height, -100]
    });

    const opacity = anim.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [0, 0.6, 0.6, 0]
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
            width: 4 + Math.random() * 8,
            height: 4 + Math.random() * 8,
          }
        ]}
      />
    );
  });

  return <View style={styles.particlesContainer}>{particles}</View>;
};

// Glowing Button
const GlowButton = ({ onPress, title, colors, icon, disabled, loading }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8]
  });

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      <Animated.View style={[
        styles.glowButtonContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <LinearGradient
          colors={disabled ? ['#6B7280', '#4B5563'] : colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowButton}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
              <Text style={styles.glowButtonText}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Stats Card with Animation
const StatsCard = ({ value, label, icon, color, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true })
    ]).start();

    Animated.timing(countAnim, {
      toValue: typeof value === 'number' ? value : 0,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();

    countAnim.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => countAnim.removeAllListeners();
  }, [value]);

  return (
    <Animated.View style={[
      styles.statsCard,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.statsCardGradient}
      >
        <Text style={styles.statsIcon}>{icon}</Text>
        <Text style={[styles.statsValue, { color }]}>
          {typeof value === 'number' ? displayValue : value}
        </Text>
        <Text style={styles.statsLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Achievement Badge
const AchievementBadge = ({ title, description, icon, unlocked, progress }) => {
  return (
    <View style={[styles.achievementBadge, !unlocked && styles.achievementLocked]}>
      <View style={[styles.achievementIcon, unlocked && styles.achievementIconUnlocked]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementTitle}>{title}</Text>
        <Text style={styles.achievementDesc}>{description}</Text>
        {!unlocked && progress !== undefined && (
          <View style={styles.achievementProgress}>
            <View style={[styles.achievementProgressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </View>
      {unlocked && <Text style={styles.achievementCheck}>✓</Text>}
    </View>
  );
};

// ============ MAIN APP ============

export default function App() {
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
  const [currentAd, setCurrentAd] = useState(null);
  
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
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rewardAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ============ EFFECTS ============

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    let timer;
    if (isWatching && !adCompleted) {
      timer = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          
          Animated.timing(progressAnim, {
            toValue: newTime / 30,
            duration: 800,
            useNativeDriver: false
          }).start();
          
          // Vibrate every 10 seconds
          if (newTime % 10 === 0 && newTime < 30) {
            Vibration.vibrate(50);
          }
          
          if (newTime >= 30) {
            completeAdWatch();
            return 30;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isWatching, adCompleted]);

  // ============ INITIALIZATION ============

  const initializeApp = async () => {
    // Animate logo
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.delay(500),
    ]).start();

    try {
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

      // Generate achievements based on user data
      generateAchievements();
    } catch (e) {
      console.log('Fetch error:', e);
    }
  };

  const generateAchievements = () => {
    const points = user?.points || 0;
    const totalViews = todayStats.views || 0;
    
    setAchievements([
      {
        id: 1,
        title: 'البداية',
        description: 'شاهد أول إعلان',
        icon: '🎬',
        unlocked: totalViews >= 1,
        progress: Math.min(100, totalViews * 100)
      },
      {
        id: 2,
        title: 'مشاهد نشط',
        description: 'شاهد 10 إعلانات',
        icon: '👀',
        unlocked: totalViews >= 10,
        progress: Math.min(100, totalViews * 10)
      },
      {
        id: 3,
        title: 'جامع النقاط',
        description: 'اجمع 100 نقطة',
        icon: '⭐',
        unlocked: points >= 100,
        progress: Math.min(100, points)
      },
      {
        id: 4,
        title: 'الثري',
        description: 'اجمع 500 نقطة',
        icon: '💰',
        unlocked: points >= 500,
        progress: Math.min(100, points / 5)
      },
      {
        id: 5,
        title: 'المليونير',
        description: 'اجمع 1000 نقطة',
        icon: '👑',
        unlocked: points >= 1000,
        progress: Math.min(100, points / 10)
      },
    ]);
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

  // ============ AD HANDLERS ============

  const startWatching = async () => {
    if (todayStats.remaining <= 0 && !user?.isGuest) {
      Alert.alert('تنبيه ⏰', 'وصلت للحد اليومي!\nعد غداً لمشاهدة المزيد');
      return;
    }

    // Simulate fetching ad
    setCurrentAd({
      id: 'ad_' + Date.now(),
      title: 'إعلان مميز',
      advertiser: 'المعلن',
      type: 'video'
    });

    setIsWatching(true);
    setAdCompleted(false);
    setWatchTime(0);
    progressAnim.setValue(0);
    Vibration.vibrate(50);
  };

  const completeAdWatch = async () => {
    setAdCompleted(true);
    setIsWatching(false);
    
    const pointsEarned = 5;
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
    } else {
      try {
        const response = await fetch(`${API_URL}/rewarded-ads/complete`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ad_type: 'personal',
            ad_id: currentAd?.id,
            completed: true,
            watch_duration: 30
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

    // Update achievements
    generateAchievements();
    
    // Reset for next ad
    setTimeout(() => {
      setCurrentAd(null);
      setWatchTime(0);
      progressAnim.setValue(0);
      setAdCompleted(false);
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
            setCurrentAd(null);
            setWatchTime(0);
            progressAnim.setValue(0);
          }
        }
      ]
    );
  };

  // ============ RENDER SCREENS ============

  // Loading Screen
  if (screen === 'loading') {
    return (
      <AnimatedGradient colors={['#1a1a2e', '#16213e', '#0f3460']}>
        <StatusBar style="light" />
        <FloatingParticles />
        <View style={styles.loadingContainer}>
          <Animated.View style={[
            styles.logoContainer,
            {
              opacity: logoAnim,
              transform: [{ 
                scale: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1]
                })
              }]
            }
          ]}>
            <Text style={styles.loadingLogo}>صقر</Text>
            <Text style={styles.loadingTagline}>شاهد • اكسب • اسحب</Text>
          </Animated.View>
          <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 30 }} />
        </View>
      </AnimatedGradient>
    );
  }

  // Login Screen
  if (screen === 'login') {
    return (
      <AnimatedGradient colors={['#1a1a2e', '#16213e', '#0f3460']}>
        <StatusBar style="light" />
        <FloatingParticles />
        <ScrollView 
          contentContainerStyle={styles.loginScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.loginContent, { opacity: fadeAnim }]}>
            {/* Logo */}
            <View style={styles.loginLogoContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.logoGradient}
              >
                <Text style={styles.loginLogoText}>صقر</Text>
              </LinearGradient>
              <Text style={styles.loginSubtitle}>منصة مشاهدة الإعلانات</Text>
              <Text style={styles.loginTagline}>شاهد • اكسب • اسحب</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
              </Text>

              {isRegister && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="الاسم الكامل"
                    placeholderTextColor="#6B7280"
                    value={name}
                    onChangeText={setName}
                    textAlign="right"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="البريد الإلكتروني"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textAlign="right"
                />
              </View>

              <GlowButton
                title={isRegister ? 'إنشاء حساب' : 'دخول'}
                colors={['#FFD700', '#FFA500']}
                onPress={isRegister ? handleRegister : handleEmailLogin}
                loading={loading}
                icon={isRegister ? '✨' : '🚀'}
              />

              <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
                <Text style={styles.switchText}>
                  {isRegister ? 'لديك حساب؟ سجل دخول' : 'جديد؟ أنشئ حساب'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest Login */}
            <TouchableOpacity style={styles.guestButton} onPress={guestLogin}>
              <Text style={styles.guestButtonText}>👋 دخول كزائر</Text>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>💰 500 نقطة = 1 دولار</Text>
              <Text style={styles.infoBoxText}>⚡ اكسب حتى 250 نقطة يومياً</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </AnimatedGradient>
    );
  }

  // Main App Screen
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutIcon}>⬅️</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerLogo}>صقر</Text>
          </View>
          
          <View style={styles.pointsContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.pointsBadge}
            >
              <Text style={styles.pointsValue}>{user?.points || 0}</Text>
              <Text style={styles.pointsLabel}>نقطة</Text>
            </LinearGradient>
          </View>
        </View>
        
        {/* User greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>مرحباً {user?.name || 'زائر'} 👋</Text>
          {user?.isGuest && (
            <TouchableOpacity onPress={() => setScreen('login')}>
              <Text style={styles.registerPrompt}>سجل للحفاظ على نقاطك ➡️</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {activeTab === 'home' && (
          <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
            {/* Ad Card */}
            <View style={styles.adContainer}>
              <LinearGradient
                colors={['#1a1a2e', '#0f3460']}
                style={styles.adCard}
              >
                {isWatching ? (
                  // Watching State
                  <>
                    <View style={styles.adVideoContainer}>
                      <LinearGradient
                        colors={['#000000', '#1a1a2e']}
                        style={styles.adVideo}
                      >
                        <Text style={styles.adPlayingIcon}>📺</Text>
                        <Text style={styles.adPlayingText}>جاري العرض...</Text>
                        <View style={styles.timerCircle}>
                          <Text style={styles.timerText}>{30 - watchTime}</Text>
                          <Text style={styles.timerLabel}>ثانية</Text>
                        </View>
                      </LinearGradient>
                    </View>
                    
                    {/* Progress Bar */}
                    <View style={styles.progressOuter}>
                      <Animated.View style={[styles.progressInner, { width: progressWidth }]}>
                        <LinearGradient
                          colors={['#10B981', '#059669']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.progressGradient}
                        />
                      </Animated.View>
                    </View>
                    
                    <Text style={styles.watchingHint}>
                      🎁 استمر بالمشاهدة لتحصل على 5 نقاط
                    </Text>
                    
                    <TouchableOpacity style={styles.skipButton} onPress={skipAd}>
                      <Text style={styles.skipButtonText}>تخطي ❌</Text>
                    </TouchableOpacity>
                  </>
                ) : adCompleted ? (
                  // Completed State
                  <View style={styles.completedContainer}>
                    <Text style={styles.completedIcon}>🎉</Text>
                    <Text style={styles.completedText}>مبروك!</Text>
                    <Text style={styles.completedPoints}>+5 نقاط</Text>
                  </View>
                ) : (
                  // Ready State
                  <>
                    <View style={styles.adReadyContainer}>
                      <Text style={styles.adReadyIcon}>🎬</Text>
                      <Text style={styles.adReadyTitle}>إعلان جاهز</Text>
                      <Text style={styles.adReadySubtitle}>شاهد 30 ثانية واكسب 5 نقاط</Text>
                    </View>
                    
                    <GlowButton
                      title="شاهد الآن"
                      colors={['#10B981', '#059669']}
                      onPress={startWatching}
                      icon="▶️"
                      disabled={todayStats.remaining <= 0 && !user?.isGuest}
                    />
                    
                    {todayStats.remaining <= 0 && !user?.isGuest && (
                      <Text style={styles.limitReached}>
                        ⏰ وصلت للحد اليومي - عد غداً
                      </Text>
                    )}
                  </>
                )}
              </LinearGradient>
            </View>

            {/* Daily Stats */}
            {!user?.isGuest && (
              <View style={styles.dailyStatsContainer}>
                <Text style={styles.sectionTitle}>📊 إحصائيات اليوم</Text>
                <View style={styles.dailyStatsRow}>
                  <View style={styles.dailyStat}>
                    <Text style={styles.dailyStatValue}>{todayStats.views}</Text>
                    <Text style={styles.dailyStatLabel}>مشاهدة</Text>
                  </View>
                  <View style={styles.dailyStatDivider} />
                  <View style={styles.dailyStat}>
                    <Text style={styles.dailyStatValue}>{todayStats.points || todayStats.views * 5}</Text>
                    <Text style={styles.dailyStatLabel}>نقطة اليوم</Text>
                  </View>
                  <View style={styles.dailyStatDivider} />
                  <View style={styles.dailyStat}>
                    <Text style={[styles.dailyStatValue, { color: '#10B981' }]}>{todayStats.remaining}</Text>
                    <Text style={styles.dailyStatLabel}>متبقي</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Stats Cards */}
            <Text style={styles.sectionTitle}>💎 إحصائياتك</Text>
            <View style={styles.statsGrid}>
              <StatsCard 
                value={user?.points || 0} 
                label="إجمالي النقاط" 
                icon="⭐" 
                color="#FFD700"
                delay={0}
              />
              <StatsCard 
                value={`$${((user?.points || 0) / 500).toFixed(2)}`} 
                label="رصيدك بالدولار" 
                icon="💵" 
                color="#10B981"
                delay={100}
              />
            </View>

            {/* Quick Actions */}
            {(user?.points || 0) >= 500 && !user?.isGuest && (
              <View style={styles.quickActions}>
                <GlowButton
                  title="اسحب أرباحك"
                  colors={['#8B5CF6', '#7C3AED']}
                  icon="💰"
                  onPress={() => Alert.alert('قريباً', 'خاصية السحب ستكون متاحة قريباً')}
                />
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'leaderboard' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>🏆 المتصدرين هذا الأسبوع</Text>
            {leaderboard.length > 0 ? (
              <View style={styles.leaderboardContainer}>
                {leaderboard.map((item, index) => (
                  <View key={index} style={[
                    styles.leaderboardItem,
                    index === 0 && styles.leaderboardFirst,
                    index === 1 && styles.leaderboardSecond,
                    index === 2 && styles.leaderboardThird,
                  ]}>
                    <Text style={styles.leaderboardRank}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </Text>
                    <Text style={styles.leaderboardName}>{item.name}</Text>
                    <Text style={styles.leaderboardPoints}>{item.points} ⭐</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyText}>كن أول المتصدرين!</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'achievements' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>🎖️ الإنجازات</Text>
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  unlocked={achievement.unlocked}
                  progress={achievement.progress}
                />
              ))}
            </View>
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>👤 الملف الشخصي</Text>
            
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {(user?.name || 'ز')[0]}
                </Text>
              </View>
              <Text style={styles.profileName}>{user?.name || 'زائر'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'حساب زائر'}</Text>
              
              {user?.isGuest && (
                <GlowButton
                  title="إنشاء حساب"
                  colors={['#FFD700', '#FFA500']}
                  icon="✨"
                  onPress={() => setScreen('login')}
                />
              )}
            </View>

            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{user?.points || 0}</Text>
                <Text style={styles.profileStatLabel}>النقاط</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>${((user?.points || 0) / 500).toFixed(2)}</Text>
                <Text style={styles.profileStatLabel}>الرصيد</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{achievements.filter(a => a.unlocked).length}</Text>
                <Text style={styles.profileStatLabel}>الإنجازات</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.bottomNavGradient}
        >
          {[
            { id: 'home', icon: '🏠', label: 'الرئيسية' },
            { id: 'leaderboard', icon: '🏆', label: 'المتصدرين' },
            { id: 'achievements', icon: '🎖️', label: 'الإنجازات' },
            { id: 'profile', icon: '👤', label: 'حسابي' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navItem, activeTab === tab.id && styles.navItemActive]}
              onPress={() => {
                setActiveTab(tab.id);
                Vibration.vibrate(30);
              }}
            >
              <Text style={styles.navIcon}>{tab.icon}</Text>
              <Text style={[
                styles.navLabel,
                activeTab === tab.id && styles.navLabelActive
              ]}>{tab.label}</Text>
              {activeTab === tab.id && <View style={styles.navIndicator} />}
            </TouchableOpacity>
          ))}
        </LinearGradient>
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
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.rewardModalContent}
            >
              <Text style={styles.rewardEmoji}>🎉</Text>
              <Text style={styles.rewardTitle}>مبروك!</Text>
              <Text style={styles.rewardPoints}>+{earnedPoints} نقاط</Text>
              <Text style={styles.rewardSubtitle}>أحسنت! استمر بالمشاهدة</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  // Gradient Background
  gradientBg: {
    flex: 1,
  },
  
  // Particles
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 50,
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  loadingTagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 10,
    letterSpacing: 2,
  },

  // Login Screen
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  loginContent: {
    alignItems: 'center',
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
    fontSize: 60,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  loginSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 15,
    fontWeight: '600',
  },
  loginTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 5,
    letterSpacing: 3,
  },

  // Form
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFFFFF',
  },
  switchText: {
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },

  // Glow Button
  glowButtonContainer: {
    marginVertical: 8,
  },
  glowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  glowButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 16,
    fontSize: 14,
  },

  // Guest Button
  guestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Info Box
  infoBox: {
    marginTop: 30,
    alignItems: 'center',
  },
  infoBoxText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 8,
  },

  // Main Container
  mainContainer: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutBtn: {
    padding: 8,
  },
  logoutIcon: {
    fontSize: 24,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  greetingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  registerPrompt: {
    fontSize: 12,
    color: '#FFD700',
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

  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'right',
  },

  // Ad Container
  adContainer: {
    marginBottom: 20,
  },
  adCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  adVideoContainer: {
    marginBottom: 16,
  },
  adVideo: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adPlayingIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  adPlayingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timerCircle: {
    marginTop: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#10B981',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  timerLabel: {
    fontSize: 10,
    color: '#10B981',
  },
  progressOuter: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 16,
  },
  skipButton: {
    alignSelf: 'center',
    padding: 10,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },

  // Ad Ready State
  adReadyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  adReadyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  adReadyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  adReadySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  limitReached: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 14,
    marginTop: 16,
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  completedPoints: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
  },

  // Daily Stats
  dailyStatsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dailyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dailyStat: {
    alignItems: 'center',
  },
  dailyStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  dailyStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  dailyStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
  },
  statsCardGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },

  // Quick Actions
  quickActions: {
    marginTop: 10,
    marginBottom: 20,
  },

  // Leaderboard
  leaderboardContainer: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardFirst: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  leaderboardSecond: {
    borderColor: '#C0C0C0',
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
  },
  leaderboardThird: {
    borderColor: '#CD7F32',
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
  },
  leaderboardRank: {
    fontSize: 24,
    width: 50,
    textAlign: 'center',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  leaderboardPoints: {
    fontSize: 16,
    color: '#FFD700',
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
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Achievements
  achievementsContainer: {
    gap: 12,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIconUnlocked: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  achievementDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    textAlign: 'right',
  },
  achievementProgress: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  achievementCheck: {
    fontSize: 20,
    color: '#10B981',
    marginLeft: 12,
  },

  // Profile
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  profileStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNavGradient: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state handled by indicator
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  navLabelActive: {
    color: '#FFD700',
    fontWeight: '600',
  },
  navIndicator: {
    position: 'absolute',
    top: 0,
    width: 30,
    height: 3,
    backgroundColor: '#FFD700',
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
    borderColor: '#FFD700',
  },
  rewardEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rewardPoints: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  rewardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
