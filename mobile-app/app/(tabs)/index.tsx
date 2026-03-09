import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, FlatList, TextInput } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MessageSquare, Users, UserPlus, Search, MoreVertical, LogOut, Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AddFriendModal } from '@/components/AddFriendModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Profile {
  id: string;
  name: string;
  imageUrl: string;
}

interface Member {
  id: string;
  profile: Profile;
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
  const insets = useSafeAreaInsets();

  console.log(insets, 'insets');
  console.log(insets.bottom, 'insets.bottom');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['friends-data'],
    queryFn: async () => {
      const res = await api.get('/api/friends');
      return res.data;
    },
  });

  const handleAcceptRequest = async (senderId: string) => {
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
    try {
      const res = await api.post('/api/friends/dm', { friendId });
      const { memberId } = res.data;
      router.push(`/(main)/conversations/${memberId}` as any);
    } catch (e) {
      console.error(e);
    }
  };

  const pendingRequests: FriendRequest[] = data?.requests || [];
  const friends: Friend[] = data?.friends || [];
  const members: Member[] = data?.members || [];

  return (
    <SafeAreaView className="flex-1 bg-[#313338]" edges={['top']}>
      {/* Header */}
      <View className="px-4 pb-2 flex-row justify-between items-center border-b border-[#1E1F22]">
        <Text className="text-white text-xl font-extrabold uppercase tracking-tight">
          {activeTab === 'MESSAGES' ? 'Direct Messages' : 'Friends'}
        </Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => setShowAddFriend(true)}
            className="mr-3 w-8 h-8 rounded-full bg-[#5865F2]/20 items-center justify-center"
            style={{ width: 32, height: 32 }}
          >
            <UserPlus size={18} color="#5865F2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signOut()}>
            <LogOut size={20} color="#F23F42" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="mx-4 mt-3 mb-2">
        <View className="bg-[#1E1F22] rounded-lg p-3 flex-row items-center h-10">
          <Search size={14} color="#4E5058" />
          <TextInput
            placeholder="Find or start a conversation"
            placeholderTextColor="#4E5058"
            className="ml-2 text-[#DBDEE1] text-xs font-bold flex-1"
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 my-1 border-b border-[#1E1F22]">
        <TouchableOpacity
          onPress={() => setActiveTab('MESSAGES')}
          className={`mr-6 pb-2 border-b-2 ${activeTab === 'MESSAGES' ? 'border-white' : 'border-transparent'}`}
        >
          <Text className={`${activeTab === 'MESSAGES' ? 'text-white' : 'text-[#B5BAC1]'} font-bold text-sm`}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('FRIENDS')}
          className={`pb-2 border-b-2 ${activeTab === 'FRIENDS' ? 'border-white' : 'border-transparent'}`}
        >
          <View className="flex-row items-center">
            <Text className={`${activeTab === 'FRIENDS' ? 'text-white' : 'text-[#B5BAC1]'} font-bold text-sm`}>Friends</Text>
            {pendingRequests.length > 0 && (
              <View className="ml-2 bg-[#F23F42] rounded-full w-4 h-4 items-center justify-center" style={{ width: 16, height: 16 }}>
                <Text className="text-white text-[9px] font-bold">{pendingRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white italic">Loading...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 mt-2">
          {activeTab === 'MESSAGES' ? (
            members.length > 0 ? (
              members.map((member: Member) => (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => router.push(`/(main)/conversations/${member.id}` as any)}
                  className="flex-row items-center py-3 active:bg-[#404249]/30 rounded-lg"
                >
                  <View className="relative">
                    <Image source={{ uri: member.profile.imageUrl }} className="w-10 h-10 rounded-full bg-[#5865F2]" style={{ width: 40, height: 40, borderRadius: 20 }} />
                    <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#23A559] border-2 border-[#313338]" style={{ width: 12, height: 12, borderRadius: 6 }} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-bold text-base">{member.profile.name}</Text>
                    <Text className="text-[#B5BAC1] text-xs font-medium mt-0.5">Tap to message</Text>
                  </View>
                  <MessageSquare size={18} color="#4E5058" />
                </TouchableOpacity>
              ))
            ) : (
              <View className="mt-16 items-center justify-center opacity-60">
                <MessageSquare size={72} color="#DBDEE1" />
                <Text className="text-[#DBDEE1] text-lg font-bold mt-4">No Direct Messages</Text>
                <Text className="text-[#B5BAC1] text-sm text-center px-10 mt-2">Add a friend first, then tap their profile to start a conversation.</Text>
                <TouchableOpacity
                  onPress={() => setShowAddFriend(true)}
                  className="mt-6 bg-[#5865F2] px-6 py-3 rounded-full flex-row items-center"
                >
                  <UserPlus size={16} color="white" />
                  <Text className="text-white font-bold ml-2">Add Friend</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <>
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <View className="mb-6">
                  <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase mb-3 tracking-widest">
                    Pending — {pendingRequests.length}
                  </Text>
                  {pendingRequests.map((r: FriendRequest) => (
                    <View key={r.id} className="flex-row items-center py-3 border-b border-[#1E1F22]/30">
                      <Image source={{ uri: r.sender.imageUrl }} className="w-10 h-10 rounded-full" style={{ width: 40, height: 40, borderRadius: 20 }} />
                      <View className="ml-3 flex-1">
                        <Text className="text-white font-bold text-base">{r.sender.name}</Text>
                        <Text className="text-[#B5BAC1] text-xs">Incoming Friend Request</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleAcceptRequest(r.senderId)}
                        className="w-9 h-9 rounded-full bg-[#23A559]/20 items-center justify-center mr-2"
                        style={{ width: 36, height: 36 }}
                      >
                        <Check size={16} color="#23A559" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeclineRequest(r.senderId)}
                        className="w-9 h-9 rounded-full bg-[#F23F42]/20 items-center justify-center"
                        style={{ width: 36, height: 36 }}
                      >
                        <X size={16} color="#F23F42" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Friends List */}
              {friends.length > 0 ? (
                <>
                  <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase mb-3 tracking-widest">
                    All Friends — {friends.length}
                  </Text>
                  {friends.map((f: Friend) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => handleStartDM(f.friend.id)}
                      className="flex-row items-center py-3 border-b border-[#1E1F22]/30"
                    >
                      <Image source={{ uri: f.friend.imageUrl }} className="w-10 h-10 rounded-full" style={{ width: 40, height: 40, borderRadius: 20 }} />
                      <View className="ml-3 flex-1">
                        <Text className="text-white font-bold text-base">{f.friend.name}</Text>
                        <Text className="text-[#23A559] text-xs font-medium">Online</Text>
                      </View>
                      <MessageSquare size={18} color="#5865F2" />
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                pendingRequests.length === 0 && (
                  <View className="mt-16 items-center justify-center opacity-60">
                    <Users size={72} color="#DBDEE1" />
                    <Text className="text-[#DBDEE1] text-lg font-bold mt-4">No Friends Yet</Text>
                    <Text className="text-[#B5BAC1] text-sm text-center px-10 mt-2">Add friends to start chatting!</Text>
                    <TouchableOpacity
                      onPress={() => setShowAddFriend(true)}
                      className="mt-6 bg-[#5865F2] px-6 py-3 rounded-full flex-row items-center"
                    >
                      <UserPlus size={16} color="white" />
                      <Text className="text-white font-bold ml-2">Add Friend</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Footer User Info */}
      <View
        className="bg-[#2B2D31] p-2 flex-row items-center px-4"
      >
        <View className="relative">
          <Image source={{ uri: user?.imageUrl }} className="w-8 h-8 rounded-full" style={{ width: 32, height: 32, borderRadius: 16 }} />
          <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#23A559] border-2 border-[#2B2D31]" style={{ width: 12, height: 12, borderRadius: 6 }} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-white font-bold text-xs">{user?.firstName}</Text>
          <Text className="text-[#B5BAC1] text-[10px] font-medium">@{user?.username || user?.firstName?.toLowerCase()}</Text>
        </View>
        <TouchableOpacity><MoreVertical size={20} color="#DBDEE1" /></TouchableOpacity>
      </View>

      {/* Add Friend Modal */}
      <AddFriendModal
        visible={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onFriendAdded={() => refetch()}
      />
    </SafeAreaView>
  );
}
