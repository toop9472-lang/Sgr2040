// Profile Screen - User profile and settings
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import colors from '../styles/colors';

const ProfileScreen = ({ user, onLogout, onNavigate }) => {
  const userPoints = user?.points || 0;
  const totalEarned = user?.total_earned || userPoints;

  const menuItems = [
    { id: 'withdraw', icon: '💸', label: 'سحب الأرباح', action: () => onNavigate?.('withdraw') },
    { id: 'history', icon: '📊', label: 'سجل المعاملات', action: () => {} },
    { id: 'settings', icon: '⚙️', label: 'الإعدادات', action: () => {} },
    { id: 'help', icon: '❓', label: 'المساعدة والدعم', action: () => {} },
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
              <Text style={styles.guestText}>زائر</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userPoints}</Text>
            <Text style={styles.statLabel}>نقاط حالية</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalEarned}</Text>
            <Text style={styles.statLabel}>إجمالي مكتسب</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
          
          {/* Logout */}
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={onLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuLabel, styles.logoutText]}>تسجيل الخروج</Text>
            <Text style={[styles.menuArrow, styles.logoutText]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bg },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },

  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  name: { color: colors.dark.text, fontSize: 24, fontWeight: 'bold' },
  email: { color: colors.dark.textSecondary, fontSize: 14, marginTop: 4 },
  guestBadge: { backgroundColor: 'rgba(251,191,36,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  guestText: { color: colors.accent, fontSize: 12 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: colors.dark.card, borderRadius: 16, padding: 20, alignItems: 'center' },
  statValue: { color: colors.dark.text, fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: colors.dark.textMuted, fontSize: 12, marginTop: 4 },

  menuSection: { backgroundColor: colors.dark.card, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { flex: 1, color: colors.dark.text, fontSize: 16 },
  menuArrow: { fontSize: 20, color: colors.dark.textMuted },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: colors.error },
});

export default ProfileScreen;
