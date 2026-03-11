import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, Plus, Send, Hash, Settings as SettingsIcon, Users } from 'lucide-react-native';
import { format } from 'date-fns';
import { useSocket } from '@/hooks/use-socket';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { useChatTheme } from '@/hooks/use-chat-theme';
import { ChatBackground } from '@/components/chat/ChatBackground';
import { GifPicker } from '@/components/chat/GifPicker';
import { ThemePicker } from '@/components/chat/ThemePicker';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Palette, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react-native';
import { uploadFile } from '@/lib/upload';

export default function ChannelScreen() {
  const { user } = useUser();
  const { channelId, serverId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [content, setContent] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const insets = useSafeAreaInsets();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: channelData, isLoading: isChannelLoading } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const res = await api.get(`/api/channels/${channelId}`, {
        params: { serverId }
      });
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // Keep metadata fresh for 5 mins
  });

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMessagesLoading,
  } = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: async ({ pageParam }) => {
      const res = await api.get('/api/messages', {
        params: {
          channelId,
          cursor: pageParam,
        },
      });
      return res.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    enabled: !!channelId,
    staleTime: 5000, 
    // Fallback polling when socket is disconnected
    refetchInterval: isConnected ? false : 10000,
  });

  useEffect(() => {
    if (!socket || !channelId) return;

    const chatKey = `chat:${channelId}:messages`;

    socket.on(chatKey, (message: any) => {
      console.log(`[Socket] Received message via ${chatKey}:`, message.id);
      queryClient.setQueryData(['messages', channelId], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [{ items: [message], nextCursor: null }],
            pageParams: [null],
          };
        }

        // Avoid inserting duplicates (fully matched ID)
        const exists = oldData.pages.some((page: any) =>
          page.items.some((item: any) => item.id === message.id),
        );
        if (exists) return oldData;

        // CHECK FOR MATCHING OPTIMISTIC (TEMP) MESSAGE
        // We match by content + sender to "claim" the optimistic slot before the API returns
        let foundOptimistic = false;
        const newData = oldData.pages.map((page: any, index: number) => {
            if (index === 0) { // Usually optimistic is on the first page
                const items = page.items.map((item: any) => {
                    if (item.id.toString().startsWith('temp-') && item.content === message.content) {
                        foundOptimistic = true;
                        return message; // Swap it!
                    }
                    return item;
                });
                return { ...page, items };
            }
            return page;
        });

        if (foundOptimistic) return { ...oldData, pages: newData };

        // Fallback: regular insert
        const updatedPages = [...oldData.pages];
        updatedPages[0] = {
          ...updatedPages[0],
          items: [message, ...updatedPages[0].items],
        };

        return {
          ...oldData,
          pages: updatedPages,
        };
      });
    });

    return () => {
        socket.off(chatKey);
    };
  }, [socket, channelId, queryClient]);

  const { theme } = useChatTheme(channelId as string);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  const handleTyping = () => {
    if (!socket || !channelId) return;
    
    const chatId = channelId as string;
    const userName = user?.firstName || "Unknown";
    const userId = user?.id || "unknown";
    
    // Emit typing start
    socket.emit("typing:start", { chatId, userId, userName });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { chatId, userId });
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const onSend = async (overrideContent?: string, overrideFileUrl?: string) => {
    if ((!content.trim() && !overrideFileUrl) || !channelId) return;
    
    const userContent = overrideContent || content.trim();
    if (!overrideFileUrl) setContent('');

    // Stop typing when sending
    if (socket && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      socket.emit("typing:stop", { 
        chatId: channelId, 
        userId: user?.id 
      });
    }

    // Optimistic Update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      content: userContent,
      fileUrl: overrideFileUrl || null,
      createdAt: new Date().toISOString(),
      member: {
        profile: {
          name: user?.firstName || "You",
          imageUrl: user?.imageUrl || "https://github.com/shadcn.png" 
        }
      }
    };

    // Update Cache Optimistically
    queryClient.setQueryData(['messages', channelId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = [...oldData.pages];
        newPages[0] = {
            ...newPages[0],
            items: [optimisticMessage, ...newPages[0].items],
        };
        return { ...oldData, pages: newPages };
    });

    try {
      const res = await api.post(
        `/api/socket/messages`,
        {
          content: userContent,
          fileUrl: overrideFileUrl || null,
        },
        {
          params: {
            serverId,
            channelId,
          }
        }
      );

      const newMessage = res.data;

      // Replace optimistic message with real message (if socket didn't already swap it)
      queryClient.setQueryData(['messages', channelId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        
        // Check if the message was already added/swapped by the socket
        const alreadyHasReal = oldData.pages.some((page: any) => 
            page.items.some((item: any) => item.id === newMessage.id)
        );

        if (alreadyHasReal) {
            // Just clean up the optimistic one
            const newPages = oldData.pages.map((page: any) => ({
                ...page,
                items: page.items.filter((item: any) => item.id !== optimisticId)
            }));
            return { ...oldData, pages: newPages };
        }

        const newPages = oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) => 
                item.id === optimisticId ? newMessage : item
            )
        }));
        return { ...oldData, pages: newPages };
      });
    } catch (error) {
      console.error(error);
      // Rollback on error
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    }
  };

  if (isChannelLoading) return <View className="flex-1 bg-[#313338] items-center justify-center"><Text className="text-white">Loading channel...</Text></View>;

  const channel = channelData?.channel;
  const messages = messagesData?.pages.flatMap((page) => page.items) || [];

  return (
    <SafeAreaView className="flex-1 bg-[#313338]" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="pb-2 px-4 flex-row items-center border-b border-[#1E1F22]">
        <TouchableOpacity onPress={() => router.back()} className="mr-2">
            <ChevronLeft size={24} color="#DBDEE1" />
        </TouchableOpacity>
        <Hash size={20} color="#B5BAC1" className="mr-2" />
        <View className="flex-1">
            <Text className="text-white font-bold text-base">{channel?.name}</Text>
            <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <Text className="text-[#B5BAC1] text-[10px] font-bold">{isConnected ? 'Connected' : 'Offline'}</Text>
            </View>
        </View>
        <View className="flex-row items-center ml-2">
            <TouchableOpacity onPress={() => setShowThemePicker(true)} className="mx-2">
                <Palette size={22} color="#DBDEE1" />
            </TouchableOpacity>
            <TouchableOpacity className="mx-2"><Users size={22} color="#DBDEE1" /></TouchableOpacity>
        </View>
      </View>

      <ChatBackground theme={theme}>
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <MessageItem item={item} hasTheme={!!theme} />}
          ListFooterComponent={isFetchingNextPage ? <Text className="text-center text-[#B5BAC1] py-2">Loading more...</Text> : null}
          contentContainerStyle={{ paddingVertical: 10 }}
        />

        <TypingIndicator 
          chatId={channelId as string} 
          currentUserId={user?.id}
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 60 : 0}
        >
          <View
            className="p-4"
            style={{ paddingBottom: Platform.OS === 'android' ? insets.bottom || 8 : undefined }}
          >
            <View className="flex-row items-center bg-[#1E1F22] rounded-full px-4 py-2 border border-white/5">
              <TouchableOpacity 
                  onPress={() => setShowGifPicker(true)}
                  className="mr-1 p-1 bg-[#4E5058]/30 rounded-full"
              >
                  <Sparkles size={18} color="#FFD700" />
              </TouchableOpacity>
              <TouchableOpacity 
                  onPress={async () => {
                      const result = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ['images'],
                          allowsEditing: true,
                          quality: 0.7,
                      });
                      if (!result.canceled) {
                          try {
                              setIsUploading(true);
                              const uploadedUrl = await uploadFile(result.assets[0].uri);
                              if (uploadedUrl) {
                                  onSend("sent an image", uploadedUrl);
                              }
                          } finally {
                              setIsUploading(false);
                          }
                      }
                  }}
                  disabled={isUploading}
                  className="mr-2 p-1 bg-[#4E5058]/30 rounded-full"
              >
                  {isUploading ? <Loader2 size={18} color="#B5BAC1" className="animate-spin" /> : <ImageIcon size={18} color="#B5BAC1" />}
              </TouchableOpacity>
              <TextInput
                className="flex-1 text-[#DBDEE1] text-sm py-1"
                placeholder={`Message #${channel?.name}`}
                placeholderTextColor="#4E5058"
                value={content}
                onChangeText={(text) => {
                  setContent(text);
                  if (text.trim()) {
                    handleTyping();
                  }
                }}
                multiline
              />
              {content.trim() ? (
                  <TouchableOpacity onPress={() => onSend()} className="ml-2">
                      <Send size={24} color="#5865F2" />
                  </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </ChatBackground>

      <GifPicker 
        visible={showGifPicker} 
        onClose={() => setShowGifPicker(false)} 
        onSelect={(url) => {
            onSend("sent a GIF", url);
            setShowGifPicker(false);
        }}
      />

      <ThemePicker 
        visible={showThemePicker} 
        onClose={() => setShowThemePicker(false)} 
        chatId={channelId as string} 
      />
    </SafeAreaView>
  );
}

