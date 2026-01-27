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
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';

// ============ CONFIGURATION ============
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://saqr-ads-1.preview.emergentagent.com';
const { width, height } = Dimensions.get('window');

const REQUIRED_WATCH_TIME = 30;
const POINTS_PER_AD = 5;

// إعلانات تجريبية مدمجة
const DEMO_ADS = [
  {
    id: 'demo1',
    title: 'إعلان سامسونج الجديد',
    description: 'اكتشف هاتف سامسونج الجديد مع تقنية الذكاء الاصطناعي',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    advertiser: 'Samsung',
    website_url: 'https://www.samsung.com/sa/',
  },
  {
    id: 'demo2',
    title: 'عرض خاص من أمازون',
    description: 'تخفيضات تصل إلى 50% على جميع المنتجات',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400',
    advertiser: 'Amazon',
    website_url: 'https://www.amazon.sa/',
  },
  {
    id: 'demo3',
    title: 'مطعم الذواقة',
    description: 'وجبات شهية وعروض حصرية لفترة محدودة',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    advertiser: 'Gourmet Restaurant',
    website_url: 'https://example.com/restaurant',
  },
];

// باقات الإعلان الصحيحة
const AD_PACKAGES = [
  { id: 'ad_1_month', name: 'شهر واحد', duration: 1, price: 99, currency: 'SAR', features: ['1000 مشاهدة مضمونة', 'تقرير أداء أسبوعي'] },
  { id: 'ad_3_months', name: '3 أشهر', duration: 3, price: 249, currency: 'SAR', features: ['5000 مشاهدة مضمونة', 'تقرير أداء يومي', 'أولوية في العرض'], popular: true },
  { id: 'ad_6_months', name: '6 أشهر', duration: 6, price: 449, currency: 'SAR', features: ['15000 مشاهدة مضمونة', 'تقرير أداء مفصل', 'أولوية قصوى', 'دعم مخصص'] },
];

