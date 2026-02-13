// Auth Screen - Login / Register
// Professional Design with Ionicons
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

const AuthScreen = ({ onLogin }) => {
  const [mode, setMode] = useState('main'); // main, login, register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Guest login - تجربة بدون حساب
  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      // Create a guest user object
      const guestUser = {
        user_id: 'guest_' + Date.now(),
        email: 'guest@saqr.app',
        name: 'زائر',
        points: 0,
        total_earned: 0,
        is_guest: true
      };
      
      // Save guest data locally
      await storage.setUserData(guestUser);
      await storage.setToken('guest_token');
      
      onLogin(guestUser);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسمك');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      let data;

      if (mode === 'register') {
        response = await api.register(email, password, name);
        data = await response.json();
        
        if (response.ok && data.success) {
          // Auto login after registration
          const loginResponse = await api.login(email, password);
          const loginData = await loginResponse.json();
          if (loginResponse.ok) {
            await storage.setToken(loginData.token);
            await storage.setUserData(loginData.user);
            onLogin(loginData.user);
          } else {
            Alert.alert('خطأ', loginData.detail || 'فشل تسجيل الدخول بعد التسجيل');
          }
        } else if (data.detail && data.detail.includes('already')) {
          // Email exists - try to login instead
          Alert.alert(
            'الحساب موجود',
            'هذا البريد الإلكتروني مسجل مسبقاً. هل تريد تسجيل الدخول بدلاً من ذلك؟',
            [
              { text: 'إلغاء', style: 'cancel' },
              { 
                text: 'تسجيل الدخول', 
                onPress: () => {
                  setMode('login');
                }
              }
            ]
          );
        } else {
          Alert.alert('خطأ', data.detail || 'فشل إنشاء الحساب');
        }
      } else {
        // Login mode
        response = await api.login(email, password);
        data = await response.json();
        
        if (response.ok) {
          await storage.setToken(data.token);
          await storage.setUserData(data.user);
          onLogin(data.user);
        } else if (data.detail && data.detail.includes('not found')) {
          // User not found - offer to register
          Alert.alert(
            'الحساب غير موجود',
            'لم يتم العثور على حساب بهذا البريد. هل تريد إنشاء حساب جديد؟',
            [
              { text: 'إلغاء', style: 'cancel' },
              { 
                text: 'إنشاء حساب', 
                onPress: () => {
                  setMode('register');
                }
              }
            ]
          );
        } else {
          Alert.alert('خطأ', data.detail || 'فشل تسجيل الدخول');
        }
      }
    } catch (error) {
      console.log('Auth error:', error);
      Alert.alert(
        'خطأ في الاتصال', 
        'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
        [
          { text: 'حاول مرة أخرى', onPress: () => handleEmailAuth() },
          { text: 'إلغاء', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      'تسجيل الدخول بـ Google',
      'سيتم فتح صفحة تسجيل الدخول في المتصفح. بعد إتمام التسجيل، يرجى العودة والدخول بالبريد الإلكتروني.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'متابعة',
          onPress: () => {
            Linking.openURL('https://saqrpointscom.store/');
          }
        }
      ]
    );
  };

  const handleAppleLogin = () => {
    // Redirect to email login instead of showing error
    Alert.alert(
      'تسجيل الدخول بـ Apple',
      'يرجى استخدام البريد الإلكتروني للتسجيل أو تجربة التطبيق بدون حساب.',
      [
        { text: 'تجربة بدون حساب', onPress: handleGuestLogin },
        { text: 'تسجيل بالبريد', onPress: () => setMode('login') },
        { text: 'إلغاء', style: 'cancel' }
      ]
    );
  };

  // Main login options
  if (mode === 'main') {
    return (
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/logo_saqr.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>صقر</Text>
            <Text style={styles.tagline}>شاهد الإعلانات واكسب المال</Text>

            {/* Google Login */}
            <TouchableOpacity 
              style={styles.socialBtn} 
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <View style={styles.socialIconContainer}>
                <Text style={styles.googleIcon}>G</Text>
              </View>
              <Text style={styles.socialText}>الدخول بحساب Google</Text>
            </TouchableOpacity>

            {/* Apple Login */}
            <TouchableOpacity 
              style={[styles.socialBtn, styles.appleBtn]} 
              onPress={handleAppleLogin}
              activeOpacity={0.8}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-apple" size={22} color="#FFF" />
              </View>
              <Text style={[styles.socialText, styles.appleText]}>الدخول بحساب Apple</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Login */}
            <TouchableOpacity 
              style={styles.emailBtn} 
              onPress={() => setMode('login')}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-outline" size={20} color="#60a5fa" />
              <Text style={styles.emailText}>الدخول بالبريد الإلكتروني</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity 
              style={styles.registerLink} 
              onPress={() => setMode('register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerText}>
                ليس لديك حساب؟ <Text style={styles.registerBold}>سجل الآن</Text>
              </Text>
            </TouchableOpacity>

            {/* Guest Login - تجربة بدون حساب */}
            <TouchableOpacity 
              style={styles.guestBtn} 
              onPress={handleGuestLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="game-controller-outline" size={18} color="#fbbf24" />
              <Text style={styles.guestText}>تجربة التطبيق بدون حساب</Text>
            </TouchableOpacity>

            {/* Privacy Policy Link */}
            <TouchableOpacity 
              style={styles.privacyLink}
              onPress={() => Linking.openURL('https://mobile-verify-9.preview.emergentagent.com/privacy')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.privacyText}>سياسة الخصوصية</Text>
            </TouchableOpacity>

            {/* Terms of Service Link */}
            <TouchableOpacity 
              style={styles.privacyLink}
              onPress={() => Linking.openURL('https://mobile-verify-9.preview.emergentagent.com/terms')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.privacyText}>شروط الاستخدام</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Email Login / Register Form
  return (
    <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backBtn} 
              onPress={() => setMode('main')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#60a5fa" />
              <Text style={styles.backText}>رجوع</Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoContainerSmall}>
              <Image 
                source={require('../../assets/logo_saqr.png')} 
                style={styles.logoImageSmall}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.formTitle}>
              {mode === 'register' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </Text>

            {/* Name Input (Register only) */}
            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>الاسم</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="أدخل اسمك"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleEmailAuth}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name={mode === 'register' ? "person-add-outline" : "log-in-outline"} size={20} color="#FFF" />
                  <Text style={styles.submitText}>
                    {mode === 'register' ? 'إنشاء حساب' : 'دخول'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Switch Mode */}
            <TouchableOpacity 
              onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {mode === 'login' 
                  ? 'ليس لديك حساب؟ سجل الآن' 
                  : 'لديك حساب؟ سجل الدخول'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 24, alignItems: 'center' },
  
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0a0a0f',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: { width: 80, height: 80 },
  logoContainerSmall: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0a0a0f',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImageSmall: { width: 56, height: 56 },
  appName: { fontSize: 34, fontWeight: 'bold', color: '#60a5fa', marginBottom: 8 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 36, textAlign: 'center' },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 24 },

  socialBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 12,
  },
  socialIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: { fontSize: 20, fontWeight: 'bold', color: '#4285F4' },
  socialText: { fontSize: 15, fontWeight: '600', color: '#333' },
  appleBtn: { backgroundColor: '#000' },
  appleText: { color: '#FFF' },

  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  dividerText: { marginHorizontal: 16, color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  emailBtn: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 10,
  },
  emailText: { fontSize: 15, color: '#60a5fa', fontWeight: '600' },

  registerLink: { marginTop: 20 },
  registerText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  registerBold: { color: '#60a5fa', fontWeight: 'bold' },

  guestBtn: { 
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(251,191,36,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  guestText: { 
    color: '#fbbf24', 
    fontSize: 16, 
    fontWeight: '700' 
  },

  privacyLink: { 
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyText: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },

  backBtn: { 
    alignSelf: 'flex-start', 
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: { color: '#60a5fa', fontSize: 15 },

  inputContainer: { width: '100%', marginBottom: 14 },
  inputLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, textAlign: 'right' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFF',
    fontSize: 15,
    textAlign: 'right',
  },

  submitBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
    flexDirection: 'row',
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  switchText: { color: '#60a5fa', fontSize: 14, marginTop: 8 },
});

export default AuthScreen;
