// Bottom Navigation Component - Clean & Slim Design
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const hasNotch = Platform.OS === 'ios' && SCREEN_HEIGHT >= 812;

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
          size={22} 
          color={isActive ? '#60a5fa' : 'rgba(255,255,255,0.5)'} 
        />
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navContent}>
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
        
        {/* زر المشاهدة */}
        <TouchableOpacity 
          onPress={onAdsPress}
          activeOpacity={0.8}
          style={styles.watchButton}
        >
          <Ionicons name="play-circle" size={20} color="#FFF" />
          <Text style={styles.watchButtonText}>شاهد</Text>
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
    backgroundColor: 'rgba(10, 10, 15, 0.98)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingBottom: hasNotch ? 20 : Platform.OS === 'ios' ? 6 : 4,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingHorizontal: 8,
    height: 48,
  },
  navItem: { 
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    paddingVertical: 2,
  },
  navLabel: { 
    fontSize: 10, 
    color: 'rgba(255,255,255,0.5)', 
    marginTop: 1,
    fontWeight: '500',
  },
  navLabelActive: { 
    color: '#60a5fa', 
    fontWeight: '600',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  watchButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BottomNav;
