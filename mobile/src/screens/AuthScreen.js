import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

const AuthScreen = ({navigation, onLogin}) => {
  const handleGoogleLogin = () => {
    const mockUser = {
      id: 'user_' + Date.now(),
      name: 'مستخدم جديد',
      email: 'user@gmail.com',
      avatar: 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff',
      provider: 'google',
    };
    onLogin(mockUser);
  };

  const handleAppleLogin = () => {
    const mockUser = {
      id: 'user_' + Date.now(),
      name: 'مستخدم جديد',
      email: 'user@icloud.com',
      avatar: 'https://ui-avatars.com/api/?name=User&background=000000&color=fff',
      provider: 'apple',
    };
    onLogin(mockUser);
  };

  const handleGuestMode = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'زائر',
      email: 'guest@saqr.app',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=94A3B8&color=fff',
      provider: 'guest',
      isGuest: true,
    };
    onLogin(guestUser);
  };

  return (
    <LinearGradient
      colors={['#EEF2FF', '#FFFFFF', '#F3E8FF']}
      style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.logo}>
            <Text style={styles.logoEmoji}>🦅</Text>
          </LinearGradient>
        </View>

        <Text style={styles.title}>صقر</Text>
        <Text style={styles.subtitle}>شاهد الإعلانات واكسب النقاط</Text>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleButtonText}>🔑 تسجيل الدخول بواسطة Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.appleButton} onPress={handleAppleLogin}>
          <Text style={styles.appleButtonText}> تسجيل الدخول بواسطة Apple</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
          <Text style={styles.guestButtonText}>👁 زيارة (تصفح بدون تسجيل)</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          بتسجيل الدخول، أنت توافق على الشروط والأحكام
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4F46E5',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 30,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  googleButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  appleButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#9CA3AF',
    fontSize: 14,
  },
  guestButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  guestButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 10,
  },
});

export default AuthScreen;