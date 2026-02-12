// Home Screen - Dashboard with stats and quick actions
// Clean Professional Design
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colors from '../styles/colors';

const { width } = Dimensions.get('window');

// Memoized Tip Component for better performance
const TipItem = memo(({ icon, text }) => (
  <View style={styles.tipContent}>
    <Ionicons name={icon} size={20} color="#fbbf24" />
    <Text style={styles.tipText}>{text}</Text>
  </View>
));

// Memoized Stats Card
const StatsCard = memo(({ icon, value, label, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

const HomeScreen = ({ user, onNavigateToAds, settings, onRefresh }) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Memoized tips array
  const tips = useMemo(() => [
    { icon: 'bulb-outline', text: 'شاهد 10 إعلانات = 50 نقطة!' },
    { icon: 'trophy-outline', text: 'كل 500 نقطة = 1 ر.س' },
    { icon: 'flash-outline', text: 'أكمل التحديات للمزيد!' },
    { icon: 'medal-outline', text: 'تحدى نفسك يومياً' },
    { icon: 'gift-outline', text: 'مكافآت يومية للنشطين' },
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Memoized calculations
  const userPoints = useMemo(() => user?.points || 0, [user?.points]);
  const pointsPerDollar = useMemo(() => settings?.points_per_dollar || 500, [settings?.points_per_dollar]);
  const userBalance = useMemo(() => (userPoints / pointsPerDollar).toFixed(2), [userPoints, pointsPerDollar]);
  const pointsPerAd = useMemo(() => settings?.points_per_ad || 5, [settings?.points_per_ad]);
  const dailyLimit = useMemo(() => settings?.daily_limit || 50, [settings?.daily_limit]);
  const watchedToday = useMemo(() => user?.watched_today || 0, [user?.watched_today]);
  const remainingAds = useMemo(() => Math.max(0, dailyLimit - watchedToday), [dailyLimit, watchedToday]);
  const progressPercent = useMemo(() => Math.min(100, (watchedToday / dailyLimit) * 100), [watchedToday, dailyLimit]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  // Navigate handler
  const handleNavigateToAds = useCallback(() => {
    if (onNavigateToAds) onNavigateToAds();
  }, [onNavigateToAds]);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#3b82f6"
          colors={['#3b82f6']}
        />
      }
    >
      <View style={styles.content}>
        {/* App Logo and Name */}
        <View style={styles.logoHeader}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo_saqr.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>صقر</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>مرحباً {user?.name || 'صديقي'}</Text>
            <Text style={styles.subText}>جاهز لكسب المزيد اليوم؟</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={16} color="#60a5fa" />
            <Text style={styles.pointsBadgeText}>{userPoints}</Text>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient colors={['#3b82f6', '#6366f1']} style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
            <Text style={styles.balanceAmount}>{userBalance} ر.س</Text>
            <Text style={styles.balancePoints}>{userPoints} نقطة • {pointsPerDollar} نقطة/ريال</Text>
          </View>
          <View style={styles.balanceIcon}>
            <Ionicons name="trending-up" size={28} color="#FFF" />
          </View>
        </LinearGradient>

        {/* Start Watching Button */}
        <TouchableOpacity onPress={onNavigateToAds} activeOpacity={0.9}>
          <LinearGradient colors={['#ef4444', '#ec4899']} style={styles.watchButton}>
            <View style={styles.watchButtonLeft}>
              <View style={styles.playIcon}>
                <Ionicons name="play" size={24} color="#FFF" />
              </View>
              <View>
                <Text style={styles.watchButtonTitle}>ابدأ المشاهدة الآن</Text>
                <Text style={styles.watchButtonSub}>اكسب {pointsPerAd} نقاط لكل إعلان</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={18} color="#60a5fa" />
            <Text style={styles.sectionTitle}>إحصائياتك</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="today-outline" size={18} color="#22c55e" />
              <Text style={styles.statValue}>{watchedToday}</Text>
              <Text style={styles.statLabel}>اليوم</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#60a5fa" />
              <Text style={styles.statValue}>{Math.max(dailyLimit - watchedToday, 0)}</Text>
              <Text style={styles.statLabel}>المتبقي</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="gift-outline" size={18} color="#fbbf24" />
              <Text style={styles.statValue}>{pointsPerAd}</Text>
              <Text style={styles.statLabel}>نقاط/إعلان</Text>
            </View>
          </View>
        </View>

        {/* Daily Challenge */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeIconContainer}>
              <Ionicons name="trophy" size={24} color="#fbbf24" />
            </View>
            <View>
              <Text style={styles.challengeTitle}>التحدي اليومي</Text>
              <Text style={styles.challengeName}>شاهد 5 إعلانات</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((watchedToday / 5) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.challengeReward}>
            <Ionicons name="star" size={14} color="#fbbf24" /> المكافأة: +25 نقطة
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipCard}>
          <Ionicons name={tips[currentTip].icon} size={20} color="#fbbf24" />
          <Text style={styles.tipText}>{tips[currentTip].text}</Text>
        </View>

        {/* How to Earn */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={18} color="#22c55e" />
            <Text style={styles.sectionTitle}>كيف تكسب؟</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.infoText}>شاهد إعلان كامل = {pointsPerAd} نقاط</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.infoText}>أكمل التحدي اليومي = مكافأة إضافية</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.infoText}>{pointsPerDollar} نقطة = 1 ر.س</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingTop: 40, paddingBottom: 100 },

  logoHeader: { alignItems: 'center', marginBottom: 20 },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a0a0f',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: { width: 48, height: 48 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#60a5fa', marginTop: 8 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  subText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  pointsBadge: { 
    backgroundColor: 'rgba(59,130,246,0.15)', 
    borderWidth: 1, 
    borderColor: 'rgba(59,130,246,0.3)', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsBadgeText: { color: '#60a5fa', fontWeight: 'bold', fontSize: 15 },

  balanceCard: { 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  balanceInfo: {},
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  balancePoints: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  balanceIcon: { 
    width: 56, 
    height: 56, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  watchButton: { 
    borderRadius: 18, 
    padding: 18, 
    marginBottom: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  watchButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  playIcon: { 
    width: 48, 
    height: 48, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  watchButtonTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  watchButtonSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  statsCard: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 18, 
    padding: 18, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statItem: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 14, 
    padding: 14, 
    alignItems: 'center' 
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 6 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  challengeCard: { 
    backgroundColor: 'rgba(251,191,36,0.08)', 
    borderWidth: 1, 
    borderColor: 'rgba(251,191,36,0.2)', 
    borderRadius: 18, 
    padding: 18, 
    marginBottom: 16 
  },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  challengeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251,191,36,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeTitle: { color: '#fbbf24', fontWeight: 'bold', fontSize: 14 },
  challengeName: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  progressBar: { height: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: '#fbbf24', borderRadius: 3 },
  challengeReward: { color: '#fbbf24', fontSize: 13, textAlign: 'center' },

  tipCard: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 14, 
    padding: 14, 
    marginBottom: 16, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tipText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  infoCard: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 10 
  },
  infoText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});

export default memo(HomeScreen);
