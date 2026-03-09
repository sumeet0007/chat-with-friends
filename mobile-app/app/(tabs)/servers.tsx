import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useServerStore } from '@/hooks/use-server-store';
import { useRouter } from 'expo-router';
import { ChevronRight, Plus, Hash, Volume2, Video, Settings, UserPlus } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'AUDIO' | 'VIDEO';
}

interface Server {
  id: string;
  name: string;
  imageUrl?: string;
  channels: Channel[];
  // members will be loaded from the server detail endpoint
  members?: {
    id: string;
    profile: {
      id: string;
      name: string;
      imageUrl: string;
    };
  }[];
}

export default function ServersScreen() {
  const router = useRouter();
  const { servers, setServers, activeServerId, setActiveServerId } = useServerStore();
  const insets = useSafeAreaInsets();

  const { isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const res = await api.get('/api/servers');
      setServers(res.data);
      if (res.data.length > 0 && !activeServerId) {
        setActiveServerId(res.data[0].id);
      }
      return res.data;
    },
  });

  const activeServer = servers.find(s => s.id === activeServerId);

  const { data: activeServerDetail } = useQuery({
    queryKey: ['server-detail', activeServerId],
    queryFn: async () => {
      if (!activeServerId) return null;
      const res = await api.get(`/api/servers/${activeServerId}`);
      return res.data as Server;
    },
    enabled: !!activeServerId,
  });

  const members = activeServerDetail?.members ?? [];

  return (
    <SafeAreaView className="flex-1 bg-[#2B2D31]">
      <View className="flex-1 flex-row">
        {/* Vertical Sidebar */}
        <View className="w-20 bg-[#1E1F22] items-center pt-4">
          <TouchableOpacity className="w-12 h-12 rounded-2xl bg-[#313338] items-center justify-center mb-3">
            <Text className="text-[#23A559] text-2xl">+</Text>
          </TouchableOpacity>

          <View className="w-8 h-[2px] bg-[#313338] rounded-full mb-3" />

          <FlatList
            data={servers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setActiveServerId(item.id)}
                className="mb-3 relative items-center"
              >
                {activeServerId === item.id && (
                  <View className="absolute left-0 top-3 w-1 h-6 bg-white rounded-r-full" />
                )}
                <View
                  className={`w-12 h-12 rounded-2xl overflow-hidden justify-center items-center ${
                    activeServerId === item.id ? 'bg-[#5865F2] rounded-xl' : 'bg-[#313338]'
                  }`}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} className="w-12 h-12" />
                  ) : (
                    <Text className="text-white font-bold">{item.name?.[0]}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Channel List */}
        <View className="flex-1 bg-[#2B2D31]">
          {activeServer ? (
            <>
              <View className="p-4 border-b border-[#1E1F22] flex-row justify-between items-center">
                <Text className="text-white font-bold text-lg">{activeServer.name}</Text>
                <TouchableOpacity>
                  <Settings size={20} color="#DBDEE1" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-2 pt-4">
                {/* Invite Link */}
                <TouchableOpacity
                  className="bg-[#5865F2]/10 p-3 rounded-lg mb-6 flex-row items-center"
                  onPress={async () => {
                    try {
                      const res = await api.patch(`/api/servers/${activeServer.id}/invite-code`);
                      const inviteUrl = `https://your-site.vercel.app/invite/${res.data.inviteCode}`;
                      Alert.alert('Invite link', inviteUrl, [{ text: 'OK' }]);
                    } catch (e) {
                      Alert.alert('Error', 'Could not generate invite link.');
                    }
                  }}
                >
                  <UserPlus size={18} color="#5865F2" />
                  <Text className="text-[#5865F2] font-bold ml-2">Invite Friends</Text>
                </TouchableOpacity>

                {/* Text Channels */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-1 px-2">
                    <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase">
                      Text Channels
                    </Text>
                    <TouchableOpacity>
                      <Plus size={14} color="#B5BAC1" />
                    </TouchableOpacity>
                  </View>
                  {activeServer.channels
                    ?.filter((c: Channel) => c.type === 'TEXT')
                    .map((channel: Channel) => (
                      <TouchableOpacity
                        key={channel.id}
                        onPress={() =>
                          router.push(
                            `/(main)/channels/${channel.id}?serverId=${activeServer.id}` as any,
                          )
                        }
                        className="flex-row items-center p-2 rounded-md mb-1 active:bg-[#404249]/50"
                      >
                        <Hash size={18} color="#80848E" />
                        <Text className="text-[#949BA4] font-bold ml-2 text-base">
                          {channel.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>

                {/* Voice/Video Channels */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-1 px-2">
                    <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase">
                      Voice Channels
                    </Text>
                    <TouchableOpacity>
                      <Plus size={14} color="#B5BAC1" />
                    </TouchableOpacity>
                  </View>
                  {activeServer.channels
                    ?.filter((c: Channel) => c.type === 'AUDIO' || c.type === 'VIDEO')
                    .map((channel: Channel) => (
                      <TouchableOpacity
                        key={channel.id}
                        className="flex-row items-center p-2 rounded-md mb-1"
                      >
                        {channel.type === 'AUDIO' ? (
                          <Volume2 size={18} color="#80848E" />
                        ) : (
                          <Video size={18} color="#80848E" />
                        )}
                        <Text className="text-[#949BA4] font-bold ml-2 text-base">
                          {channel.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>

                {/* Members list */}
                {members.length > 0 && (
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-1 px-2">
                      <Text className="text-[#B5BAC1] text-[10px] font-bold uppercase">
                        Members
                      </Text>
                    </View>
                    {members.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        className="flex-row items-center p-2 rounded-md mb-1 active:bg-[#404249]/50"
                        onPress={() =>
                          router.push({
                            pathname: '/(main)/conversations/[memberId]',
                            params: { memberId: member.id, serverId: activeServer.id },
                          } as any)
                        }
                      >
                        <Image
                          source={{ uri: member.profile.imageUrl }}
                          className="w-8 h-8 rounded-full"
                          style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                        <Text className="text-[#DBDEE1] font-bold ml-3 text-base">
                          {member.profile.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </>
          ) : (
            <View className="flex-1 items-center justify-center p-6">
              <Text className="text-[#B5BAC1] text-lg text-center">
                Select a server to see channels
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
