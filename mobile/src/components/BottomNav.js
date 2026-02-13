// Bottom Navigation Component - TikTok Style Design (Optimized 2024-2026)
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomNav = ({ currentPage, onNavigate, onAdsPress }) => {
  const insets = useSafeAreaInsets();
  
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
        data-testid={`nav-${item.id}`}
      >
        <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
          <Ionicons 
            name={isActive ? item.icon : item.iconOutline} 
            size={26} 
            color={isActive ? '#000' : '#888'} 
          />
        </View>
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Calculate bottom padding for safe area
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.navContent}>
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
        
        {/* زر المشاهدة المركزي - TikTok Style */}
        <TouchableOpacity 
          onPress={onAdsPress}
          activeOpacity={0.85}
          style={styles.centerButtonWrapper}
          data-testid="nav-watch-ads"
        >
          <View style={styles.centerButtonOuter}>
            <View style={styles.centerButtonLeft} />
            <View style={styles.centerButton}>
              <Ionicons name="play" size={18} color="#000" />
            </View>
            <View style={styles.centerButtonRight} />
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
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 10,
    height: 56,
  },
  navItem: { 
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    paddingVertical: 2,
  },
  iconWrapper: {
    padding: 2,
  },
  iconWrapperActive: {
    transform: [{ scale: 1.08 }],
  },
  navLabel: { 
    fontSize: 11, 
    color: '#888', 
    marginTop: -2,
    fontWeight: '500',
  },
  navLabelActive: { 
    color: '#000', 
    fontWeight: '600',
  },
  centerButtonWrapper: {
    marginHorizontal: 4,
  },
  centerButtonOuter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerButtonLeft: {
    width: 20,
    height: 28,
    backgroundColor: '#25f4ee',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    marginRight: -8,
  },
  centerButton: {
    width: 40,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  centerButtonRight: {
    width: 20,
    height: 28,
    backgroundColor: '#fe2c55',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    marginLeft: -8,
  },
});

export default BottomNav;
