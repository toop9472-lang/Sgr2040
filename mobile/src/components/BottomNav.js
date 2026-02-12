// Bottom Navigation Component - Professional Design with Ionicons
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../styles/colors';

const BottomNav = ({ currentPage, onNavigate, onAdsPress }) => {
  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline' },
    { id: 'advertiser', label: 'أعلن', icon: 'megaphone', iconOutline: 'megaphone-outline' },
    { id: 'profile', label: 'حسابي', icon: 'person', iconOutline: 'person-outline' },
  ];

  const NavButton = ({ item }) => {
    const isActive = currentPage === item.id;

    return (
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onNavigate(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.navIconContainer,
          isActive && styles.navIconContainerActive,
        ]}>
          <Ionicons 
            name={isActive ? item.icon : item.iconOutline} 
            size={24} 
            color={isActive ? '#60a5fa' : 'rgba(255,255,255,0.5)'} 
          />
        </View>
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <NavButton key={item.id} item={item} />
      ))}
      {/* زر الإعلانات */}
      <TouchableOpacity 
        onPress={onAdsPress}
        activeOpacity={0.8}
        style={styles.adsButtonWrapper}
      >
        <View style={styles.adsButton}>
          <Ionicons name="play-circle" size={22} color="#FFF" />
          <Text style={styles.adsLabel}>مشاهدة</Text>
        </View>
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
    backgroundColor: '#0a0a0f',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navItem: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 4,
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navIconContainerActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  navLabel: { 
    fontSize: 10, 
    color: 'rgba(255,255,255,0.5)', 
    marginTop: 2,
  },
  navLabelActive: { 
    color: '#60a5fa', 
    fontWeight: '600',
  },
  adsButtonWrapper: {
    paddingHorizontal: 4,
  },
  adsButton: {
    backgroundColor: '#ef4444',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  adsLabel: { 
    fontSize: 12, 
    color: '#FFF', 
    fontWeight: '600',
  },
});

export default BottomNav;
