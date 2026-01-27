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
  Platform,
  Vibration,
  PanResponder,
  Modal,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';

// ============ CONFIGURATION ============
const API_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL || 'https://saqr-ads-1.preview.emergentagent.com'}/api`;
const { width, height } = Dimensions.get('window');

const REQUIRED_WATCH_TIME = 30;
const POINTS_PER_AD = 5;

// ============ ICONS (Simple Gray Icons) ============
const Icons = {
  home: '⌂',
  profile: '○',
  ads: '▷',
  advertise: '+',
  ai: '◉',
  settings: '⚙',
  logout: '↪',
  sun: '○',
  moon: '●',
  play: '▶',
  pause: '⏸',
  sound: '♪',
  mute: '✕',
  arrow: '›',
  check: '✓',
  star: '★',
  clock: '◷',
  chart: '▤',
  gift: '◈',
  close: '✕',
  send: '➤',
  back: '‹',
};

// ============ AI CHAT MODAL ============
const AIChatModal = ({ visible, onClose, user }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('user_token');
      const endpoint = token ? '/ai/chat' : '/ai/guest-chat';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || data.message || 'عذراً، حدث خطأ. حاول مرة أخرى.'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'عذراً، تعذر الاتصال. تأكد من اتصالك بالإنترنت.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.chatContainer}>
          {/* Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>{Icons.close}</Text>
            </TouchableOpacity>
            <Text style={styles.chatTitle}>المساعد الذكي</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Messages */}
          <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
            {messages.map((msg, idx) => (
              <View key={idx} style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userMessage : styles.assistantMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                ]}>{msg.content}</Text>
              </View>
            ))}
            {isLoading && (
              <View style={styles.loadingMessage}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="اكتب رسالتك..."
                placeholderTextColor="#9ca3af"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Text style={styles.sendBtnText}>{Icons.send}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

// ============ FULL SCREEN AD VIEWER ============
const FullScreenAdViewer = ({ ads, onClose, onPointsEarned, user }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showAdInfo, setShowAdInfo] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
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
          if (gestureState.dy < -50) goToNext();
          else if (gestureState.dy > 50) goToPrevious();
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
              isMuted={isMuted}
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

      {/* Timer & Mute */}
      <Animated.View style={[styles.topControls, { opacity: controlsOpacity }]}>
        <TouchableOpacity style={styles.muteBtn} onPress={() => setIsMuted(!isMuted)}>
          <Text style={styles.muteBtnText}>{isMuted ? Icons.mute : Icons.sound}</Text>
        </TouchableOpacity>
        <View style={styles.timerBadge}>
          {watchTime >= REQUIRED_WATCH_TIME ? (
            <Text style={styles.timerComplete}>{Icons.check} +{POINTS_PER_AD}</Text>
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
            <View style={styles.advertiserInfo}>
              <Text style={styles.advertiserName}>{currentAd.advertiser || 'معلن'}</Text>
              <Text style={styles.advertiserHandle}>@{(currentAd.advertiser || 'advertiser').toLowerCase().replace(/\s/g, '_')}</Text>
            </View>
          </View>
          <Text style={styles.adInfoTitle}>{currentAd.title}</Text>
          <Text style={styles.adInfoDesc} numberOfLines={2}>{currentAd.description}</Text>
          {currentAd.website_url && (
            <TouchableOpacity 
              style={styles.visitButton}
              onPress={() => Linking.openURL(currentAd.website_url)}
            >
              <Text style={styles.visitButtonText}>زيارة الموقع</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Points Animation */}
      {showPointsAnimation && (
        <View style={styles.pointsAnimation}>
          <Animated.Text style={[styles.pointsAnimationText, { transform: [{ scale: pointsScale }] }]}>
            +{POINTS_PER_AD} {Icons.star}
          </Animated.Text>
        </View>
      )}

      {/* Earned Points */}
      {earnedPoints > 0 && !showAdInfo && (
        <View style={styles.earnedPointsContainer}>
          <Text style={styles.earnedPointsText}>{Icons.star} {earnedPoints}</Text>
        </View>
      )}
    </View>
  );
};

// ============ HOME PAGE ============
const HomePage = ({ user, settings, onNavigateToAds }) => {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const userPoints = user?.points || 0;
  const pointsPerDollar = settings?.points_per_dollar || 500;
  const userBalance = (userPoints / pointsPerDollar).toFixed(2);
  const pointsPerAd = settings?.points_per_ad || 5;
  const dailyLimit = settings?.daily_limit || 50;
  const watchedToday = user?.watched_today || 0;

  const tips = settings?.tips || [
    { icon: '💡', text: 'شاهد الإعلانات واكسب النقاط!' },
    { icon: '🎯', text: 'كل 500 نقطة = 1 دولار' },
    { icon: '⚡', text: 'أكمل التحديات اليومية' },
  ];

  const challenges = settings?.daily_challenges || [
    { title: 'المشاهد النشط', target: 5, reward: 25, icon: '👁', desc: 'شاهد 5 إعلانات' },
  ];
  const dailyChallenge = challenges[new Date().getDate() % challenges.length];

  return (
    <ScrollView style={styles.homePage} showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContent}>
      {/* Header */}
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.welcomeText}>مرحباً {user?.name || 'صديقي'}</Text>
          <Text style={styles.subText}>جاهز لكسب المزيد اليوم؟</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>{userPoints} {Icons.star}</Text>
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
            <Text style={styles.balanceIconText}>{Icons.chart}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Start Watching Button */}
      <TouchableOpacity onPress={onNavigateToAds} activeOpacity={0.9}>
        <LinearGradient colors={['#ef4444', '#ec4899']} style={styles.watchButton}>
          <View style={styles.watchButtonLeft}>
            <View style={styles.playIconCircle}>
              <Text style={styles.playIconText}>{Icons.play}</Text>
            </View>
            <View>
              <Text style={styles.watchButtonTitle}>ابدأ المشاهدة الآن</Text>
              <Text style={styles.watchButtonSub}>اكسب {pointsPerAd} نقاط لكل إعلان</Text>
            </View>
          </View>
          <Text style={styles.arrowText}>{Icons.arrow}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>{Icons.chart} إحصائياتك</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{Icons.clock}</Text>
            <Text style={styles.statValue}>{watchedToday}</Text>
            <Text style={styles.statLabel}>اليوم</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{Icons.gift}</Text>
            <Text style={styles.statValue}>{dailyLimit - watchedToday}</Text>
            <Text style={styles.statLabel}>المتبقي</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{Icons.star}</Text>
            <Text style={styles.statValue}>{pointsPerAd}</Text>
            <Text style={styles.statLabel}>نقاط/إعلان</Text>
          </View>
        </View>
      </View>

      {/* Daily Challenge */}
      {dailyChallenge && (
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeIcon}>{dailyChallenge.icon}</Text>
            <View>
              <Text style={styles.challengeTitle}>التحدي اليومي</Text>
              <Text style={styles.challengeName}>{dailyChallenge.title}</Text>
            </View>
          </View>
          <Text style={styles.challengeDesc}>{dailyChallenge.desc}</Text>
          <View style={styles.challengeProgress}>
            <View style={styles.challengeProgressBar}>
              <View style={[styles.challengeProgressFill, { width: `${Math.min((watchedToday / dailyChallenge.target) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.challengeReward}>+{dailyChallenge.reward} {Icons.star}</Text>
          </View>
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>{tips[currentTip % tips.length]?.icon || '💡'}</Text>
        <Text style={styles.tipText}>{tips[currentTip % tips.length]?.text || ''}</Text>
      </View>

      {/* How to Earn */}
      <View style={styles.howToCard}>
        <Text style={styles.howToTitle}>كيف تكسب؟</Text>
        <Text style={styles.howToItem}>{Icons.check} شاهد إعلان = {pointsPerAd} نقاط</Text>
        <Text style={styles.howToItem}>{Icons.check} أكمل التحدي = مكافأة</Text>
        <Text style={styles.howToItem}>{Icons.check} {pointsPerDollar} نقطة = $1</Text>
      </View>
    </ScrollView>
  );
};

