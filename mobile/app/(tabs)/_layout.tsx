import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Headphones, Music2, MessageCircle, Compass, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#818CF8',
        tabBarInactiveTintColor: '#334155',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(2,6,23,0.95)',
            borderTopColor: '#1E293B',
            borderTopWidth: 1,
            height: 84,
            paddingBottom: 28,
          },
          default: {
            backgroundColor: '#020617',
            borderTopColor: '#1E293B',
            borderTopWidth: 1,
            height: 60,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Headphones size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Âm thanh',
          tabBarIcon: ({ color }) => <Music2 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="zen"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tôi',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
