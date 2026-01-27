// Home Screen - Dashboard with stats and quick actions
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import colors from '../styles/colors';

const { width } = Dimensions.get('window');

const HomeScreen = ({ user, onNavigateToAds, settings }) => {
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    { icon: '💡', text: 'شاهد 10 إعلانات = 50 نقطة!' },
    { icon: '🎯', text: 'كل 500 نقطة = 1 دولار' },
    { icon: '⚡', text: 'أكمل التحديات للمزيد!' },
    { icon: '🏆', text: 'تحدى نفسك يومياً' },
    { icon: '🎁', text: 'مكافآت يومية للنشطين' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const userPoints = user?.points || 0;
  const pointsPerDollar = settings?.points_per_dollar || 500;
  const userBalance = (userPoints / pointsPerDollar).toFixed(2);
  const pointsPerAd = settings?.points_per_ad || 5;
  const dailyLimit = settings?.daily_limit || 50;
  const watchedToday = user?.watched_today || 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.welcomeText}>مرحباً {user?.name || 'صديقي'} 👋</Text>
            <Text style={styles.subText}>جاهز لكسب المزيد اليوم؟</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>{userPoints} ⭐</Text>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient colors={colors.gradients.primary} style={styles.balanceCard}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
            <Text style={styles.balanceAmount}>${userBalance}</Text>
            <Text style={styles.balancePoints}>{userPoints} نقطة • {pointsPerDollar} نقطة/دولار</Text>
          </View>
          <View style={styles.balanceIcon}>
            <Text style={styles.balanceIconText}>📈</Text>
          </View>
        </LinearGradient>

        {/* Start Watching Button */}
        <TouchableOpacity onPress={onNavigateToAds} activeOpacity={0.9}>
          <LinearGradient colors={colors.gradients.accent} style={styles.watchButton}>
            <View style={styles.watchButtonLeft}>
              <View style={styles.playIcon}>
                <Text style={styles.playIconText}>▶️</Text>
              </View>
              <View>
                <Text style={styles.watchButtonTitle}>ابدأ المشاهدة الآن</Text>
                <Text style={styles.watchButtonSub}>اكسب {pointsPerAd} نقاط لكل إعلان</Text>
              </View>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 إحصائياتك</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{watchedToday}</Text>
              <Text style={styles.statLabel}>اليوم</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.max(dailyLimit - watchedToday, 0)}</Text>
              <Text style={styles.statLabel}>المتبقي</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{pointsPerAd}</Text>
              <Text style={styles.statLabel}>نقاط/إعلان</Text>
            </View>
          </View>
        </View>

        {/* Daily Challenge */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeIcon}>🎯</Text>
            <View>
              <Text style={styles.challengeTitle}>التحدي اليومي</Text>
              <Text style={styles.challengeName}>شاهد 5 إعلانات</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min((watchedToday / 5) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.challengeReward}>المكافأة: +25 ⭐</Text>
        </View>

        {/* Tips */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>{tips[currentTip].icon} {tips[currentTip].text}</Text>
        </View>

        {/* How to Earn */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>💰 كيف تكسب؟</Text>
          <Text style={styles.infoItem}>✓ شاهد إعلان كامل = {pointsPerAd} نقاط</Text>
          <Text style={styles.infoItem}>✓ أكمل التحدي اليومي = مكافأة إضافية</Text>
          <Text style={styles.infoItem}>✓ {pointsPerDollar} نقطة = $1 دولار</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bg },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: colors.dark.text },
  subText: { fontSize: 14, color: colors.dark.textSecondary, marginTop: 4 },
  pointsBadge: { backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pointsBadgeText: { color: colors.accent, fontWeight: 'bold', fontSize: 16 },

  balanceCard: { borderRadius: 24, padding: 24, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceInfo: {},
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balanceAmount: { color: '#FFF', fontSize: 40, fontWeight: 'bold', marginTop: 4 },
  balancePoints: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  balanceIcon: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  balanceIconText: { fontSize: 28 },

  watchButton: { borderRadius: 20, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  watchButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  playIcon: { width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  playIconText: { fontSize: 24 },
  watchButtonTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  watchButtonSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  arrowIcon: { color: '#FFF', fontSize: 32 },

  statsCard: { backgroundColor: colors.dark.card, borderRadius: 20, padding: 20, marginBottom: 20 },
  sectionTitle: { color: colors.dark.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.dark.text },
  statLabel: { fontSize: 12, color: colors.dark.textMuted, marginTop: 4 },

  challengeCard: { backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', borderRadius: 20, padding: 20, marginBottom: 20 },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  challengeIcon: { fontSize: 32 },
  challengeTitle: { color: colors.accent, fontWeight: 'bold', fontSize: 16 },
  challengeName: { color: colors.dark.textSecondary, fontSize: 14 },
  progressBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: colors.accent, borderRadius: 4 },
  challengeReward: { color: colors.accent, fontSize: 14, textAlign: 'center' },

  tipCard: { backgroundColor: colors.dark.card, borderRadius: 16, padding: 16, marginBottom: 20, alignItems: 'center' },
  tipText: { color: colors.dark.textSecondary, fontSize: 14 },

  infoCard: { backgroundColor: colors.dark.card, borderRadius: 16, padding: 16, marginBottom: 20 },
  infoItem: { color: colors.dark.textSecondary, fontSize: 14, marginBottom: 8 },
});

export default HomeScreen;
