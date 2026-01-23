import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const ProfileScreen = ({user, onLogout}) => {
  const isGuest = user?.isGuest || false;
  const pointsToNextDollar = 500 - (user.points % 500);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.header}>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name[0]}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {isGuest && (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>👤 وضع الزائر</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {isGuest ? (
          <View style={styles.guestWarning}>
            <Text style={styles.guestWarningIcon}>🔒</Text>
            <Text style={styles.guestWarningTitle}>أنت في وضع الزائر</Text>
            <Text style={styles.guestWarningText}>
              سجّل الدخول للحصول على النقاط وكسب المال!
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={onLogout}>
              <Text style={styles.loginButtonText}>تسجيل الدخول الآن</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pointsCard}>
            <Text style={styles.pointsLabel}>رصيد النقاط</Text>
            <Text style={styles.pointsValue}>{user.points}</Text>
            <Text style={styles.pointsSubtext}>نقطة متاحة</Text>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {pointsToNextDollar} نقطة متبقية للوصول لـ $1
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>كيف يعمل النظام؟</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>
              شاهد الإعلانات واحصل على نقطة واحدة لكل دقيقة
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>اجمع 500 نقطة لاستبدالها بـ $1</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3</Text>
            <Text style={styles.infoText}>
              اطلب السحب وانتظر موافقة الإدارة
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, {backgroundColor: '#EF4444'}]}>⚠️</Text>
            <Text style={[styles.infoText, {fontWeight: '600'}]}>
              كل إعلان يُحسب مرة واحدة فقط - منع الغش
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  logoutButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 14,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  guestBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  guestBadgeText: {
    color: '#FEF3C7',
    fontSize: 12,
  },
  content: {
    flex: 1,
    marginTop: -70,
    paddingHorizontal: 20,
  },
  guestWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  guestWarningIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  guestWarningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guestWarningText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#92400E',
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pointsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  pointsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  progressInfo: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
    lineHeight: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 32,
  },
});

export default ProfileScreen;