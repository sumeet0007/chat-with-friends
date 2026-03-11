import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Platform, FlatList } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MessageSquare, Users, UserPlus, Search, MoreVertical, LogOut, Check, X, Loader2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AddFriendModal } from '@/components/AddFriendModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '@/hooks/use-socket';
import Reanimated, { FadeIn, FadeInRight, Layout } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

// Optional Haptics check
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {}

interface Profile {
  id: string;
  name: string;
  imageUrl: string;
}

interface Member {
  id: string;
  profile: Profile;
  lastMessage?: string;
  lastMessageDate?: string;
  conversationId?: string;
}

interface Friend {
  id: string;
  friend: Profile;
}

interface FriendRequest {
  id: string;
  sender: Profile;
  senderId: string;
}

export default function DMSTabScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'MESSAGES'>('MESSAGES');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [readTimestamps, setReadTimestamps] = useState<Record<string, string>>({});
  const insets = useSafeAreaInsets();
  const { socket } = useSocket();

  useFocusEffect(
    useCallback(() => {
      const loadReadStates = async () => {
        try {
          const stored = await AsyncStorage.getItem('chatReadTimestamps');
          if (stored) {
            setReadTimestamps(JSON.parse(stored));
          }
        } catch (e) {
          console.error('Failed to load read statuses', e);
        }
      };
      loadReadStates();
    }, [])
  );

  const markAsReadAndNavigate = async (memberId: string) => {
      Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light);
      try {
          const now = new Date().toISOString();
          const updated = { ...readTimestamps, [memberId]: now };
          setReadTimestamps(updated);
          await AsyncStorage.setItem('chatReadTimestamps', JSON.stringify(updated));
      } catch (e) {
          console.error("Failed to save read status", e);
      }
      router.push(`/(main)/conversations/${memberId}` as any);
  };

  useEffect(() => {
    if (!socket || !user?.id) return;

    const notificationKey = `user:${user.id}:notifications`;
    
    socket.on(notificationKey, (data: any) => {
        refetch();
        if (Platform.OS !== 'web') {
            Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Success);
        }
    });

    return () => {
        socket.off(notificationKey);
    };
  }, [socket, user?.id]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['friends-data'],
    queryFn: async () => {
      const res = await api.get('/api/friends');
      return res.data;
    },
  });

  const handleTabChange = (tab: 'FRIENDS' | 'MESSAGES') => {
    Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light);
    setActiveTab(tab);
  };

  const handleAcceptRequest = async (senderId: string) => {
    Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Medium);
    setRespondingId(senderId);
    try {
      await api.post('/api/friends/respond', { senderId, action: 'accept' });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setRespondingId(null);
    }
  };

  const handleDeclineRequest = async (senderId: string) => {
    Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light);
    setRespondingId(senderId);
    try {
      await api.post('/api/friends/respond', { senderId, action: 'decline' });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setRespondingId(null);
    }
  };

  const handleStartDM = async (friendId: string) => {
    Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Medium);
    try {
      const res = await api.post('/api/friends/dm', { friendId });
      const { memberId } = res.data;
      router.push(`/(main)/conversations/${memberId}` as any);
    } catch (e) {
      console.error(e);
    }
  };

  const pendingRequests: FriendRequest[] = useMemo(() => data?.requests || [], [data]);
  const friends: Friend[] = useMemo(() => data?.friends || [], [data]);
  const members: Member[] = useMemo(() => data?.members || [], [data]);

  return (
    <SafeAreaView className="flex-1 bg-[#313338]" edges={['top']}>
      {/* Enhanced Header */}
      <View className="px-4 pb-2 flex-row justify-between items-center border-b border-[#1E1F22] h-14">
        <Text className="text-white text-[22px] font-[900] uppercase tracking-tighter">
          {activeTab === 'MESSAGES' ? 'Direct Messages' : 'Friends'}
        </Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
                Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light);
                setShowAddFriend(true);
            }}
            className="mr-3 w-9 h-9 rounded-full bg-[#5865F2]/20 items-center justify-center"
          >
            <UserPlus size={20} color="#5865F2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signOut()}>
            <LogOut size={22} color="#F23F42" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="mx-4 mt-4 mb-2">
        <View className="bg-[#1E1F22] rounded-xl px-4 flex-row items-center h-12 border border-white/5">
          <Search size={18} color="#4E5058" />
          <TextInput
            placeholder="Search conversations..."
            placeholderTextColor="#4E5058"
            className="ml-3 text-[#DBDEE1] text-[15px] font-medium flex-1"
          />
        </View>
      </View>

      {/* Modern Tabs */}
      <View className="flex-row px-4 mt-2 border-b border-[#1E1F22]">
        <TouchableOpacity
          onPress={() => handleTabChange('MESSAGES')}
          className={`mr-8 pb-3 relative`}
        >
          <Text className={`${activeTab === 'MESSAGES' ? 'text-white' : 'text-[#B5BAC1]'} font-bold text-[15px]`}>Messages</Text>
          {activeTab === 'MESSAGES' && (
              <Reanimated.View layout={Layout.springify()} className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t-full" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabChange('FRIENDS')}
          className={`pb-3 relative`}
        >
          <View className="flex-row items-center">
            <Text className={`${activeTab === 'FRIENDS' ? 'text-white' : 'text-[#B5BAC1]'} font-bold text-[15px]`}>Friends</Text>
            {pendingRequests.length > 0 && (
              <View className="ml-2 bg-[#F23F42] rounded-full px-1.5 py-0.5 items-center justify-center min-w-[18px]">
                <Text className="text-white text-[10px] font-black">{pendingRequests.length}</Text>
              </View>
            )}
          </View>
          {activeTab === 'FRIENDS' && (
              <Reanimated.View layout={Layout.springify()} className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t-full" />
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Loader2 size={32} color="#5865F2" className="animate-spin" />
        </View>
      ) : (
        <View className="flex-1">
          {activeTab === 'MESSAGES' ? (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
              renderItem={({ item }) => {
                const isUnread = item.lastMessageDate && (!readTimestamps[item.id] || new Date(item.lastMessageDate) > new Date(readTimestamps[item.id]));

                return (
                <Reanimated.View entering={FadeInRight.duration(300)}>
                    <TouchableOpacity
                      onPress={() => markAsReadAndNavigate(item.id)}
                      className="flex-row items-center py-3.5 border-b border-white/5 active:bg-white/5 px-2 rounded-xl"
                    >
                      <View className="relative">
                        <Image source={{ uri: item.profile.imageUrl }} className="w-12 h-12 rounded-full bg-[#1E1F22]" />
                        <View className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#23A559] border-[3px] border-[#313338]" />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className={`text-white text-[16px] ${isUnread ? 'font-black' : 'font-bold'}`}>{item.profile.name}</Text>
                        <Text className={`text-[13px] mt-0.5 ${isUnread ? 'text-white font-bold' : 'text-[#B5BAC1] font-medium'}`} numberOfLines={1}>
                            {item.lastMessage || 'Tap to start chatting'}
                        </Text>
                      </View>
                      <View className="items-end justify-center">
                          {isUnread && (
                              <View className="w-3 h-3 rounded-full bg-[#5865F2] mb-1" />
                          )}
                          <MessageSquare size={18} color="#4E5058" />
                      </View>
                    </TouchableOpacity>
                </Reanimated.View>
              )}}
              ListEmptyComponent={
                <View className="mt-20 items-center justify-center px-10">
                    <MessageSquare size={80} color="#1E1F22" />
                    <Text className="text-white text-xl font-black mt-4">No messages yet</Text>
                    <Text className="text-[#B5BAC1] text-center text-sm mt-2 font-medium">
                        When you start a conversation, it will appear here.
                    </Text>
                </View>
              }
            />
          ) : (
            <View className="flex-1">
                <FlatList
                    data={[...(pendingRequests.length > 0 ? [{ id: 'header-pending', isHeader: true, title: 'Pending' }, ...pendingRequests] : []),
                           ...(friends.length > 0 ? [{ id: 'header-all', isHeader: true, title: `All Friends — ${friends.length}` }, ...friends] : [])]}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
                    renderItem={({ item }: { item: any }) => {
                        if (item.isHeader) {
                            return (
                                <Text className="text-[#B5BAC1] text-[11px] font-black uppercase mb-2 mt-4 tracking-widest pl-2">
                                    {item.title}
                                </Text>
                            );
                        }

                        const isRequest = !!item.sender;
                        const profile = isRequest ? item.sender : item.friend;

                        return (
                            <Reanimated.View entering={FadeIn.duration(400)}>
                                <TouchableOpacity
                                  onPress={() => isRequest ? null : handleStartDM(profile.id)}
                                  className="flex-row items-center py-3 px-2 rounded-xl active:bg-white/5"
                                >
                                  <Image source={{ uri: profile.imageUrl }} className="w-11 h-11 rounded-full bg-[#1E1F22]" />
                                  <View className="ml-4 flex-1">
                                    <Text className="text-white font-bold text-[16px]">{profile.name}</Text>
                                    <Text className={`text-[12px] font-bold ${isRequest ? 'text-[#B5BAC1]' : 'text-[#23A559]'}`}>
                                        {isRequest ? 'Incoming Request' : 'Online'}
                                    </Text>
                                  </View>
                                  {isRequest ? (
                                      <View className="flex-row">
                                          <TouchableOpacity
                                            onPress={() => handleAcceptRequest(item.senderId)}
                                            className="w-9 h-9 rounded-full bg-[#23A559]/20 items-center justify-center mr-2"
                                          >
                                            <Check size={18} color="#23A559" />
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            onPress={() => handleDeclineRequest(item.senderId)}
                                            className="w-9 h-9 rounded-full bg-[#F23F42]/20 items-center justify-center"
                                          >
                                            <X size={18} color="#F23F42" />
                                          </TouchableOpacity>
                                      </View>
                                  ) : (
                                      <MessageSquare size={18} color="#5865F2" />
                                  )}
                                </TouchableOpacity>
                            </Reanimated.View>
                        );
                    }}
                    ListEmptyComponent={
                        <View className="mt-20 items-center justify-center px-10">
                            <Users size={80} color="#1E1F22" />
                            <Text className="text-white text-xl font-black mt-4">No friends yet</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddFriend(true)}
                                className="mt-6 bg-[#5865F2] px-8 py-3.5 rounded-full shadow-lg shadow-[#5865F2]/40"
                            >
                                <Text className="text-white font-black">Add your first friend</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </View>
          )}
        </View>
      )}

      {/* Footer Profile Card */}
      <View className="bg-[#232428] mx-4 mb-4 mt-2 p-3 rounded-2xl flex-row items-center border border-white/5 shadow-2xl">
        <View className="relative">
          <Image source={{ uri: user?.imageUrl }} className="w-10 h-10 rounded-full" />
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#23A559] border-[3px] border-[#232428]" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-white font-black text-sm">{user?.firstName}</Text>
          <Text className="text-[#B5BAC1] text-[11px] font-bold uppercase tracking-widest opacity-60">
            @{user?.username || user?.firstName?.toLowerCase()}
          </Text>
        </View>
        <TouchableOpacity className="p-2 bg-white/5 rounded-full">
            <MoreVertical size={20} color="#DBDEE1" />
        </TouchableOpacity>
      </View>

      <AddFriendModal
        visible={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onFriendAdded={() => refetch()}
      />
    </SafeAreaView>
  );
}
