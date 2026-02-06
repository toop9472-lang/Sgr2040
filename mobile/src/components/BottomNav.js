// Bottom Navigation Component
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import colors from '../styles/colors';

const BottomNav = ({ currentPage, onNavigate, onAdsPress }) => {
  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: '🏠' },
    { id: 'advertiser', label: 'أعلن', icon: '📢' },
    { id: 'profile', label: 'حسابي', icon: '👤' },
  ];

  const NavButton = ({ item }) => {
    const [scale] = useState(new Animated.Value(1));
    const isActive = currentPage === item.id;

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onNavigate(item.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <Animated.View style={[
          styles.navIconContainer,
          isActive && styles.navIconContainerActive,
          { transform: [{ scale }] }
        ]}>
          <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
            {item.icon}
          </Text>
        </Animated.View>
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const AdsButton = () => {
    const [scale] = useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity 
        onPress={onAdsPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.adsButton, { transform: [{ scale }] }]}>
          <Text style={styles.adsIcon}>▶️</Text>
          <Text style={styles.adsLabel}>إعلانات</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <NavButton key={item.id} item={item} />
      ))}
      <AdsButton />
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
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navIconContainerActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  navIcon: { fontSize: 22, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  navLabelActive: { color: '#60a5fa', fontWeight: '600' },
  
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
