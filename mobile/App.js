import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaView, StatusBar, Alert} from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import MainNavigator from './src/navigation/MainNavigator';
import {mockAds} from './src/services/mockData';
import {authAPI, adAPI, getToken} from './src/services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState(mockAds);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.user);
        setIsAuthenticated(true);

        // Load ads
        try {
          const adsData = await adAPI.getAds();
          setAds(adsData);
        } catch (error) {
          console.log('Using mock ads');
        }
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async userData => {
    try {
      setIsLoading(true);

      // If guest mode
      if (userData.isGuest) {
        setUser({
          ...userData,
          points: 0,
          total_earned: 0,
          watched_ads: [],
          joined_date: new Date().toISOString(),
        });
        setIsAuthenticated(true);
        Alert.alert('مرحباً بك كزائر', 'يمكنك تصفح الإعلانات!');
        setIsLoading(false);
        return;
      }

      const response = await authAPI.login(userData.provider, userData);
      setUser(response.user);
      setIsAuthenticated(true);

      // Load ads
      try {
        const adsData = await adAPI.getAds();
        setAds(adsData);
      } catch (error) {
        console.log('Using mock ads');
      }

      Alert.alert('تم تسجيل الدخول', `مرحباً ${response.user.name}!`);
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('خطأ', 'فشل تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    setAds(mockAds);
  };

  const handleAdWatched = async (adId, watchTime) => {
    if (user?.isGuest) {
      Alert.alert(
        '🔒 سجّل الدخول',
        'قم بتسجيل الدخول للحصول على نقاط عند مشاهدة الإعلانات',
      );
      return;
    }

    try {
      const response = await adAPI.watchAd(adId, watchTime);
      
      // Update user points locally
      setUser(prev => ({
        ...prev,
        points: response.total_points,
        watched_ads: [...(prev.watched_ads || []), {ad_id: adId}],
      }));

      return response;
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert('تنبيه', 'لقد شاهدت هذا الإعلان بالفعل');
      }
      throw error;
    }
  };

  if (isLoading) {
    return null; // Add loading screen if needed
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      {!isAuthenticated ? (
        <AuthScreen onLogin={handleLogin} />
      ) : (
        <MainNavigator
          user={user}
          ads={ads}
          onAdWatched={handleAdWatched}
          onLogout={handleLogout}
        />
      )}
    </NavigationContainer>
  );
}

export default App;
