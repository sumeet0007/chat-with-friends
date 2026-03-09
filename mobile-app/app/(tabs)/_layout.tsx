import React from 'react';
import { Tabs } from 'expo-router';
import { MessageSquare, User, Hash } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom || 0;
  const tabBarHeight = 60 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#B5BAC1',
        tabBarStyle: {
          backgroundColor: '#1E1F22',
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingBottom: bottomInset > 0 ? bottomInset : 10,
          paddingTop: 6,
        },
        tabBarHideOnKeyboard: true,
        headerStyle: {
          backgroundColor: '#2B2D31',
        },
        headerTitleStyle: {
          color: '#FFFFFF',
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Direct Messages',
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="servers"
        options={{
          title: 'Servers',
          tabBarIcon: ({ color }) => <Hash size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
