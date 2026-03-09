import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api, setAuthToken } from '@/lib/api';
import { ChevronLeft, Plus, Send, Phone, Video } from 'lucide-react-native';
import { format } from 'date-fns';
import { useSocket } from '@/hooks/use-socket';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConversationScreen() {
  const { memberId, serverId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [content, setContent] = useState('');
  const insets = useSafeAreaInsets();

  const { data: conversationData, isLoading: isConvLoading } = useQuery({
    queryKey: ['conversation', memberId],
    queryFn: async () => {
      const res = await api.get(`/api/conversations/${memberId}`);
      return res.data;
    },
  });

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMessagesLoading,
  } = useInfiniteQuery({
    queryKey: ['direct-messages', conversationData?.conversation?.id],
    queryFn: async ({ pageParam }) => {
      const res = await api.get('/api/direct-messages', {
        params: {
          conversationId: conversationData.conversation.id,
          cursor: pageParam,
        },
      });
      return res.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    enabled: !!conversationData?.conversation?.id,
    // Fallback polling when socket is disconnected
    refetchInterval: isConnected ? false : 1000,
  });

  useEffect(() => {
    if (!socket || !conversationData?.conversation?.id) return;

    const chatKey = `chat:${conversationData.conversation.id}:messages`;

    socket.on(chatKey, (message: any) => {
      queryClient.setQueryData(['direct-messages', conversationData.conversation.id], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [{ items: [message], nextCursor: null }],
            pageParams: [null],
          };
        }

        // Avoid inserting duplicates (e.g. optimistic update + socket echo)
        const exists = oldData.pages.some((page: any) =>
          page.items.some((item: any) => item.id === message.id),
        );
        if (exists) {
          return oldData;
        }

        const newData = [...oldData.pages];
        newData[0] = {
          ...newData[0],
          items: [message, ...newData[0].items],
        };

        return {
          ...oldData,
          pages: newData,
        };
      });
    });

    return () => {
        socket.off(chatKey);
    };
  }, [socket, conversationData?.conversation?.id, queryClient]);

  const onSend = async () => {
    if (!content.trim() || !conversationData?.conversation?.id) return;
    try {
      const conversationId = conversationData.conversation.id;

      const res = await api.post(
        `/api/socket/direct-messages`,
        {
          content,
          conversationId,
        },
        {
          params: {
            conversationId,
          },
        },
      );

      const newMessage = res.data;

      queryClient.setQueryData(
        ['direct-messages', conversationId],
        (oldData: any) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            return {
              pages: [{ items: [newMessage], nextCursor: null }],
              pageParams: [null],
            };
          }

          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            items: [newMessage, ...newPages[0].items],
          };

          return {
            ...oldData,
            pages: newPages,
          };
        },
      );

      setContent('');
    } catch (error) {
      console.error(error);
    }
  };

  if (isConvLoading) return <View className="flex-1 bg-[#313338] items-center justify-center"><Text className="text-white">Loading chat...</Text></View>;

  const otherMember = conversationData?.otherMember;
  const conversationIdValue = conversationData?.conversation?.id;
  const messages = messagesData?.pages.flatMap((page) => page.items) || [];

  return (
    <SafeAreaView className="flex-1 bg-[#313338]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="pb-2 px-4 flex-row items-center border-b border-[#1E1F22]">
        <TouchableOpacity onPress={() => router.back()} className="mr-2">
            <ChevronLeft size={24} color="#DBDEE1" />
        </TouchableOpacity>
        <Image source={{ uri: otherMember?.profile?.imageUrl }} className="w-8 h-8 rounded-full" />
        <View className="ml-3 flex-1">
            <Text className="text-white font-bold text-base">{otherMember?.profile?.name}</Text>
            <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <Text className="text-[#B5BAC1] text-[10px] font-bold">{isConnected ? 'Connected' : 'Offline'}</Text>
            </View>
        </View>
        <View className="flex-row ml-2">
            <TouchableOpacity
              className="mx-2"
              onPress={() => router.push({
                pathname: '/(main)/call',
                params: {
                  conversationId: conversationIdValue,
                  memberId: otherMember?.id,
                  memberName: otherMember?.profile?.name,
                  memberImage: otherMember?.profile?.imageUrl,
                  callType: 'audio',
                }
              })}
            >
              <Phone size={22} color="#DBDEE1" />
            </TouchableOpacity>
            <TouchableOpacity
              className="mx-2"
              onPress={() => router.push({
                pathname: '/(main)/call',
                params: {
                  conversationId: conversationIdValue,
                  memberId: otherMember?.id,
                  memberName: otherMember?.profile?.name,
                  memberImage: otherMember?.profile?.imageUrl,
                  callType: 'video',
                }
              })}
            >
              <Video size={22} color="#DBDEE1" />
            </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        inverted
        keyExtractor={(item, index) => `${item.id}:${index}`}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View className="px-4 py-2 flex-row">
            <Image source={{ uri: item.member.profile.imageUrl }} className="w-10 h-10 rounded-full" />
            <View className="ml-3 flex-1">
              <View className="flex-row items-baseline">
                <Text className="text-white font-bold text-sm">{item.member.profile.name}</Text>
                <Text className="text-[#B5BAC1] text-[10px] ml-2">
                    {format(new Date(item.createdAt), 'HH:mm')}
                </Text>
              </View>
              <Text className="text-[#DBDEE1] text-sm mt-1 leading-5">{item.content}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={isFetchingNextPage ? <Text className="text-center text-[#B5BAC1] py-2">Loading more...</Text> : null}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
      >
        <View
          className="p-4 bg-[#313338]"
          style={{ paddingBottom: Platform.OS === 'android' ? insets.bottom || 8 : undefined }}
        >
          <View className="flex-row items-center bg-[#1E1F22] rounded-full px-4 py-2">
            <TouchableOpacity className="mr-2 p-1 bg-[#4E5058]/30 rounded-full">
                <Plus size={20} color="#B5BAC1" />
            </TouchableOpacity>
            <TextInput
              className="flex-1 text-[#DBDEE1] text-sm py-1"
              placeholder={`Message @${otherMember?.profile?.name}`}
              placeholderTextColor="#4E5058"
              value={content}
              onChangeText={setContent}
              multiline
            />
            {content.trim() ? (
                <TouchableOpacity onPress={onSend} className="ml-2">
                    <Send size={24} color="#5865F2" />
                </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
