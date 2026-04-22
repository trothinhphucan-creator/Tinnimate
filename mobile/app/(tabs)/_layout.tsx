import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { HapticTab } from '@/components/haptic-tab';
import { Headphones, Music2, MessageCircle, Compass, User } from 'lucide-react-native';
import { V } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: V.tabActive,
        tabBarInactiveTintColor: V.tabInactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            bottom: 16,
            left: 20,
            right: 20,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(20,30,24,0.88)',
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: 'rgba(244,162,97,0.10)',
            paddingBottom: 0,
            paddingTop: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 20,
          },
          default: {
            position: 'absolute',
            bottom: 12,
            left: 16,
            right: 16,
            height: 60,
            borderRadius: 30,
            backgroundColor: 'rgba(20,30,24,0.92)',
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: 'rgba(244,162,97,0.10)',
            paddingBottom: 0,
            elevation: 20,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          marginTop: -2,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? tabStyles.activeIcon : undefined}>
              <Headphones size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Âm thanh',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? tabStyles.activeIcon : undefined}>
              <Music2 size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? tabStyles.activeIcon : undefined}>
              <MessageCircle size={20} color={color} />
            </View>
          ),
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="zen"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? tabStyles.activeIcon : undefined}>
              <Compass size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tôi',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? tabStyles.activeIcon : undefined}>
              <User size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  activeIcon: {
    backgroundColor: 'rgba(244,162,97,0.14)',
    borderRadius: 12,
    padding: 6,
    marginBottom: -2,
  },
});
