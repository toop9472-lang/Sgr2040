// Bottom Navigation Component - TikTok Style Design
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

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
        <Ionicons 
          name={isActive ? item.icon : item.iconOutline} 
          size={26} 
          color={isActive ? '#FFF' : 'rgba(255,255,255,0.5)'} 
          style={isActive && styles.activeIcon}
        />
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* الخلفية شبه شفافة */}
      <View style={styles.navContent}>
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
        {/* زر المشاهدة المركزي - مثل TikTok */}
        <TouchableOpacity 
          onPress={onAdsPress}
          activeOpacity={0.8}
          style={styles.centerButtonWrapper}
        >
          <View style={styles.centerButton}>
            <Ionicons name="play" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingHorizontal: 16,
  },
  navItem: { 
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 2,
  },
  activeIcon: {
    transform: [{ scale: 1.05 }],
  },
  navLabel: { 
    fontSize: 11, 
    color: 'rgba(255,255,255,0.5)', 
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: { 
    color: '#FFF', 
    fontWeight: '600',
  },
  centerButtonWrapper: {
    marginHorizontal: 8,
  },
  centerButton: {
    width: 44,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    // TikTok style gradient effect with shadows
    shadowColor: '#fe2c55',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    // Double shadow effect
    borderLeftWidth: 3,
    borderLeftColor: '#25f4ee',
    borderRightWidth: 3,
    borderRightColor: '#fe2c55',
  },
});

export default BottomNav;
