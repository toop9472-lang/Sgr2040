// Bottom Navigation Component
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import colors from '../styles/colors';

const BottomNav = ({ currentPage, onNavigate, onAdsPress }) => {
  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'advertiser', label: 'أعلن', icon: '📢' },
    { id: 'profile', label: 'حسابي', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity 
          key={item.id} 
          style={styles.navItem}
          onPress={() => onNavigate(item.id)}
        >
          <Text style={[styles.navIcon, currentPage === item.id && styles.navIconActive]}>
            {item.icon}
          </Text>
          <Text style={[styles.navLabel, currentPage === item.id && styles.navLabelActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
      
      {/* Ads Button - Highlighted */}
      <TouchableOpacity style={styles.adsButton} onPress={onAdsPress}>
        <Text style={styles.adsIcon}>▶️</Text>
        <Text style={styles.adsLabel}>إعلانات</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.dark.bgTertiary,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navIcon: { fontSize: 22, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  navLabelActive: { color: '#FFF' },
  
  adsButton: {
    backgroundColor: colors.error,
    marginHorizontal: 8,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  adsIcon: { fontSize: 22 },
  adsLabel: { fontSize: 11, color: '#FFF', fontWeight: '600' },
});

export default BottomNav;
