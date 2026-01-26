import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [points, setPoints] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkLogin();
  }, []);

  useEffect(() => {
    if (screen === 'home') {
      const timer = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 60) {
            setPoints(p => p + 1);
            Alert.alert('مبروك!', 'حصلت على 1 نقطة!');
            return 0;
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [screen]);

  const checkLogin = async () => {
    try {
      const saved = await AsyncStorage.getItem('saqr_user');
      if (saved) {
        const data = JSON.parse(saved);
        setUserName(data.name);
        setPoints(data.points || 0);
        setScreen('home');
      } else {
        setScreen('login');
      }
    } catch (e) {
      setScreen('login');
    }
  };

  const guestLogin = async () => {
    const userData = { name: 'زائر', points: 0, isGuest: true };
    await AsyncStorage.setItem('saqr_user', JSON.stringify(userData));
    setUserName('زائر');
    setPoints(0);
    setScreen('home');
  };

  const logout = async () => {
    await AsyncStorage.removeItem('saqr_user');
    setScreen('login');
    setPoints(0);
    setUserName('');
  };

  if (screen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>🦅</Text>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <StatusBar style="light" />
      </View>
    );
  }

  if (screen === 'login') {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginLogo}>🦅</Text>
        <Text style={styles.loginTitle}>صقر</Text>
        <Text style={styles.loginSubtitle}>شاهد واكسب النقاط</Text>
        
        <TouchableOpacity style={styles.guestButton} onPress={guestLogin}>
          <Text style={styles.guestButtonText}>دخول كزائر</Text>
        </TouchableOpacity>
        
        <Text style={styles.loginInfo}>500 نقطة = 1 دولار</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>خروج</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>صقر</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{points} نقطة</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>مرحبا {userName}!</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>وقت المشاهدة</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: (watchTime / 60 * 100) + '%' }]} />
          </View>
          <Text style={styles.progressText}>{watchTime}/60 ثانية</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{points}</Text>
            <Text style={styles.statLabel}>نقاطك</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${(points / 500).toFixed(2)}</Text>
            <Text style={styles.statLabel}>رصيدك</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>كيف تكسب النقاط؟</Text>
          <Text style={styles.infoText}>ابق في التطبيق دقيقة = 1 نقطة</Text>
          <Text style={styles.infoText}>500 نقطة = 1 دولار</Text>
        </View>

        {points >= 500 && (
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>اسحب ارباحك</Text>
          </TouchableOpacity>
        )}
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
    fontSize: 80,
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
    fontSize: 100,
    marginBottom: 10,
  },
  loginTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginSubtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 50,
  },
  guestButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 20,
  },
  guestButtonText: {
    color: '#4F46E5',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loginInfo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 20,
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'right',
  },
  progressBar: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
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
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 12,
    textAlign: 'right',
  },
  infoText: {
    fontSize: 15,
    color: '#4338CA',
    marginBottom: 8,
    textAlign: 'right',
  },
  withdrawButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
