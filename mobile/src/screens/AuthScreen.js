// Auth Screen - Login / Register / Guest
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

const AuthScreen = ({ onLogin }) => {
  const [mode, setMode] = useState('main'); // main, login, register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const response = mode === 'register'
        ? await api.register(email, password, name)
        : await api.login(email, password);

      const data = await response.json();

      if (response.ok) {
        await storage.setToken(data.token);
        await storage.setUserData(data.user);
        onLogin(data.user);
      } else {
        Alert.alert('خطأ', data.detail || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      Alert.alert('خطأ', 'تحقق من اتصالك بالإنترنت');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = 'https://saqr-video-ads.preview.emergentagent.com/';
    Linking.openURL(`https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  const handleAppleLogin = () => {
    Alert.alert('قريباً', 'تسجيل الدخول بـ Apple متاح فقط في تطبيق iOS على App Store');
  };

  const handleGuestMode = () => {
    onLogin({ 
      name: 'زائر', 
      points: 0, 
      isGuest: true,
      id: 'guest_' + Date.now()
    });
  };

  // Main login options
  if (mode === 'main') {
    return (
      <LinearGradient colors={colors.gradients.dark} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Logo */}
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>صقر</Text>
            <Text style={styles.tagline}>شاهد الإعلانات واكسب المال</Text>

            {/* Google Login */}
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialText}>الدخول بحساب Google</Text>
            </TouchableOpacity>

            {/* Apple Login */}
            <TouchableOpacity style={[styles.socialBtn, styles.appleBtn]} onPress={handleAppleLogin}>
              <Text style={styles.appleIcon}></Text>
              <Text style={[styles.socialText, styles.appleText]}>الدخول بحساب Apple</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Login */}
            <TouchableOpacity style={styles.emailBtn} onPress={() => setMode('login')}>
              <Text style={styles.emailIcon}>✉️</Text>
              <Text style={styles.emailText}>الدخول بالبريد الإلكتروني</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity style={styles.registerLink} onPress={() => setMode('register')}>
              <Text style={styles.registerText}>
                ليس لديك حساب؟ <Text style={styles.registerBold}>سجل الآن</Text>
              </Text>
            </TouchableOpacity>

            {/* Guest Mode */}
            <TouchableOpacity style={styles.guestBtn} onPress={handleGuestMode}>
              <Text style={styles.guestText}>👤 الدخول كزائر</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Email form (login or register)
  return (
    <LinearGradient colors={colors.gradients.dark} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => setMode('main')}>
              <Text style={styles.backText}>‹ رجوع</Text>
            </TouchableOpacity>

            {/* Logo */}
            <Text style={styles.logoSmall}>🦅</Text>
            <Text style={styles.formTitle}>
              {mode === 'register' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </Text>

            {/* Name (register only) */}
            {mode === 'register' && (
              <TextInput
                style={styles.input}
                placeholder="الاسم الكامل"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={name}
                onChangeText={setName}
              />
            )}

            {/* Email */}
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Submit Button */}
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              <LinearGradient colors={colors.gradients.primary} style={styles.submitGradient}>
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'register' ? 'إنشاء الحساب' : 'دخول'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Switch Mode */}
            <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
              <Text style={styles.switchText}>
                {mode === 'register' ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ سجل الآن'}
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
  
  logoImage: { width: 120, height: 120, marginBottom: 8 },
  logoSmall: { fontSize: 60, marginBottom: 8 },
  appName: { fontSize: 42, fontWeight: 'bold', color: colors.accent, marginBottom: 8 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 40, textAlign: 'center' },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 24 },

  socialBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  appleBtn: { backgroundColor: '#000' },
  googleIcon: { fontSize: 20, fontWeight: 'bold', color: '#4285F4' },
  appleIcon: { fontSize: 20, color: '#FFF' },
  socialText: { fontSize: 16, fontWeight: '600', color: '#000' },
  appleText: { color: '#FFF' },

  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { color: 'rgba(255,255,255,0.5)', marginHorizontal: 16 },

  emailBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  emailIcon: { fontSize: 20 },
  emailText: { fontSize: 16, color: '#FFF' },

  registerLink: { marginTop: 20 },
  registerText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  registerBold: { color: colors.primary, fontWeight: 'bold' },

  guestBtn: { marginTop: 16, padding: 12 },
  guestText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  backBtn: { alignSelf: 'flex-start', marginBottom: 20, padding: 8 },
  backText: { color: colors.primary, fontSize: 18 },

  input: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#FFF',
    textAlign: 'right',
  },

  submitBtn: { width: '100%', marginTop: 8 },
  submitGradient: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  switchText: { color: 'rgba(255,255,255,0.6)', marginTop: 20, fontSize: 14 },
});

export default AuthScreen;
