// Profile Screen - User profile and settings
// Professional Design with Ionicons
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../styles/colors';

const ProfileScreen = ({ user, onLogout, onNavigate }) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  const userPoints = user?.points || 0;
  const totalEarned = user?.total_earned || userPoints;
  const dollarValue = (userPoints / 500).toFixed(2);
  const riyalValue = dollarValue; // Same value in SAR

  const handleWithdraw = () => {
    if (userPoints < 500) {
      Alert.alert(
        'رصيد غير كافٍ',
        `تحتاج 500 نقطة على الأقل للسحب. لديك حالياً ${userPoints} نقطة.`,
        [{ text: 'حسناً' }]
      );
    } else {
      Alert.alert(
        'طلب سحب',
        `هل تريد سحب ${riyalValue} ر.س؟\nسيتم مراجعة طلبك من قبل الإدارة.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تأكيد السحب', onPress: () => {
            Alert.alert('تم الطلب', 'تم إرسال طلب السحب بنجاح. سيتم مراجعته قريباً.');
          }}
        ]
      );
    }
  };

  const handleHistory = () => {
    Alert.alert(
      'سجل المعاملات',
      'لا توجد معاملات سابقة حتى الآن.',
      [{ text: 'حسناً' }]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      'الإعدادات',
      'اختر ما تريد تعديله:',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تغيير كلمة المرور', onPress: () => Alert.alert('قريباً', 'هذه الميزة قيد التطوير') },
        { text: 'تعديل الملف الشخصي', onPress: () => Alert.alert('قريباً', 'هذه الميزة قيد التطوير') },
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'المساعدة والدعم',
      'كيف يمكننا مساعدتك؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'الأسئلة الشائعة', onPress: () => Alert.alert('الأسئلة الشائعة', '1. كيف أكسب النقاط؟\nشاهد الإعلانات واحصل على 5 نقاط لكل إعلان.\n\n2. كيف أسحب أرباحي؟\nاجمع 500 نقطة واطلب السحب من صفحة الملف الشخصي.\n\n3. متى أستلم أموالي؟\nخلال 1-3 أيام عمل بعد الموافقة.') },
        { text: 'تواصل معنا', onPress: () => Linking.openURL('mailto:support@saqr.app') },
      ]
    );
  };

  const handlePrivacy = () => {
    Linking.openURL('https://saqr-app-deploy.preview.emergentagent.com/privacy-policy.html');
  };

  const confirmLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const menuItems = [
    { id: 'withdraw', icon: 'wallet-outline', label: 'سحب الأرباح', action: handleWithdraw, color: '#22c55e' },
    { id: 'history', icon: 'receipt-outline', label: 'سجل المعاملات', action: handleHistory, color: '#60a5fa' },
    { id: 'settings', icon: 'settings-outline', label: 'الإعدادات', action: handleSettings, color: '#a855f7' },
    { id: 'help', icon: 'help-circle-outline', label: 'المساعدة والدعم', action: handleHelp, color: '#fbbf24' },
    { id: 'privacy', icon: 'shield-checkmark-outline', label: 'سياسة الخصوصية', action: handlePrivacy, color: '#6366f1' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'مستخدم'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {user?.isGuest && (
            <View style={styles.guestBadge}>
              <Ionicons name="person-outline" size={12} color="#fbbf24" />
              <Text style={styles.guestText}>زائر</Text>
            </View>
          )}
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={24} color="#60a5fa" />
          </View>
          <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
          <Text style={styles.balanceValue}>{riyalValue} ر.س</Text>
          <Text style={styles.balancePoints}>{userPoints} نقطة</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.min((userPoints / 500) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.max(500 - userPoints, 0)} نقطة للسحب التالي</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={styles.statValue}>{userPoints}</Text>
            <Text style={styles.statLabel}>نقاط حالية</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trending-up" size={20} color="#22c55e" />
            <Text style={styles.statValue}>{totalEarned}</Text>
            <Text style={styles.statLabel}>إجمالي مكتسب</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem} 
              onPress={item.action}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
          
          {/* Logout */}
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]} 
            onPress={confirmLogout}
            activeOpacity={0.6}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.menuLabel, styles.logoutText]}>تسجيل الخروج</Text>
            <Ionicons name="chevron-forward" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>الإصدار 4.8.1</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bg },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },

  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#3b82f6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  avatarText: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  name: { color: colors.dark.text, fontSize: 24, fontWeight: 'bold' },
  email: { color: colors.dark.textSecondary, fontSize: 14, marginTop: 4 },
  guestBadge: { backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  guestText: { color: colors.accent, fontSize: 12 },

  balanceCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balanceValue: { color: '#60a5fa', fontSize: 48, fontWeight: 'bold', marginVertical: 8 },
  balancePoints: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 4,
  },
  progressText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { 
    flex: 1, 
    backgroundColor: colors.dark.card, 
    borderRadius: 16, 
    padding: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: { color: colors.dark.text, fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: colors.dark.textMuted, fontSize: 12, marginTop: 4 },

  menuSection: { 
    backgroundColor: colors.dark.card, 
    borderRadius: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, color: colors.dark.text, fontSize: 16 },
  menuArrow: { fontSize: 20, color: colors.dark.textMuted },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: colors.error },

  versionText: { 
    color: 'rgba(255,255,255,0.3)', 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 24 
  },
});

export default ProfileScreen;
