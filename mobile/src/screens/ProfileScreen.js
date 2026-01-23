/**
 * Profile Screen - User profile and settings
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, isGuest, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الخروج', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleWithdraw = () => {
    if (isGuest) {
      Alert.alert('🔒', 'سجّل الدخول لسحب النقاط');
      return;
    }

    if (user.points < 500) {
      Alert.alert(
        '⚠️ نقاط غير كافية',
        `تحتاج 500 نقطة على الأقل للسحب. لديك حالياً ${user.points} نقطة.`
      );
      return;
    }

    navigation.navigate('Withdraw');
  };

  const pointsValue = (user?.points || 0) / 500;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>
                {isGuest ? '👤' : '🦅'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {isGuest && (
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>وضع الزائر</Text>
          </View>
        )}
      </LinearGradient>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsRow}>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>نقاطك الحالية</Text>
            <Text style={styles.pointsValue}>{user?.points || 0}</Text>
          </View>
          <View style={styles.pointsDivider} />
          <View style={styles.pointsItem}>
            <Text style={styles.pointsLabel}>القيمة بالدولار</Text>
            <Text style={styles.pointsValue}>${pointsValue.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((user?.points || 0) / 500 * 100, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {user?.points || 0} / 500 نقطة للسحب
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.withdrawButton,
            (user?.points || 0) < 500 && styles.withdrawButtonDisabled
          ]}
          onPress={handleWithdraw}
        >
          <Text style={styles.withdrawButtonText}>
            💸 سحب الرصيد
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>إحصائياتك</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.total_earned || 0}</Text>
            <Text style={styles.statLabel}>إجمالي النقاط المكتسبة</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.watched_ads?.length || 0}</Text>
            <Text style={styles.statLabel}>الإعلانات المشاهدة</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>سجل السحوبات</Text>
          <Text style={styles.menuArrow}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>الإعدادات</Text>
          <Text style={styles.menuArrow}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>المساعدة والدعم</Text>
          <Text style={styles.menuArrow}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📜</Text>
          <Text style={styles.menuText}>الشروط والأحكام</Text>
          <Text style={styles.menuArrow}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>
          {isGuest ? 'العودة لتسجيل الدخول' : 'تسجيل الخروج'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>صقر الإصدار 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarEmoji: {
    fontSize: 50,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  guestBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  guestBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  pointsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  pointsItem: {
    alignItems: 'center',
  },
  pointsLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
  },
  pointsValue: {
    color: '#1F2937',
    fontSize: 28,
    fontWeight: 'bold',
  },
  pointsDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  withdrawButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  withdrawButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#4F46E5',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    fontSize: 20,
    marginLeft: 12,
  },
  menuText: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
    textAlign: 'right',
  },
  menuArrow: {
    color: '#9CA3AF',
    fontSize: 18,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default ProfileScreen;
