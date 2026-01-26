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
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_URL = 'https://rewardviewer-2.preview.emergentagent.com/api';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [watchTime, setWatchTime] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [todayStats, setTodayStats] = useState({ views: 0, remaining: 50 });
  const [loading, setLoading] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  
  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkLogin();
  }, []);

  // Watch timer effect
  useEffect(() => {
    let timer;
    if (isWatching && screen === 'home') {
      timer = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          // Update progress animation
          Animated.timing(progressAnim, {
            toValue: newTime / 30,
            duration: 900,
            useNativeDriver: false
          }).start();
          
          if (newTime >= 30) {
            completeAdWatch();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isWatching, screen]);

  const checkLogin = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('saqr_token');
      const savedUser = await AsyncStorage.getItem('saqr_user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setScreen('home');
        fetchUserStats(savedToken);
      } else {
        setScreen('login');
      }
    } catch (e) {
      setScreen('login');
    }
  };

  const fetchUserStats = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/rewarded-ads/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTodayStats(data.today || { views: 0, remaining: 50 });
      }
    } catch (e) {
      console.log('Stats fetch error:', e);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد وكلمة المرور');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await AsyncStorage.setItem('saqr_token', data.token);
        await AsyncStorage.setItem('saqr_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setScreen('home');
        fetchUserStats(data.token);
      } else {
        Alert.alert('خطأ', data.detail || 'فشل تسجيل الدخول');
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await AsyncStorage.setItem('saqr_token', data.token);
        await AsyncStorage.setItem('saqr_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setScreen('home');
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
    setScreen('home');
  };

  const startWatching = () => {
    if (todayStats.remaining <= 0 && !user?.isGuest) {
      Alert.alert('تنبيه', 'وصلت للحد اليومي من المشاهدات');
      return;
    }
    setIsWatching(true);
    setWatchTime(0);
    progressAnim.setValue(0);
  };

  const completeAdWatch = async () => {
    setIsWatching(false);
    progressAnim.setValue(0);
    
    // For guests, just update local points
    if (user?.isGuest) {
      const newPoints = (user.points || 0) + 5;
      const updatedUser = { ...user, points: newPoints };
      setUser(updatedUser);
      await AsyncStorage.setItem('saqr_user', JSON.stringify(updatedUser));
      Alert.alert('مبروك! 🎉', 'حصلت على 5 نقاط!');
      return;
    }
    
    // For registered users, call API
    try {
      const response = await fetch(`${API_URL}/rewarded-ads/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ad_type: 'personal',
          completed: true,
          watch_duration: 30
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(prev => ({ ...prev, points: data.total_points }));
        await AsyncStorage.setItem('saqr_user', JSON.stringify({ ...user, points: data.total_points }));
        fetchUserStats(token);
        Alert.alert('مبروك! 🎉', data.message);
      } else {
        Alert.alert('تنبيه', data.message || 'حدث خطأ');
      }
    } catch (e) {
      // Offline fallback
      const newPoints = (user.points || 0) + 5;
      const updatedUser = { ...user, points: newPoints };
      setUser(updatedUser);
      await AsyncStorage.setItem('saqr_user', JSON.stringify(updatedUser));
      Alert.alert('مبروك! 🎉', 'حصلت على 5 نقاط!');
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['saqr_token', 'saqr_user']);
    setToken(null);
    setUser(null);
    setScreen('login');
    setEmail('');
    setPassword('');
    setName('');
  };

  // Loading Screen
  if (screen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>صقر</Text>
        <ActivityIndicator size="large" color="#FFFFFF" />
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
        <Text style={styles.loginSubtitle}>شاهد واكسب النقاط</Text>
        
        <View style={styles.formContainer}>
          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="الاسم"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={isRegister ? handleRegister : handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#4F46E5" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.switchText}>
              {isRegister ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ أنشئ واحداً'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.dividerLine} />
        </View>
        
        <TouchableOpacity style={styles.guestButton} onPress={guestLogin}>
          <Text style={styles.guestButtonText}>دخول كزائر</Text>
        </TouchableOpacity>
        
        <Text style={styles.loginInfo}>500 نقطة = 1 دولار</Text>
      </View>
    );
  }

  // Home Screen
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>خروج</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>صقر</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{user?.points || 0} ⭐</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>مرحباً {user?.name || 'زائر'}!</Text>
          {user?.isGuest && (
            <Text style={styles.guestNote}>سجل للحفاظ على نقاطك</Text>
          )}
        </View>

        {/* Ad Viewer */}
        <View style={styles.adCard}>
          {isWatching ? (
            <>
              <View style={styles.adPlaceholder}>
                <Text style={styles.adText}>جاري عرض الإعلان...</Text>
                <Text style={styles.timerText}>{30 - watchTime} ثانية</Text>
              </View>
              <View style={styles.progressContainer}>
                <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
              </View>
              <Text style={styles.watchHint}>استمر بالمشاهدة للحصول على 5 نقاط</Text>
            </>
          ) : (
            <>
              <View style={styles.adPlaceholder}>
                <Text style={styles.adIcon}>▶️</Text>
                <Text style={styles.adReadyText}>إعلان جاهز للمشاهدة</Text>
              </View>
              <TouchableOpacity style={styles.watchButton} onPress={startWatching}>
                <Text style={styles.watchButtonText}>شاهد واكسب 5 نقاط</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.points || 0}</Text>
            <Text style={styles.statLabel}>نقاطك</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${((user?.points || 0) / 500).toFixed(2)}</Text>
            <Text style={styles.statLabel}>رصيدك</Text>
          </View>
        </View>

        {/* Daily Stats (for registered users) */}
        {!user?.isGuest && (
          <View style={styles.dailyCard}>
            <Text style={styles.dailyTitle}>إحصائيات اليوم</Text>
            <Text style={styles.dailyText}>المشاهدات: {todayStats.views}</Text>
            <Text style={styles.dailyText}>المتبقي: {todayStats.remaining}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>كيف تكسب؟</Text>
          <Text style={styles.infoText}>• شاهد إعلان لمدة 30 ثانية = 5 نقاط</Text>
          <Text style={styles.infoText}>• 500 نقطة = 1 دولار</Text>
          <Text style={styles.infoText}>• الحد اليومي: 50 مشاهدة</Text>
        </View>

        {/* Withdraw Button */}
        {(user?.points || 0) >= 500 && !user?.isGuest && (
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>اسحب أرباحك 💰</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginLogo: {
    fontSize: 70,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  loginSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: 15,
    fontSize: 14,
  },
  guestButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  guestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginInfo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 25,
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  guestNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
  adCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  adPlaceholder: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  adText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  timerText: {
    color: '#10B981',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
  },
  adIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  adReadyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  watchHint: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
  },
  watchButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  dailyCard: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  dailyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 8,
    textAlign: 'right',
  },
  dailyText: {
    fontSize: 14,
    color: '#4338CA',
    textAlign: 'right',
    marginBottom: 3,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    textAlign: 'right',
  },
  withdrawButton: {
    backgroundColor: '#4F46E5',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