// ============ AI CHAT MODAL ============
const AIChatModal = ({ visible, onClose, user }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي في تطبيق صقر. كيف يمكنني مساعدتك اليوم؟ 🦅' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('user_token');
      const endpoint = token ? '/api/ai/chat' : '/api/ai/guest-chat';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMessage })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response || data.message || 'تم استلام رسالتك!'
        }]);
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى لاحقاً. تأكد من اتصالك بالإنترنت.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={onClose} style={styles.chatCloseBtn}>
              <Text style={styles.chatCloseBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.chatTitle}>المساعد الذكي 🤖</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            ref={scrollRef}
            style={styles.messagesContainer} 
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
          >
            {messages.map((msg, idx) => (
              <View key={idx} style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userMessage : styles.assistantMessage
              ]}>
                <Text style={styles.messageText}>{msg.content}</Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            )}
          </ScrollView>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor="#9ca3af"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Text style={styles.sendBtnText}>➤</Text>
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
  const pointsScale = useRef(new Animated.Value(1)).current;
  const videoRef = useRef(null);
  const watchTimerRef = useRef(null);

  const allAds = ads && ads.length > 0 ? ads : DEMO_ADS;

  useEffect(() => {
    startWatching();
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, [currentIndex]);

  useEffect(() => {
    if (showControls || showAdInfo) {
      Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      const timer = setTimeout(() => {
        Animated.timing(controlsOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
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
      Animated.spring(pointsScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(pointsScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    
    Vibration.vibrate([100, 100, 100]);
    setTimeout(() => setShowPointsAnimation(false), 2000);
    
    if (onPointsEarned) onPointsEarned(points);
    
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        await fetch(`${API_URL}/api/rewarded-ads/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ad_type: 'video', ad_id: allAds[currentIndex]?.id, completed: true, watch_duration: REQUIRED_WATCH_TIME })
        });
      }
    } catch (e) {}
  };

  const goToNext = () => {
    if (currentIndex < allAds.length - 1) {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      Animated.timing(translateY, { toValue: -height, duration: 300, useNativeDriver: true }).start(() => {
        setCurrentIndex(prev => prev + 1);
        translateY.setValue(0);
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      Animated.timing(translateY, { toValue: height, duration: 300, useNativeDriver: true }).start(() => {
        setCurrentIndex(prev => prev - 1);
        translateY.setValue(0);
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 || Math.abs(g.dx) > 50,
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 80) onClose();
        else if (g.dy < -50) goToNext();
        else if (g.dy > 50) goToPrevious();
      }
    })
  ).current;

  const handleTap = () => { setShowControls(true); setShowAdInfo(true); };

  const currentAd = allAds[currentIndex];
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
          ) : currentAd.thumbnail_url ? (
            <Image source={{ uri: currentAd.thumbnail_url }} style={styles.video} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.adPlaceholder}>
              <Text style={styles.adPlaceholderTitle}>{currentAd.title}</Text>
              <Text style={styles.adPlaceholderDesc}>{currentAd.description}</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>

      {/* Top Controls */}
      <Animated.View style={[styles.topControls, { opacity: controlsOpacity }]}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setIsMuted(!isMuted)}>
          <Text style={styles.controlBtnText}>{isMuted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
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
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.adInfoGradient}>
          <View style={styles.advertiserRow}>
            <View style={styles.advertiserAvatar}>
              <Text style={styles.avatarText}>{(currentAd.advertiser || 'A')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.advertiserInfo}>
              <Text style={styles.advertiserName}>{currentAd.advertiser || 'معلن'}</Text>
              <Text style={styles.advertiserHandle}>@{(currentAd.advertiser || 'advertiser').toLowerCase().replace(/\s/g, '_')}</Text>
            </View>
          </View>
          <Text style={styles.adInfoTitle}>{currentAd.title}</Text>
          <Text style={styles.adInfoDesc} numberOfLines={2}>{currentAd.description}</Text>
          {currentAd.website_url && (
            <TouchableOpacity style={styles.visitButton} onPress={() => Linking.openURL(currentAd.website_url)}>
              <Text style={styles.visitButtonText}>🌐 زيارة الموقع</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Points Animation */}
      {showPointsAnimation && (
        <View style={styles.pointsAnimation}>
          <Animated.Text style={[styles.pointsAnimationText, { transform: [{ scale: pointsScale }] }]}>+{POINTS_PER_AD} ⭐</Animated.Text>
        </View>
      )}

      {/* Earned Points Badge */}
      {earnedPoints > 0 && !showAdInfo && (
        <View style={styles.earnedBadge}><Text style={styles.earnedBadgeText}>⭐ {earnedPoints}</Text></View>
      )}

      {/* Swipe Hints */}
      <View style={styles.swipeHints}>
        {currentIndex > 0 && <Text style={styles.swipeHintText}>⬆</Text>}
        <View style={{ flex: 1 }} />
        {currentIndex < allAds.length - 1 && <Text style={styles.swipeHintText}>⬇</Text>}
      </View>
    </View>
  );
};

// ============ HOME PAGE ============
const HomePage = ({ user, settings, onNavigateToAds }) => {
  const [currentTip, setCurrentTip] = useState(0);
  const tips = ['💡 شاهد 10 إعلانات = 50 نقطة!', '🎯 كل 500 نقطة = 1 دولار', '⚡ أكمل التحديات للمزيد!', '🏆 تحدى نفسك يومياً', '🎁 مكافآت يومية للنشطين'];

  useEffect(() => {
    const interval = setInterval(() => setCurrentTip(prev => (prev + 1) % tips.length), 4000);
    return () => clearInterval(interval);
  }, []);

  const userPoints = user?.points || 0;
  const pointsPerDollar = settings?.points_per_dollar || 500;
  const userBalance = (userPoints / pointsPerDollar).toFixed(2);
  const pointsPerAd = settings?.points_per_ad || 5;
  const dailyLimit = settings?.daily_limit || 50;
  const watchedToday = user?.watched_today || 0;

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>مرحباً {user?.name || 'صديقي'} 👋</Text>
          <Text style={styles.subText}>جاهز لكسب المزيد اليوم؟</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>{userPoints} ⭐</Text>
        </View>
      </View>

      {/* Balance Card */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
          <Text style={styles.balanceAmount}>${userBalance}</Text>
          <Text style={styles.balancePoints}>{userPoints} نقطة • {pointsPerDollar} نقطة/دولار</Text>
        </View>
        <View style={styles.balanceIcon}><Text style={styles.balanceIconText}>📈</Text></View>
      </LinearGradient>

      {/* Start Watching Button */}
      <TouchableOpacity onPress={onNavigateToAds} activeOpacity={0.9}>
        <LinearGradient colors={['#ef4444', '#ec4899']} style={styles.watchButton}>
          <View style={styles.watchButtonLeft}>
            <View style={styles.playIcon}><Text style={styles.playIconText}>▶️</Text></View>
            <View>
              <Text style={styles.watchButtonTitle}>ابدأ المشاهدة الآن</Text>
              <Text style={styles.watchButtonSub}>اكسب {pointsPerAd} نقاط لكل إعلان</Text>
            </View>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>📊 إحصائياتك</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}><Text style={styles.statValue}>{watchedToday}</Text><Text style={styles.statLabel}>اليوم</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{dailyLimit - watchedToday}</Text><Text style={styles.statLabel}>المتبقي</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{pointsPerAd}</Text><Text style={styles.statLabel}>نقاط/إعلان</Text></View>
        </View>
      </View>

      {/* Daily Challenge */}
      <View style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeIcon}>🎯</Text>
          <View><Text style={styles.challengeTitle}>التحدي اليومي</Text><Text style={styles.challengeName}>شاهد 5 إعلانات</Text></View>
        </View>
        <View style={styles.progressBarSmall}><View style={[styles.progressFillSmall, { width: `${Math.min((watchedToday / 5) * 100, 100)}%` }]} /></View>
        <Text style={styles.challengeReward}>المكافأة: +25 ⭐</Text>
      </View>

      {/* Tips */}
      <View style={styles.tipCard}><Text style={styles.tipText}>{tips[currentTip]}</Text></View>

      {/* How to Earn */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>💰 كيف تكسب؟</Text>
        <Text style={styles.infoItem}>✓ شاهد إعلان كامل = {pointsPerAd} نقاط</Text>
        <Text style={styles.infoItem}>✓ أكمل التحدي اليومي = مكافأة إضافية</Text>
        <Text style={styles.infoItem}>✓ {pointsPerDollar} نقطة = $1 دولار</Text>
      </View>
    </ScrollView>
  );
};

// ============ PROFILE PAGE ============
const ProfilePage = ({ user, onLogout, onNavigate }) => {
  const userPoints = user?.points || 0;
  const totalEarned = user?.total_earned || userPoints;

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text></View>
        <Text style={styles.profileName}>{user?.name || 'مستخدم'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        {user?.isGuest && <View style={styles.guestBadge}><Text style={styles.guestBadgeText}>زائر</Text></View>}
      </View>

      <View style={styles.profileStats}>
        <View style={styles.profileStatItem}><Text style={styles.profileStatValue}>{userPoints}</Text><Text style={styles.profileStatLabel}>نقاط حالية</Text></View>
        <View style={styles.profileStatItem}><Text style={styles.profileStatValue}>{totalEarned}</Text><Text style={styles.profileStatLabel}>إجمالي مكتسب</Text></View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('withdraw')}>
          <Text style={styles.menuIcon}>💸</Text><Text style={styles.menuText}>سحب الأرباح</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📊</Text><Text style={styles.menuText}>سجل المعاملات</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⚙️</Text><Text style={styles.menuText}>الإعدادات</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text><Text style={styles.menuText}>المساعدة والدعم</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={onLogout}>
          <Text style={styles.menuIcon}>🚪</Text><Text style={[styles.menuText, styles.logoutText]}>تسجيل الخروج</Text><Text style={[styles.menuArrow, styles.logoutText]}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ============ ADVERTISER PAGE - COMPLETE ============
const AdvertiserPage = ({ user }) => {
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', website: '', title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.name || !formData.email) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    if (!selectedPackage) {
      Alert.alert('خطأ', 'يرجى اختيار باقة');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const response = await fetch(`${API_URL}/api/advertiser/create-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        body: JSON.stringify({
          advertiser_name: formData.name,
          advertiser_email: formData.email,
          advertiser_phone: formData.phone,
          website_url: formData.website,
          title: formData.title,
          description: formData.description,
          package_id: selectedPackage.id,
          duration_months: selectedPackage.duration
        })
      });

      if (response.ok) {
        setStep(3);
      } else {
        Alert.alert('خطأ', 'فشل إرسال الإعلان');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <View style={styles.successPage}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>تم إرسال إعلانك!</Text>
        <Text style={styles.successDesc}>سيتم مراجعة إعلانك وتفعيله خلال 24 ساعة. سنتواصل معك عبر البريد الإلكتروني.</Text>
        <TouchableOpacity style={styles.successButton} onPress={() => { setStep(1); setFormData({ name: '', email: '', phone: '', website: '', title: '', description: '' }); setSelectedPackage(null); }}>
          <Text style={styles.successButtonText}>إنشاء إعلان جديد</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
      <Text style={styles.pageTitle}>أعلن معنا 📢</Text>
      <Text style={styles.pageSubtitle}>وصل إعلانك لآلاف المستخدمين النشطين</Text>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}><Text style={styles.stepDotText}>1</Text></View>
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}><Text style={styles.stepDotText}>2</Text></View>
      </View>

      {step === 1 && (
        <>
          {/* Packages */}
          <Text style={styles.sectionTitle}>اختر الباقة المناسبة</Text>
          {AD_PACKAGES.map(pkg => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.packageCard, selectedPackage?.id === pkg.id && styles.packageCardSelected, pkg.popular && styles.packageCardPopular]}
              onPress={() => setSelectedPackage(pkg)}
            >
              {pkg.popular && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>الأكثر شعبية</Text></View>}
              <View style={styles.packageHeader}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packagePrice}>{pkg.price} {pkg.currency}</Text>
              </View>
              <View style={styles.packageFeatures}>
                {pkg.features.map((f, i) => <Text key={i} style={styles.packageFeature}>✓ {f}</Text>)}
              </View>
              {selectedPackage?.id === pkg.id && <View style={styles.selectedCheck}><Text style={styles.selectedCheckText}>✓</Text></View>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={[styles.nextButton, !selectedPackage && styles.nextButtonDisabled]} 
            onPress={() => selectedPackage && setStep(2)}
            disabled={!selectedPackage}
          >
            <Text style={styles.nextButtonText}>التالي</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.sectionTitle}>بيانات الإعلان</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>اسمك / اسم الشركة *</Text>
            <TextInput style={styles.input} placeholder="أدخل اسمك" placeholderTextColor="#9ca3af" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />
            
            <Text style={styles.inputLabel}>البريد الإلكتروني *</Text>
            <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor="#9ca3af" value={formData.email} onChangeText={t => setFormData({...formData, email: t})} keyboardType="email-address" autoCapitalize="none" />
            
            <Text style={styles.inputLabel}>رقم الهاتف</Text>
            <TextInput style={styles.input} placeholder="+966 5XX XXX XXXX" placeholderTextColor="#9ca3af" value={formData.phone} onChangeText={t => setFormData({...formData, phone: t})} keyboardType="phone-pad" />
            
            <Text style={styles.inputLabel}>رابط الموقع</Text>
            <TextInput style={styles.input} placeholder="https://yourwebsite.com" placeholderTextColor="#9ca3af" value={formData.website} onChangeText={t => setFormData({...formData, website: t})} keyboardType="url" autoCapitalize="none" />
            
            <Text style={styles.inputLabel}>عنوان الإعلان *</Text>
            <TextInput style={styles.input} placeholder="عنوان جذاب لإعلانك" placeholderTextColor="#9ca3af" value={formData.title} onChangeText={t => setFormData({...formData, title: t})} />
            
            <Text style={styles.inputLabel}>وصف الإعلان *</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="اكتب وصفاً تفصيلياً لإعلانك" placeholderTextColor="#9ca3af" value={formData.description} onChangeText={t => setFormData({...formData, description: t})} multiline numberOfLines={4} textAlignVertical="top" />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
              <Text style={styles.backButtonText}>‹ رجوع</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>إرسال الإعلان</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

// ============ LOGIN PAGE ============
const LoginPage = ({ onLogin, onGuestMode }) => {
  const [mode, setMode] = useState('main'); // main, login, register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    
    setIsLoading(true);
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/signin';
      const body = mode === 'register' ? { email, password, name } : { email, password };

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
        Alert.alert('خطأ', data.detail || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = 'https://saqr-ads-1.preview.emergentagent.com/';
    Linking.openURL(`https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  const handleAppleLogin = () => {
    Alert.alert('قريباً', 'تسجيل الدخول بـ Apple متاح فقط في تطبيق iOS على App Store');
  };

  if (mode === 'main') {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f23']} style={styles.loginContainer}>
        <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.loginContent}>
            <Text style={styles.logo}>🦅</Text>
            <Text style={styles.appName}>صقر</Text>
            <Text style={styles.tagline}>شاهد الإعلانات واكسب المال</Text>
            
            {/* Google Login */}
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialText}>الدخول بحساب Google</Text>
            </TouchableOpacity>

            {/* Apple Login */}
            <TouchableOpacity style={[styles.socialButton, styles.appleButton]} onPress={handleAppleLogin}>
              <Text style={styles.socialIcon}></Text>
              <Text style={styles.socialText}>الدخول بحساب Apple</Text>
            </TouchableOpacity>

            <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>أو</Text><View style={styles.dividerLine} /></View>

            {/* Email Login */}
            <TouchableOpacity style={styles.emailButton} onPress={() => setMode('login')}>
              <Text style={styles.emailIcon}>✉️</Text>
              <Text style={styles.emailText}>الدخول بالبريد الإلكتروني</Text>
            </TouchableOpacity>

            {/* Register */}
            <TouchableOpacity style={styles.registerLink} onPress={() => setMode('register')}>
              <Text style={styles.registerLinkText}>ليس لديك حساب؟ <Text style={styles.registerLinkBold}>سجل الآن</Text></Text>
            </TouchableOpacity>

            {/* Guest Mode */}
            <TouchableOpacity style={styles.guestButton} onPress={onGuestMode}>
              <Text style={styles.guestButtonText}>👤 الدخول كزائر</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f23']} style={styles.loginContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.loginScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.loginContent}>
            <TouchableOpacity style={styles.backLink} onPress={() => setMode('main')}>
              <Text style={styles.backLinkText}>‹ رجوع</Text>
            </TouchableOpacity>

            <Text style={styles.logo}>🦅</Text>
            <Text style={styles.formTitle}>{mode === 'register' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</Text>
            
            {mode === 'register' && (
              <TextInput
                style={styles.authInput}
                placeholder="الاسم الكامل"
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
            
            <TouchableOpacity style={styles.authSubmitButton} onPress={handleEmailAuth} disabled={isLoading}>
              <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.authSubmitGradient}>
                {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authSubmitText}>{mode === 'register' ? 'إنشاء الحساب' : 'دخول'}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
              <Text style={styles.switchModeText}>
                {mode === 'register' ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ سجل الآن'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  useEffect(() => { initApp(); }, []);

  const initApp = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem('user_token'),
        AsyncStorage.getItem('user_data')
      ]);
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
      
      await Promise.all([loadAds(), loadSettings()]);
    } catch (error) {} 
    finally { setIsLoading(false); }
  };

  const loadAds = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ads`);
      if (response.ok) {
        const data = await response.json();
        setAds(data.length > 0 ? data : DEMO_ADS);
      } else {
        setAds(DEMO_ADS);
      }
    } catch (error) {
      setAds(DEMO_ADS);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/public/rewards`);
      if (response.ok) setSettings(await response.json());
    } catch (error) {}
  };

  const handleLogin = (userData) => { setUser(userData); setIsAuthenticated(true); };
  const handleGuestMode = () => { setUser({ name: 'زائر', points: 0, isGuest: true }); setIsAuthenticated(true); };
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['user_token', 'user_data']);
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
  };
  const handlePointsEarned = (points) => {
    if (user && !user.isGuest) setUser(prev => ({ ...prev, points: (prev.points || 0) + points }));
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
    return <FullScreenAdViewer ads={ads} onClose={() => setShowAdsViewer(false)} onPointsEarned={handlePointsEarned} user={user} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onGuestMode={handleGuestMode} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f0f23']} style={styles.mainArea}>
        {currentPage === 'home' && <HomePage user={user} settings={settings} onNavigateToAds={() => setShowAdsViewer(true)} />}
        {currentPage === 'profile' && <ProfilePage user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />}
        {currentPage === 'advertiser' && <AdvertiserPage user={user} />}
      </LinearGradient>
      
      {/* AI Chat Button */}
      <TouchableOpacity style={styles.aiFloatingButton} onPress={() => setShowAIChat(true)}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.aiFloatingButtonGradient}>
          <Text style={styles.aiFloatingButtonText}>🤖</Text>
        </LinearGradient>
      </TouchableOpacity>

      <AIChatModal visible={showAIChat} onClose={() => setShowAIChat(false)} user={user} />
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentPage('home')}>
          <Text style={[styles.navIcon, currentPage === 'home' && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navLabel, currentPage === 'home' && styles.navLabelActive]}>الرئيسية</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentPage('advertiser')}>
          <Text style={[styles.navIcon, currentPage === 'advertiser' && styles.navIconActive]}>📢</Text>
          <Text style={[styles.navLabel, currentPage === 'advertiser' && styles.navLabelActive]}>أعلن</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentPage('profile')}>
          <Text style={[styles.navIcon, currentPage === 'profile' && styles.navIconActive]}>👤</Text>
          <Text style={[styles.navLabel, currentPage === 'profile' && styles.navLabelActive]}>حسابي</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemAds]} onPress={() => setShowAdsViewer(true)}>
          <Text style={styles.navIconAds}>▶️</Text>
          <Text style={styles.navLabelAds}>إعلانات</Text>
        </TouchableOpacity>
      </View>
      
      <StatusBar style="light" />
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  mainArea: { flex: 1, paddingBottom: 85 },
  loadingContainer: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { fontSize: 80, marginBottom: 20 },
  loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 16, fontSize: 16 },

  // Login Page
  loginContainer: { flex: 1 },
  loginScroll: { flexGrow: 1, justifyContent: 'center' },
  loginContent: { padding: 24, alignItems: 'center' },
  logo: { fontSize: 100, marginBottom: 8 },
  appName: { fontSize: 48, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 40, textAlign: 'center' },
  
  socialButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, gap: 12 },
  appleButton: { backgroundColor: '#000' },
  socialIcon: { fontSize: 20, fontWeight: 'bold' },
  socialText: { fontSize: 16, fontWeight: '600', color: '#000' },
  
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { color: 'rgba(255,255,255,0.5)', marginHorizontal: 16 },
  
  emailButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, gap: 12 },
  emailIcon: { fontSize: 20 },
  emailText: { fontSize: 16, color: '#FFF' },
  
  registerLink: { marginTop: 20 },
  registerLinkText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  registerLinkBold: { color: '#6366f1', fontWeight: 'bold' },
  
  guestButton: { marginTop: 16, padding: 12 },
  guestButtonText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  
  backLink: { alignSelf: 'flex-start', marginBottom: 20, padding: 8 },
  backLinkText: { color: '#6366f1', fontSize: 18 },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 24 },
  authInput: { width: '100%', height: 56, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, marginBottom: 12, fontSize: 16, color: '#FFF', textAlign: 'right' },
  authSubmitButton: { width: '100%', marginTop: 8 },
  authSubmitGradient: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  authSubmitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  switchModeText: { color: 'rgba(255,255,255,0.6)', marginTop: 20, fontSize: 14 },

  // Pages
  page: { flex: 1 },
  pageContent: { padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcomeText: { fontSize: 26, fontWeight: 'bold', color: '#FFF' },
  subText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  pointsBadge: { backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pointsBadgeText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 16 },

  balanceCard: { borderRadius: 24, padding: 24, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balanceAmount: { color: '#FFF', fontSize: 42, fontWeight: 'bold', marginTop: 4 },
  balancePoints: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  balanceIcon: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  balanceIconText: { fontSize: 28 },

  watchButton: { borderRadius: 20, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  watchButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  playIcon: { width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  playIconText: { fontSize: 24 },
  watchButtonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  watchButtonSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  arrowIcon: { color: '#FFF', fontSize: 32 },

  statsCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  challengeCard: { backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', borderRadius: 20, padding: 20, marginBottom: 20 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  challengeIcon: { fontSize: 32 },
  challengeTitle: { color: '#fbbf24', fontWeight: 'bold', fontSize: 16 },
  challengeName: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  progressBarSmall: { height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, marginBottom: 8 },
  progressFillSmall: { height: 8, backgroundColor: '#fbbf24', borderRadius: 4 },
  challengeReward: { color: '#fbbf24', fontSize: 14, textAlign: 'center' },

  tipCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 20, alignItems: 'center' },
  tipText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },

  infoCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 20 },
  infoItem: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 },

  // Profile
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  profileAvatarText: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  profileName: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  profileEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  guestBadge: { backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  guestBadgeText: { color: '#fbbf24', fontSize: 12 },
  profileStats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  profileStatItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, alignItems: 'center' },
  profileStatValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  profileStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  menuSection: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  menuIcon: { fontSize: 20, width: 32 },
  menuText: { flex: 1, color: '#FFF', fontSize: 16 },
  menuArrow: { fontSize: 20, color: 'rgba(255,255,255,0.4)' },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: '#ef4444' },

  // Advertiser
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: '#6366f1' },
  stepDotText: { color: '#FFF', fontWeight: 'bold' },
  stepLine: { width: 60, height: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLineActive: { backgroundColor: '#6366f1' },

  packageCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  packageCardSelected: { borderColor: '#6366f1' },
  packageCardPopular: { borderColor: '#fbbf24' },
  popularBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: '#fbbf24', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  popularBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  packageName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  packagePrice: { color: '#6366f1', fontSize: 20, fontWeight: 'bold' },
  packageFeatures: { gap: 4 },
  packageFeature: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  selectedCheck: { position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderRadius: 12, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  selectedCheckText: { color: '#FFF', fontWeight: 'bold' },

  nextButton: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 16 },
  inputLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, color: '#FFF', fontSize: 16, marginBottom: 16, textAlign: 'right' },
  textArea: { height: 100, textAlignVertical: 'top' },

  buttonRow: { flexDirection: 'row', gap: 12 },
  backButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, alignItems: 'center' },
  backButtonText: { color: '#FFF', fontSize: 16 },
  submitBtn: { flex: 2, backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  successPage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { fontSize: 80, marginBottom: 20 },
  successTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  successDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  successButton: { backgroundColor: '#6366f1', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  successButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Full Screen Ads
  fullScreenContainer: { flex: 1, backgroundColor: '#000' },
  adContent: { flex: 1 },
  adTouchable: { flex: 1 },
  video: { flex: 1, width: '100%', height: '100%' },
  adPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  adPlaceholderTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  adPlaceholderDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center' },
  
  progressBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressFill: { height: 3, backgroundColor: '#fbbf24' },
  
  topControls: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  controlBtn: { width: 44, height: 44, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  controlBtnText: { fontSize: 20 },
  timerBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
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
  adInfoTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  adInfoDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 },
  visitButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 14, alignItems: 'center' },
  visitButtonText: { color: '#FFF', fontSize: 16 },

  pointsAnimation: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  pointsAnimationText: { color: '#fbbf24', fontSize: 56, fontWeight: 'bold' },
  earnedBadge: { position: 'absolute', bottom: 24, alignSelf: 'center' },
  earnedBadgeText: { backgroundColor: 'rgba(251,191,36,0.9)', color: '#000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, fontWeight: 'bold', fontSize: 16 },

  swipeHints: { position: 'absolute', right: 16, top: '30%', bottom: '30%', justifyContent: 'space-between', alignItems: 'center' },
  swipeHintText: { color: 'rgba(255,255,255,0.3)', fontSize: 24 },

  // AI Chat
  aiFloatingButton: { position: 'absolute', right: 16, bottom: 100 },
  aiFloatingButtonGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  aiFloatingButtonText: { fontSize: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatContainer: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  chatCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  chatCloseBtnText: { color: '#FFF', fontSize: 20 },
  chatTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  messagesContainer: { flex: 1, padding: 16 },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 16, marginBottom: 8 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  assistantMessage: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 4 },
  messageText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  chatInputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', alignItems: 'flex-end' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, color: '#FFF', fontSize: 16, maxHeight: 100, textAlign: 'right' },
  sendBtn: { width: 44, height: 44, backgroundColor: '#6366f1', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#FFF', fontSize: 18 },

  // Bottom Nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0f0f23', paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navIcon: { fontSize: 22, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  navLabelActive: { color: '#FFF' },
  navItemAds: { backgroundColor: '#ef4444', marginHorizontal: 8, borderRadius: 16, paddingVertical: 8 },
  navIconAds: { fontSize: 22 },
  navLabelAds: { fontSize: 11, color: '#FFF', fontWeight: '600' },
});
