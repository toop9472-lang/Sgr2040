/**
 * Auth Screen - Login/Register
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { authAPI, setToken } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  const { login, loginAsGuest } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = 'https://saqr-video-ads.preview.emergentagent.com/';
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === 'success' && result.url) {
        // Extract session_id from URL
        const url = new URL(result.url);
        const hash = url.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (sessionIdMatch) {
          setIsLoading(true);
          const response = await authAPI.processSession(sessionIdMatch[1]);
          await login(response.user);
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('خطأ', 'فشل تسجيل الدخول بـ Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = () => {
    Alert.alert('قريباً', 'تسجيل الدخول بـ Apple سيكون متاحاً قريباً');
  };

  const handleEmailAuth = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    if (isRegister && !formData.name) {
      Alert.alert('خطأ', 'يرجى إدخال اسمك');
      return;
    }

    setIsLoading(true);

    try {
      let response;
      if (isRegister) {
        response = await authAPI.register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
      } else {
        // Use unified signin endpoint
        response = await authAPI.signin({
          email: formData.email,
          password: formData.password,
        });
      }

      // Save token if present
      if (response.token) {
        await setToken(response.token);
      }

      // Check if admin login (redirect to web app)
      if (response.role === 'admin') {
        Alert.alert(
          'تنبيه',
          'تسجيل دخول المشرفين متاح فقط عبر الموقع الإلكتروني',
          [{ text: 'حسناً' }]
        );
        setIsLoading(false);
        return;
      }

      await login(response.user);
      Alert.alert('✅', isRegister ? 'تم إنشاء الحساب بنجاح!' : 'مرحباً بك!');
    } catch (error) {
      const message = error.response?.data?.detail || 'حدث خطأ، يرجى المحاولة مرة أخرى';
      Alert.alert('خطأ', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    loginAsGuest();
  };

  if (showEmailForm) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#EEF2FF', '#FFFFFF', '#F3E8FF']}
          style={styles.gradient}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity 
              onPress={() => setShowEmailForm(false)}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← رجوع</Text>
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoEmoji}>🦅</Text>
              </View>
              <Text style={styles.title}>
                {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
              </Text>
            </View>

            <View style={styles.form}>
              {isRegister && (
                <TextInput
                  style={styles.input}
                  placeholder="الاسم"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholderTextColor="#9CA3AF"
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEmailAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isRegister ? 'إنشاء حساب' : 'تسجيل الدخول'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
                <Text style={styles.toggleText}>
                  {isRegister ? 'لديك حساب؟ سجّل الدخول' : 'ليس لديك حساب؟ سجّل الآن'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EEF2FF', '#FFFFFF', '#F3E8FF']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🦅</Text>
            </View>
            <Text style={styles.appName}>صقر</Text>
            <Text style={styles.subtitle}>شاهد الإعلانات واكسب النقاط</Text>
          </View>

          <View style={styles.buttons}>
            {/* Google Login */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>تسجيل الدخول بواسطة Google</Text>
            </TouchableOpacity>

            {/* Apple Login */}
            <TouchableOpacity
              style={styles.appleButton}
              onPress={handleAppleLogin}
              disabled={isLoading}
            >
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleText}>تسجيل الدخول بواسطة Apple</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Login */}
            <TouchableOpacity
              style={styles.emailButton}
              onPress={() => setShowEmailForm(true)}
              disabled={isLoading}
            >
              <Text style={styles.emailIcon}>✉️</Text>
              <Text style={styles.emailText}>تسجيل بالبريد الإلكتروني</Text>
            </TouchableOpacity>

            {/* Guest Mode */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestMode}
              disabled={isLoading}
            >
              <Text style={styles.guestIcon}>👁️</Text>
              <Text style={styles.guestText}>زيارة (تصفح بدون تسجيل)</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.terms}>
            بتسجيل الدخول، أنت توافق على الشروط والأحكام وسياسة الخصوصية
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  backText: {
    color: '#4F46E5',
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  buttons: {
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  appleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#9CA3AF',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    gap: 12,
  },
  emailIcon: {
    fontSize: 20,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    gap: 12,
  },
  guestIcon: {
    fontSize: 20,
  },
  guestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    color: '#4F46E5',
    textAlign: 'center',
    marginTop: 8,
  },
  terms: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});

export default AuthScreen;
