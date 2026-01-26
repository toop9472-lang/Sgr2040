import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://saqr-ads.preview.emergentagent.com';

export default function App() {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // Points timer - 1 point per minute
    const timer = setInterval(() => {
      setWatchTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 60) {
          addPoint();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  const checkUser = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        const response = await axios.get(`${API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        setPoints(response.data.points || 0);
      }
    } catch (error) {
      console.log('Not logged in');
    } finally {
      setLoading(false);
    }
  };

  const addPoint = async () => {
    setPoints(prev => prev + 1);
    // Save to server if logged in
    if (user) {
      try {
        const token = await AsyncStorage.getItem('user_token');
        await axios.post(`${API_URL}/api/user/add-points`, 
          { points: 1 },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      } catch (error) {
        console.log('Failed to save point');
      }
    }
  };

  const guestLogin = async () => {
    setLoading(true);
    try {
      const guestId = 'guest_' + Date.now();
      await AsyncStorage.setItem('guest_id', guestId);
      setUser({ name: 'زائر', isGuest: true });
      setPoints(0);
    } catch (error) {
      console.log('Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        <View style={styles.authContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🦅</Text>
          </View>
          <Text style={styles.title}>صقر</Text>
          <Text style={styles.subtitle}>شاهد واكسب النقاط</Text>
          
          <TouchableOpacity style={styles.guestButton} onPress={guestLogin}>
            <Text style={styles.guestButtonText}>دخول كزائر</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>صقر</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>🪙 {points}</Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Watch Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>وقت المشاهدة</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(watchTime / 60) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{watchTime}/60 ثانية للنقطة التالية</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{points}</Text>
            <Text style={styles.statLabel}>نقاطك</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.floor(points / 500)}</Text>
            <Text style={styles.statLabel}>دولار</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 كيف تكسب النقاط؟</Text>
          <Text style={styles.infoText}>• شاهد لمدة دقيقة = 1 نقطة</Text>
          <Text style={styles.infoText}>• 500 نقطة = 1 دولار</Text>
          <Text style={styles.infoText}>• اسحب أرباحك عبر PayPal أو STC Pay</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    padding: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
  },
  guestButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  guestButtonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pointsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'right',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    color: '#4338CA',
    marginBottom: 8,
    textAlign: 'right',
  },
});