const MessageItem = React.memo(({ item, hasTheme }: { item: any, hasTheme?: boolean }) => {
    const isImage = item.fileUrl && !item.fileUrl.endsWith('.pdf');
    const isSystemMessage = item.content === "changed the chat wallpaper" || item.content === "cleared the chat theme";

    if (isSystemMessage) {
        return (
            <View className="flex-row items-center justify-center my-2 px-4 opacity-80">
                <View className="flex-row items-center bg-black/10 dark:bg-zinc-800/50 px-3 py-1 rounded-full border border-black/5">
                    <Palette size={12} color="#71717a" />
                    <Text className="text-[10px] font-medium text-zinc-500 ml-1">
                        <Text className="font-bold">{item.member.profile.name}</Text> {item.content}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="px-4 py-1 flex-row" style={{ minHeight: 60 }}>
            <Image source={{ uri: item.member.profile.imageUrl }} className="w-10 h-10 rounded-full" style={{ width: 40, height: 40, borderRadius: 20 }} />
            <View className="ml-3 flex-1">
                <View className={cn(
                    "p-3 rounded-2xl",
                    hasTheme ? "bg-black/30 backdrop-blur-md border border-white/10" : "bg-[#2B2D31]"
                )}>
                    <View className="flex-row items-baseline mb-1">
                        <Text className="text-white font-bold text-xs">{item.member.profile.name}</Text>
                        <Text className="text-[#B5BAC1] text-[9px] ml-2">
                            {format(new Date(item.createdAt), 'HH:mm')}
                        </Text>
                    </View>
                    
                    {isImage ? (
                        <View className="rounded-lg overflow-hidden mt-1 bg-black/20" style={{ width: 200, height: 200 }}>
                            <Image source={{ uri: item.fileUrl }} className="w-full h-full" resizeMode="cover" />
                        </View>
                    ) : (
                        <Text className="text-[#DBDEE1] text-sm">{item.content}</Text>
                    )}
                </View>
            </View>
        </View>
    );
});

// Helper for classNames in React Native
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
