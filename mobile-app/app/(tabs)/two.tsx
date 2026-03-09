import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, Switch, Alert
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  LogOut, Bell, Shield, ChevronRight, Moon, Smartphone,
  User, CreditCard, HelpCircle, Info
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({ icon, label, description, onPress, rightElement, danger }: SettingsItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 bg-[#2B2D31] active:bg-[#404249]/40"
    >
      <View className="w-8 h-8 rounded-xl bg-[#1E1F22] items-center justify-center mr-4">
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${danger ? 'text-[#F23F42]' : 'text-[#DBDEE1]'}`}>{label}</Text>
        {description && <Text className="text-[#B5BAC1] text-xs mt-0.5">{description}</Text>}
      </View>
      {rightElement || <ChevronRight size={16} color="#4E5058" />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => signOut() }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#313338]" edges={['top', 'bottom']}>
      <ScrollView className="flex-1">
      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-[#2B2D31]">
        <Text className="text-[#B5BAC1] text-xs font-bold uppercase tracking-widest mb-4">User Settings</Text>
        {/* Profile Card */}
        <View className="bg-[#1E1F22] rounded-2xl p-4 flex-row items-center">
          <View className="relative">
            <Image
              source={{ uri: user?.imageUrl }}
              className="w-16 h-16 rounded-full"
              style={{ width: 64, height: 64, borderRadius: 32 }}
            />
            <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#23A559] border-2 border-[#1E1F22]" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-white font-bold text-base">{user?.fullName}</Text>
            <Text className="text-[#B5BAC1] text-xs mt-0.5">
              @{user?.username || user?.firstName?.toLowerCase()}
            </Text>
            <View className="mt-1.5 bg-[#5865F2]/20 self-start px-2 py-0.5 rounded-full">
              <Text className="text-[#5865F2] text-[10px] font-bold">MEMBER</Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <User size={18} color="#B5BAC1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sections */}
      <View className="mt-6">
        <Text className="text-[#B5BAC1] text-xs font-bold uppercase tracking-widest px-4 mb-2">
          Preferences
        </Text>
        <View className="rounded-xl overflow-hidden mx-4 border border-[#1E1F22] divide-y divide-[#1E1F22]">
          <SettingsItem
            icon={<Bell size={16} color="#5865F2" />}
            label="Notifications"
            description={notificationsEnabled ? "Push notifications on" : "Notifications are off"}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#4E5058', true: '#5865F2' }}
                thumbColor="white"
              />
            }
          />
          <SettingsItem
            icon={<Moon size={16} color="#5865F2" />}
            label="Dark Mode"
            description="Always use dark theme"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#4E5058', true: '#5865F2' }}
                thumbColor="white"
              />
            }
          />
        </View>
      </View>

      <View className="mt-6">
        <Text className="text-[#B5BAC1] text-xs font-bold uppercase tracking-widest px-4 mb-2">
          Privacy & Safety
        </Text>
        <View className="rounded-xl overflow-hidden mx-4 border border-[#1E1F22] divide-y divide-[#1E1F22]">
          <SettingsItem
            icon={<Shield size={16} color="#23A559" />}
            label="Privacy Settings"
            description="Manage who can contact you"
          />
          <SettingsItem
            icon={<Smartphone size={16} color="#23A559" />}
            label="Connected Devices"
            description="Manage active sessions"
          />
        </View>
      </View>

      <View className="mt-6">
        <Text className="text-[#B5BAC1] text-xs font-bold uppercase tracking-widest px-4 mb-2">
          Support
        </Text>
        <View className="rounded-xl overflow-hidden mx-4 border border-[#1E1F22] divide-y divide-[#1E1F22]">
          <SettingsItem
            icon={<HelpCircle size={16} color="#B5BAC1" />}
            label="Help & Support"
          />
          <SettingsItem
            icon={<Info size={16} color="#B5BAC1" />}
            label="About"
            description="Version 1.0.0"
          />
        </View>
      </View>

      <View className="mt-6 mx-4 mb-4">
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-[#F23F42]/10 border border-[#F23F42]/30 rounded-xl p-4 flex-row items-center justify-center"
        >
          <LogOut size={18} color="#F23F42" />
          <Text className="text-[#F23F42] font-bold ml-2">Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: insets.bottom || 10 }} />
    </ScrollView>
    </SafeAreaView>
  );
}
