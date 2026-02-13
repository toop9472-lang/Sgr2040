// Saqr Mobile App - Main Entry Point
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, BackHandler, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdvertiserScreen from './src/screens/AdvertiserScreen';
import AdViewerScreen from './src/screens/AdViewerScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Components
import BottomNav from './src/components/BottomNav';
import AIFloatingButton from './src/components/AIFloatingButton';
import AIChatModal from './src/components/AIChatModal';

// Services
import api from './src/services/api';
import storage from './src/services/storage';
import colors from './src/styles/colors';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [showAdsViewer, setShowAdsViewer] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [settings, setSettings] = useState(null);

  // Initialize app
  useEffect(() => {
    initApp();
  }, []);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (showAIChat) {
        setShowAIChat(false);
        return true;
      }
      
      if (showAdsViewer) {
        setShowAdsViewer(false);
        return true;
      }

      if (currentPage !== 'home') {
        setCurrentPage('home');
        return true;
      }

      // Show exit confirmation dialog
      Alert.alert(
        'الخروج من التطبيق',
        'هل أنت متأكد من الخروج؟',
        [
          { text: 'إلغاء', style: 'cancel', onPress: () => null },
          { text: 'خروج', style: 'destructive', onPress: () => BackHandler.exitApp() }
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [showAIChat, showAdsViewer, currentPage]);

  const initApp = async () => {
    try {
      // Load saved user data
      const [savedToken, savedUser] = await Promise.all([
        storage.getToken(),
        storage.getUserData(),
      ]);

      if (savedToken && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }

      // Load settings
      await loadSettings();
    } catch (error) {
      console.error('Init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.getRewardsSettings();
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Settings error:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleGuestMode = () => {
    setUser({ 
      name: 'زائر', 
      points: 0, 
      isGuest: true,
      id: 'guest_' + Date.now()
    });
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await storage.clearAll();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const handlePointsEarned = (points) => {
    if (user && !user.isGuest) {
      setUser(prev => ({ 
        ...prev, 
        points: (prev.points || 0) + points 
      }));
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <LinearGradient colors={colors.gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingLogoContainer}>
          <Image 
            source={require('./assets/logo_saqr.png')} 
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loadingAppName}>صقر</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </LinearGradient>
    );
  }

  // Ad Viewer (Full Screen)
  if (showAdsViewer) {
    return (
      <AdViewerScreen
        onClose={() => setShowAdsViewer(false)}
        onPointsEarned={handlePointsEarned}
        user={user}
      />
    );
  }

  // Auth Screen
  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} onGuestMode={handleGuestMode} />;
  }

  // Main App
  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradients.dark} style={styles.mainArea}>
        {currentPage === 'home' && (
          <HomeScreen 
            user={user} 
            settings={settings}
            onNavigateToAds={() => setShowAdsViewer(true)} 
          />
        )}
        {currentPage === 'profile' && (
          <ProfileScreen 
            user={user} 
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
          />
        )}
        {currentPage === 'advertiser' && (
          <AdvertiserScreen />
        )}
      </LinearGradient>

      {/* AI Floating Button */}
      <AIFloatingButton onPress={() => setShowAIChat(true)} />

      {/* AI Chat Modal */}
      <AIChatModal 
        visible={showAIChat} 
        onClose={() => setShowAIChat(false)} 
      />

      {/* Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onAdsPress={() => setShowAdsViewer(true)}
      />

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bg },
  mainArea: { flex: 1, paddingBottom: 68 }, // Slim nav bar
  
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0a0a0f',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingLogo: { width: 96, height: 96 },
  loadingAppName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#60a5fa',
    marginTop: 16,
  },
  loadingText: { 
    color: 'rgba(255,255,255,0.6)', 
    marginTop: 16, 
    fontSize: 16 
  },
});