// ============ PROFILE PAGE ============
const ProfilePage = ({ user, onLogout, onNavigate }) => {
  const userPoints = user?.points || 0;
  const totalEarned = user?.total_earned || userPoints;

  return (
    <ScrollView style={styles.profilePage} showsVerticalScrollIndicator={false} contentContainerStyle={styles.profileContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name || 'مستخدم'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.profileStatsRow}>
        <View style={styles.profileStatCard}>
          <Text style={styles.profileStatValue}>{userPoints}</Text>
          <Text style={styles.profileStatLabel}>نقاط حالية</Text>
        </View>
        <View style={styles.profileStatCard}>
          <Text style={styles.profileStatValue}>{totalEarned}</Text>
          <Text style={styles.profileStatLabel}>إجمالي مكتسب</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('withdraw')}>
          <Text style={styles.menuIcon}>{Icons.gift}</Text>
          <Text style={styles.menuText}>سحب الأرباح</Text>
          <Text style={styles.menuArrow}>{Icons.arrow}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>{Icons.settings}</Text>
          <Text style={styles.menuText}>الإعدادات</Text>
          <Text style={styles.menuArrow}>{Icons.arrow}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={onLogout}>
          <Text style={[styles.menuIcon, styles.logoutIcon]}>{Icons.logout}</Text>
          <Text style={[styles.menuText, styles.logoutText]}>تسجيل الخروج</Text>
          <Text style={[styles.menuArrow, styles.logoutArrow]}>{Icons.arrow}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ============ ADVERTISER PAGE ============
const AdvertiserPage = ({ user }) => {
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adUrl, setAdUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAd = async () => {
    if (!adTitle || !adDescription) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const response = await fetch(`${API_URL}/advertiser/create-ad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: adTitle,
          description: adDescription,
          website_url: adUrl
        })
      });

      if (response.ok) {
        Alert.alert('نجاح', 'تم إرسال إعلانك للمراجعة');
        setAdTitle('');
        setAdDescription('');
        setAdUrl('');
      } else {
        Alert.alert('خطأ', 'فشل إرسال الإعلان');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.advertiserPage} showsVerticalScrollIndicator={false} contentContainerStyle={styles.advertiserContent}>
      <Text style={styles.advertiserTitle}>أعلن معنا</Text>
      <Text style={styles.advertiserSubtitle}>أنشر إعلانك وصل لآلاف المستخدمين</Text>

      <View style={styles.adForm}>
        <Text style={styles.inputLabel}>عنوان الإعلان *</Text>
        <TextInput
          style={styles.formInput}
          placeholder="أدخل عنوان إعلانك"
          placeholderTextColor="#9ca3af"
          value={adTitle}
          onChangeText={setAdTitle}
        />

        <Text style={styles.inputLabel}>وصف الإعلان *</Text>
        <TextInput
          style={[styles.formInput, styles.textArea]}
          placeholder="اكتب وصفاً جذاباً لإعلانك"
          placeholderTextColor="#9ca3af"
          value={adDescription}
          onChangeText={setAdDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.inputLabel}>رابط الموقع (اختياري)</Text>
        <TextInput
          style={styles.formInput}
          placeholder="https://example.com"
          placeholderTextColor="#9ca3af"
          value={adUrl}
          onChangeText={setAdUrl}
          keyboardType="url"
        />

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={submitAd}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>إرسال الإعلان</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pricing Info */}
      <View style={styles.pricingCard}>
        <Text style={styles.pricingTitle}>باقات الإعلانات</Text>
        <View style={styles.pricingItem}>
          <Text style={styles.pricingName}>أساسية</Text>
          <Text style={styles.pricingPrice}>50 ر.س</Text>
        </View>
        <View style={styles.pricingItem}>
          <Text style={styles.pricingName}>متميزة</Text>
          <Text style={styles.pricingPrice}>150 ر.س</Text>
        </View>
        <View style={styles.pricingItem}>
          <Text style={styles.pricingName}>احترافية</Text>
          <Text style={styles.pricingPrice}>300 ر.س</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// ============ LOGIN PAGE ============
const LoginPage = ({ onLogin, onGuestMode, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    
    setIsLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email, password }
        : { email, password, name };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await AsyncStorage.setItem('user_token', data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        Alert.alert('خطأ', data.detail || (isLogin ? 'فشل تسجيل الدخول' : 'فشل إنشاء الحساب'));
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f23']} style={styles.loginContainer}>
      <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.loginContent}>
          <Text style={styles.logo}>🦅</Text>
          <Text style={styles.appName}>صقر</Text>
          <Text style={styles.tagline}>شاهد واكسب</Text>
          
          {/* Toggle */}
          <View style={styles.authToggle}>
            <TouchableOpacity 
              style={[styles.authToggleBtn, isLogin && styles.authToggleBtnActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.authToggleText, isLogin && styles.authToggleTextActive]}>دخول</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.authToggleBtn, !isLogin && styles.authToggleBtnActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.authToggleText, !isLogin && styles.authToggleTextActive]}>تسجيل</Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <TextInput
              style={styles.authInput}
              placeholder="الاسم"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={name}
              onChangeText={setName}
            />
          )}
          
          <TextInput
            style={styles.authInput}
            placeholder="البريد الإلكتروني"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.authInput}
            placeholder="كلمة المرور"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.authButton} onPress={handleSubmit} disabled={isLoading}>
            <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.authButtonGradient}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.authButtonText}>{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.guestButton} onPress={onGuestMode}>
            <Text style={styles.guestButtonText}>الدخول كزائر</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  const [showAIChat, setShowAIChat] = useState(false);
  const [ads, setAds] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
      
      await Promise.all([loadAds(), loadSettings()]);
    } catch (error) {
      console.log('Init failed');
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

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/public/rewards`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.log('Failed to load settings');
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_data');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const handlePointsEarned = (points) => {
    if (user && !user.is_guest) {
      setUser(prev => ({ ...prev, points: (prev.points || 0) + points }));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>🦅</Text>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
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
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onGuestMode={handleGuestMode} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f23']} style={styles.mainContent}>
        {currentPage === 'home' && (
          <HomePage 
            user={user} 
            settings={settings}
            onNavigateToAds={() => setShowAdsViewer(true)} 
          />
        )}
        {currentPage === 'profile' && (
          <ProfilePage 
            user={user} 
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
          />
        )}
        {currentPage === 'advertiser' && (
          <AdvertiserPage user={user} />
        )}
      </LinearGradient>
      
      {/* AI Chat Button */}
      <TouchableOpacity style={styles.aiButton} onPress={() => setShowAIChat(true)}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.aiButtonGradient}>
          <Text style={styles.aiButtonText}>{Icons.ai}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* AI Chat Modal */}
      <AIChatModal 
        visible={showAIChat} 
        onClose={() => setShowAIChat(false)}
        user={user}
      />
      
      {/* Bottom Nav - Gray Icons */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setCurrentPage('home')}
        >
          <Text style={[styles.navIcon, currentPage === 'home' && styles.navIconActive]}>{Icons.home}</Text>
          <Text style={[styles.navLabel, currentPage === 'home' && styles.navLabelActive]}>الرئيسية</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setCurrentPage('advertiser')}
        >
          <Text style={[styles.navIcon, currentPage === 'advertiser' && styles.navIconActive]}>{Icons.advertise}</Text>
          <Text style={[styles.navLabel, currentPage === 'advertiser' && styles.navLabelActive]}>أعلن</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setCurrentPage('profile')}
        >
          <Text style={[styles.navIcon, currentPage === 'profile' && styles.navIconActive]}>{Icons.profile}</Text>
          <Text style={[styles.navLabel, currentPage === 'profile' && styles.navLabelActive]}>حسابي</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemHighlight]}
          onPress={() => setShowAdsViewer(true)}
        >
          <Text style={styles.navIconHighlight}>{Icons.ads}</Text>
          <Text style={styles.navLabelHighlight}>إعلانات</Text>
        </TouchableOpacity>
      </View>
      
      <StatusBar style="light" />
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  mainContent: { flex: 1, paddingBottom: 80 },
  
  // Loading
  loadingContainer: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { fontSize: 80, marginBottom: 20 },
  loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 16, fontSize: 16 },
  
  // Login
  loginContainer: { flex: 1 },
  loginScroll: { flexGrow: 1, justifyContent: 'center' },
  loginContent: { padding: 24, alignItems: 'center' },
  logo: { fontSize: 100, marginBottom: 8 },
  appName: { fontSize: 48, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  tagline: { fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 40 },
  authToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, marginBottom: 24, width: '100%' },
  authToggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  authToggleBtnActive: { backgroundColor: '#6366f1' },
  authToggleText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  authToggleTextActive: { color: '#FFF', fontWeight: 'bold' },
  authInput: { width: '100%', height: 56, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, marginBottom: 12, fontSize: 16, color: '#FFF' },
  authButton: { width: '100%', marginTop: 8 },
  authButtonGradient: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  authButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  guestButton: { marginTop: 24, padding: 12 },
  guestButtonText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  
  // Home Page
  homePage: { flex: 1 },
  homeContent: { padding: 20, paddingTop: 60 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcomeText: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  subText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  pointsBadge: { backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pointsBadgeText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 16 },
  
  balanceCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
  balanceContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balanceAmount: { color: '#FFF', fontSize: 44, fontWeight: 'bold', marginTop: 4 },
  balancePoints: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  balanceIcon: { width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  balanceIconText: { fontSize: 28, color: '#FFF' },
  
  watchButton: { borderRadius: 20, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  watchButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  playIconCircle: { width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  playIconText: { fontSize: 24, color: '#FFF' },
  watchButtonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  watchButtonSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  arrowText: { color: '#FFF', fontSize: 32 },
  
  statsCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 20 },
  statsTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, alignItems: 'center' },
  statIcon: { fontSize: 24, color: '#9ca3af', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  
  challengeCard: { backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', borderRadius: 20, padding: 20, marginBottom: 20 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  challengeIcon: { fontSize: 32 },
  challengeTitle: { color: '#fbbf24', fontWeight: 'bold', fontSize: 16 },
  challengeName: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  challengeDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 12 },
  challengeProgress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  challengeProgressBar: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4 },
  challengeProgressFill: { height: 8, backgroundColor: '#fbbf24', borderRadius: 4 },
  challengeReward: { color: '#fbbf24', fontWeight: 'bold', fontSize: 14 },
  
  tipCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  tipIcon: { fontSize: 28 },
  tipText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  
  howToCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 20 },
  howToTitle: { color: '#FFF', fontWeight: 'bold', marginBottom: 12, fontSize: 16 },
  howToItem: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 },
  
  // Profile Page
  profilePage: { flex: 1 },
  profileContent: { padding: 20, paddingTop: 60 },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  profileAvatarText: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  profileName: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  profileEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  profileStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  profileStatCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, alignItems: 'center' },
  profileStatValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  profileStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  menuSection: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  menuIcon: { fontSize: 20, color: '#9ca3af', width: 32 },
  menuText: { flex: 1, color: '#FFF', fontSize: 16 },
  menuArrow: { fontSize: 20, color: '#9ca3af' },
  logoutItem: { borderBottomWidth: 0 },
  logoutIcon: { color: '#ef4444' },
  logoutText: { color: '#ef4444' },
  logoutArrow: { color: '#ef4444' },
  
  // Advertiser Page
  advertiserPage: { flex: 1 },
  advertiserContent: { padding: 20, paddingTop: 60 },
  advertiserTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  advertiserSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 24 },
  adForm: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 20 },
  inputLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  formInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, color: '#FFF', fontSize: 16, marginBottom: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  pricingCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 },
  pricingTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  pricingItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  pricingName: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  pricingPrice: { color: '#6366f1', fontSize: 16, fontWeight: 'bold' },
  
  // Full Screen Ads
  fullScreenContainer: { flex: 1, backgroundColor: '#000' },
  adContent: { flex: 1 },
  adTouchable: { flex: 1 },
  video: { flex: 1 },
  adPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  adTitle: { color: '#FFF', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  adDescription: { color: 'rgba(255,255,255,0.8)', fontSize: 18, textAlign: 'center' },
  noAdsText: { color: '#FFF', fontSize: 18, textAlign: 'center', marginTop: 100 },
  backButton: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, marginTop: 20, marginHorizontal: 40 },
  backButtonText: { color: '#FFF', fontSize: 16, textAlign: 'center' },
  
  progressBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressFill: { height: 3, backgroundColor: '#fbbf24' },
  
  topControls: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muteBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  muteBtnText: { color: '#FFF', fontSize: 18 },
  timerBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  timerText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  timerComplete: { color: '#fbbf24', fontSize: 14, fontWeight: '600' },
  
  adInfoContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  adInfoGradient: { padding: 20, paddingTop: 80, paddingBottom: 40 },
  advertiserRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  advertiserAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  advertiserInfo: { flex: 1 },
  advertiserName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  advertiserHandle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  adInfoTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  adInfoDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 },
  visitButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 14, alignItems: 'center' },
  visitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  
  pointsAnimation: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  pointsAnimationText: { color: '#fbbf24', fontSize: 56, fontWeight: 'bold' },
  
  earnedPointsContainer: { position: 'absolute', bottom: 24, alignSelf: 'center' },
  earnedPointsText: { backgroundColor: 'rgba(251,191,36,0.9)', color: '#000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, fontWeight: 'bold', fontSize: 16 },
  
  // AI Button
  aiButton: { position: 'absolute', right: 16, bottom: 100, zIndex: 100 },
  aiButtonGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  aiButtonText: { color: '#FFF', fontSize: 24 },
  
  // AI Chat Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatContainer: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 20 },
  chatTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  messagesContainer: { flex: 1, padding: 16 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#6366f1' },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)' },
  messageText: { fontSize: 16, lineHeight: 22 },
  userMessageText: { color: '#FFF' },
  assistantMessageText: { color: '#FFF' },
  loadingMessage: { alignSelf: 'flex-start', padding: 12 },
  inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', alignItems: 'flex-end' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, color: '#FFF', fontSize: 16, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, backgroundColor: '#6366f1', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#FFF', fontSize: 18 },
  
  // Bottom Nav - Gray Icons
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0f0f23', paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navIcon: { fontSize: 24, color: '#6b7280' },
  navIconActive: { color: '#FFF' },
  navLabel: { fontSize: 11, color: '#6b7280' },
  navLabelActive: { color: '#FFF' },
  navItemHighlight: { backgroundColor: '#ef4444', marginHorizontal: 12, borderRadius: 16, paddingVertical: 8 },
  navIconHighlight: { fontSize: 24, color: '#FFF' },
  navLabelHighlight: { fontSize: 11, color: '#FFF', fontWeight: '600' },
});
