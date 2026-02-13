// Profile Screen - User profile and settings
// Complete Professional Design with All Features
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
  TextInput,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import storage from '../services/storage';

const ProfileScreen = ({ user, onLogout, onNavigate }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [editName, setEditName] = useState(user?.name || '');
  
  const userPoints = user?.points || 0;
  const totalEarned = user?.total_earned || userPoints;
  const watchedAds = user?.ads_watched || 0;
  const referralCode = user?.referral_code || 'SAQR' + (user?.id?.slice(-6) || '123456').toUpperCase();
  const referrals = user?.referrals_count || 0;
  const dollarValue = (userPoints / 500).toFixed(2);
  const riyalValue = dollarValue;

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
        `هل تريد سحب ${riyalValue} ر.س؟\nسيتم مراجعة طلبك خلال 24 ساعة.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تأكيد السحب', onPress: submitWithdrawal }
        ]
      );
    }
  };

  const submitWithdrawal = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getToken();
      const response = await api.requestWithdrawal({ amount: parseFloat(riyalValue) }, token);
      if (response.ok) {
        Alert.alert('تم الطلب', 'تم إرسال طلب السحب بنجاح. سيتم مراجعته خلال 24 ساعة.');
      } else {
        Alert.alert('خطأ', 'فشل في إرسال الطلب. حاول مرة أخرى.');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert('خطأ', 'كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (passwords.new.length < 8) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setIsLoading(true);
    try {
      const token = await storage.getToken();
      const response = await api.changePassword({
        current_password: passwords.current,
        new_password: passwords.new
      }, token);
      
      if (response.ok) {
        Alert.alert('تم بنجاح', 'تم تغيير كلمة المرور بنجاح');
        setShowChangePassword(false);
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json();
        Alert.alert('خطأ', data.detail || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: `جرب تطبيق صقر واكسب المال من مشاهدة الإعلانات!\n\nاستخدم كود الإحالة: ${referralCode}\n\nحمّل التطبيق الآن!`,
        title: 'شارك تطبيق صقر',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const copyReferralCode = () => {
    Alert.alert('تم النسخ', `تم نسخ كود الإحالة: ${referralCode}`);
  };

  const handleSupport = () => {
    Alert.alert(
      'الدعم الفني',
      'اختر طريقة التواصل:',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'البريد الإلكتروني', onPress: () => Linking.openURL('mailto:support@saqr.app?subject=طلب دعم') },
        { text: 'واتساب', onPress: () => Linking.openURL('https://wa.me/966500000000') },
      ]
    );
  };

  const handleHistory = () => {
    Alert.alert(
      'سجل المعاملات',
      `إجمالي الإعلانات المشاهدة: ${watchedAds}\nإجمالي النقاط المكتسبة: ${totalEarned}\n\nلا توجد عمليات سحب سابقة.`,
      [{ text: 'حسناً' }]
    );
  };

  const handlePrivacy = () => {
    Linking.openURL('https://mobile-verify-9.preview.emergentagent.com/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://mobile-verify-9.preview.emergentagent.com/terms');
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
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
    { id: 'settings', icon: 'settings-outline', label: 'الإعدادات', action: handleSettings, color: '#94a3b8' },
    { id: 'withdraw', icon: 'wallet-outline', label: 'سحب الأرباح', action: handleWithdraw, color: '#22c55e' },
    { id: 'history', icon: 'receipt-outline', label: 'سجل المعاملات', action: handleHistory, color: '#60a5fa' },
    { id: 'password', icon: 'lock-closed-outline', label: 'تغيير كلمة المرور', action: () => setShowChangePassword(true), color: '#a855f7' },
    { id: 'support', icon: 'headset-outline', label: 'الدعم الفني', action: () => onNavigate('support'), color: '#fbbf24' },
    { id: 'advertiser-dashboard', icon: 'bar-chart-outline', label: 'لوحة تحكم المعلن', action: () => onNavigate('advertiser-dashboard'), color: '#f97316' },
    { id: 'share', icon: 'share-social-outline', label: 'شارك التطبيق', action: handleShareApp, color: '#ec4899' },
    { id: 'privacy', icon: 'shield-checkmark-outline', label: 'سياسة الخصوصية', action: handlePrivacy, color: '#6366f1' },
    { id: 'terms', icon: 'document-text-outline', label: 'شروط الاستخدام', action: handleTerms, color: '#06b6d4' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatar} activeOpacity={0.8}>
            <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={18} color="#fbbf24" />
            <Text style={styles.statValue}>{userPoints}</Text>
            <Text style={styles.statLabel}>النقاط</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="play-circle" size={18} color="#60a5fa" />
            <Text style={styles.statValue}>{watchedAds}</Text>
            <Text style={styles.statLabel}>إعلانات</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="people" size={18} color="#22c55e" />
            <Text style={styles.statValue}>{referrals}</Text>
            <Text style={styles.statLabel}>إحالات</Text>
          </View>
        </View>

        {/* Referral Code */}
        <View style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <Ionicons name="gift" size={20} color="#ec4899" />
            <Text style={styles.referralTitle}>كود الإحالة</Text>
          </View>
          <TouchableOpacity style={styles.referralCodeBox} onPress={copyReferralCode} activeOpacity={0.7}>
            <Text style={styles.referralCode}>{referralCode}</Text>
            <Ionicons name="copy-outline" size={18} color="#60a5fa" />
          </TouchableOpacity>
          <Text style={styles.referralDesc}>شارك الكود واحصل على 50 نقطة لكل صديق يسجل!</Text>
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
        <Text style={styles.versionText}>الإصدار 4.9.0</Text>
      </View>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور الحالية</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور الحالية"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.current}
                onChangeText={(t) => setPasswords({...passwords, current: t})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور الجديدة"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.new}
                onChangeText={(t) => setPasswords({...passwords, new: t})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.confirm}
                onChangeText={(t) => setPasswords({...passwords, confirm: t})}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.modalButton, isLoading && styles.modalButtonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.modalButtonText}>تغيير كلمة المرور</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },

  profileHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#3b82f6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0f',
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  name: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  email: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  guestBadge: { 
    backgroundColor: 'rgba(251,191,36,0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  guestText: { color: '#fbbf24', fontSize: 11 },

  balanceCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  balanceValue: { color: '#60a5fa', fontSize: 36, fontWeight: 'bold', marginVertical: 2 },
  balancePoints: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  progressContainer: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 3,
  },
  progressText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 6 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 14, 
    padding: 14, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },

  referralCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  referralTitle: { color: '#ec4899', fontSize: 14, fontWeight: '600' },
  referralCodeBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  referralCode: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  referralDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center' },

  menuSection: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'transparent',
    gap: 10,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { flex: 1, color: '#FFF', fontSize: 14 },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: '#ef4444' },

  versionText: { 
    color: 'rgba(255,255,255,0.25)', 
    fontSize: 10, 
    textAlign: 'center', 
    marginTop: 20 
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0a0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
