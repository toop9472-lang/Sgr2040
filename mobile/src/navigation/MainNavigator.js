import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import AdViewerScreen from '../screens/AdViewerScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainNavigator = ({user, ads, onAdWatched, onLogout}) => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}>
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: ({color}) => <Text style={{fontSize: 24}}>🏠</Text>,
        }}>
        {() => (
          <AdViewerScreen ads={ads} user={user} onAdWatched={onAdWatched} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'الملف',
          tabBarIcon: ({color}) => <Text style={{fontSize: 24}}>👤</Text>,
        }}>
        {() => <ProfileScreen user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainNavigator;