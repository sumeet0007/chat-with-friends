import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, Plus, Send, Phone, Video, Clock, Check, CheckCheck, Palette, Image as ImageIcon, Sparkles, Loader2, Smile, Zap, Bot } from 'lucide-react-native';
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
import { CatchUpModal } from '@/components/chat/CatchUpModal';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { uploadFile } from '@/lib/upload';
import Reanimated, { FadeInDown, Layout, FadeInUp } from 'react-native-reanimated';

// Optional Haptics check to avoid crashes
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {}

export default function ConversationScreen() {
  const { user } = useUser();
  const { memberId } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [content, setContent] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showCatchUp, setShowCatchUp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const insets = useSafeAreaInsets();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: conversationData, isLoading: isConvLoading } = useQuery({
    queryKey: ['conversation', memberId],
    queryFn: async () => {
      const res = await api.get(`/api/conversations/${memberId}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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
    staleTime: 5000,
    refetchInterval: isConnected ? false : 10000,
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

        const exists = oldData.pages.some((page: any) =>
          page.items.some((item: any) => item.id === message.id),
        );
        if (exists) return oldData;

        // Check for matching optimistic message and swap
        let foundOptimistic = false;
        const newData = oldData.pages.map((page: any, index: number) => {
            if (index === 0) {
                const items = page.items.map((item: any) => {
                    if (item.id.toString().startsWith('temp-') && item.content === message.content) {
                        foundOptimistic = true;
                        return message;
                    }
                    return item;
                });
                return { ...page, items };
            }
            return page;
        });

        if (foundOptimistic) return { ...oldData, pages: newData };

        const updatedPages = [...oldData.pages];
        updatedPages[0] = {
          ...updatedPages[0],
          items: [message, ...updatedPages[0].items],
        };

        return { ...oldData, pages: updatedPages };
      });
    });

    return () => {
        socket.off(chatKey);
    };
  }, [socket, conversationData?.conversation?.id, queryClient]);

  const { theme } = useChatTheme(conversationData?.conversation?.id);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  const handleTyping = () => {
    if (!socket || !conversationData?.conversation?.id) return;
    
    const chatId = conversationData.conversation.id;
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

  const onSend = useCallback(async (overrideContent?: string, overrideFileUrl?: string) => {
    if ((!content.trim() && !overrideFileUrl) || !conversationData?.conversation?.id) return;
    
    Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Medium);

    const userContent = overrideContent || content.trim();
    const conversationId = conversationData.conversation.id;
    if (!overrideFileUrl) setContent('');

    // Stop typing when sending
    if (socket && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      socket.emit("typing:stop", { 
        chatId: conversationId, 
        userId: user?.id 
      });
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      content: userContent,
      fileUrl: overrideFileUrl || null,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      member: {
        profile: {
          name: user?.firstName || "You",
          imageUrl: user?.imageUrl || "https://github.com/shadcn.png" 
        }
      }
    };

    queryClient.setQueryData(['direct-messages', conversationId], (oldData: any) => {
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
        `/api/socket/direct-messages`,
        { content: userContent, fileUrl: overrideFileUrl || null },
        { params: { conversationId } }
      );

      const newMessage = res.data;
      queryClient.setQueryData(['direct-messages', conversationId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        
        const alreadyHasReal = oldData.pages.some((page: any) =>
            page.items.some((item: any) => item.id === newMessage.id)
        );

        if (alreadyHasReal) {
            const newPages = oldData.pages.map((page: any) => ({
                ...page,
                items: page.items.filter((item: any) => item.id !== optimisticId)
            }));
            return { ...oldData, pages: newPages };
        }

        const newPages = oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) => item.id === optimisticId ? newMessage : item)
        }));
        return { ...oldData, pages: newPages };
      });
    } catch (error) {
      Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Error);
      queryClient.invalidateQueries({ queryKey: ['direct-messages', conversationId] });
    }
  }, [content, conversationData, user, queryClient]);

  const messages = useMemo(() => messagesData?.pages.flatMap((page) => page.items) || [], [messagesData]);

  if (isConvLoading) return <View className="flex-1 bg-[#313338] items-center justify-center"><Loader2 size={32} color="#5865F2" className="animate-spin" /></View>;

  const otherMember = conversationData?.otherMember;
  const conversationIdValue = conversationData?.conversation?.id;

  return (
    <SafeAreaView className="flex-1 bg-[#313338]" edges={['top', 'bottom']}>
      {/* Header with Presence Info */}
      <View className="pb-2 px-4 flex-row items-center border-b border-[#1E1F22] h-14">
        <TouchableOpacity onPress={() => {
            Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light);
            router.back();
        }} className="mr-2 p-1">
            <ChevronLeft size={24} color="#DBDEE1" />
        </TouchableOpacity>
        <Image source={{ uri: otherMember?.profile?.imageUrl }} className="w-9 h-9 rounded-full bg-[#1E1F22]" />
        <View className="ml-3 flex-1">
            <Text className="text-white font-bold text-base leading-tight">{otherMember?.profile?.name}</Text>
            <View className="flex-row items-center mt-0.5">
                <View className={`w-2 h-2 rounded-full mr-1.5 ${isConnected ? 'bg-[#23A559]' : 'bg-[#F23F42]'}`} />
                <Text className="text-[#B5BAC1] text-[11px] font-bold uppercase tracking-wider">
                    {isConnected ? 'Now Playing: Spotify' : 'Away'}
                </Text>
            </View>
        </View>
        <View className="flex-row items-center">
            <TouchableOpacity onPress={() => setShowThemePicker(true)} className="p-2 mr-1">
                <Palette size={22} color="#DBDEE1" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={() => router.push({ pathname: '/(main)/call', params: { conversationId: conversationIdValue, memberId: otherMember?.id, callType: 'audio' } as any })}>
              <Phone size={22} color="#DBDEE1" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={() => router.push({ pathname: '/(main)/call', params: { conversationId: conversationIdValue, memberId: otherMember?.id, callType: 'video' } as any })}>
              <Video size={22} color="#DBDEE1" />
            </TouchableOpacity>
        </View>
      </View>

      <ChatBackground theme={theme}>
        {/* AI Catch-up Banner */}
        {messages.length > 5 && (
            <Reanimated.View
                entering={FadeInUp.delay(500)}
                className="mx-4 mt-2 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
            >
                <View className="flex-row items-center flex-1">
                    <View className="bg-[#5865F2] p-1.5 rounded-lg mr-3 shadow-lg shadow-[#5865F2]/20">
                        <Bot size={16} color="white" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-[13px]">Smart Catch-up</Text>
                        <Text className="text-[#B5BAC1] text-[11px] font-medium mt-0.5">Summarize what you missed recently.</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light);
                        setShowCatchUp(true);
                    }}
                    className="bg-[#5865F2] px-4 py-2 rounded-full shadow-lg shadow-[#5865F2]/30"
                >
                    <Text className="text-white text-xs font-black uppercase tracking-widest">Catch Up</Text>
                </TouchableOpacity>
            </Reanimated.View>
        )}

        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <MessageItem
                item={item}
                hasTheme={!!theme}
                isFirstInGroup={index === messages.length - 1 || messages[index+1]?.member?.id !== item.member?.id}
            />
          )}
          ListFooterComponent={isFetchingNextPage ? <Loader2 size={20} color="#5865F2" className="animate-spin self-center py-4" /> : null}
          contentContainerStyle={{ paddingVertical: 16 }}
        />

        <TypingIndicator 
          chatId={conversationData?.conversation?.id} 
          currentUserId={user?.id}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 60 : 0}
        >
          <View className="p-4" style={{ paddingBottom: Platform.OS === 'android' ? insets.bottom || 8 : undefined }}>
            <View className="flex-row items-end bg-[#1E1F22] rounded-[24px] px-4 py-2 border border-white/5 shadow-2xl">
              <TouchableOpacity onPress={() => setShowGifPicker(true)} className="mb-1 p-1 bg-[#4E5058]/30 rounded-full mr-2">
                  <Sparkles size={18} color="#FFD700" />
              </TouchableOpacity>

              <TextInput
                className="flex-1 text-[#DBDEE1] text-[15px] min-h-[36px] max-h-[120px] py-2"
                placeholder={`Message @${otherMember?.profile?.name}`}
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

              <TouchableOpacity
                  onPress={async () => {
                      Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light);
                      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
                      if (!result.canceled) {
                          try {
                              setIsUploading(true);
                              const uploadedUrl = await uploadFile(result.assets[0].uri);
                              if (uploadedUrl) onSend("sent an image", uploadedUrl);
                          } finally {
                              setIsUploading(false);
                          }
                      }
                  }}
                  disabled={isUploading}
                  className="mb-1 p-1 ml-2"
              >
                  {isUploading ? <Loader2 size={20} color="#5865F2" className="animate-spin" /> : <ImageIcon size={22} color="#B5BAC1" />}
              </TouchableOpacity>

              {content.trim() ? (
                  <Reanimated.View entering={FadeInDown.duration(200)}>
                    <TouchableOpacity onPress={() => onSend()} className="mb-1 ml-2 bg-[#5865F2] w-8 h-8 rounded-full items-center justify-center">
                        <Send size={16} color="white" />
                    </TouchableOpacity>
                  </Reanimated.View>
              ) : (
                <TouchableOpacity className="mb-1 ml-2 p-1">
                    <Smile size={22} color="#B5BAC1" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </ChatBackground>

      <GifPicker visible={showGifPicker} onClose={() => setShowGifPicker(false)} onSelect={(url) => { onSend("sent a GIF", url); setShowGifPicker(false); }} />
      <ThemePicker visible={showThemePicker} onClose={() => setShowThemePicker(false)} chatId={conversationData?.conversation?.id} />
      <CatchUpModal
        visible={showCatchUp}
        onClose={() => setShowCatchUp(false)}
        messages={messages}
        memberName={otherMember?.profile?.name}
      />
    </SafeAreaView>
  );
}

const MessageItem = React.memo(({ item, hasTheme, isFirstInGroup }: { item: any, hasTheme?: boolean, isFirstInGroup: boolean }) => {
    const isImage = item.fileUrl && !item.fileUrl.endsWith('.pdf');
    const isSystemMessage = item.content === "changed the chat wallpaper" || item.content === "cleared the chat theme";
    const isOptimistic = item.isOptimistic;

    if (isSystemMessage) {
        return (
            <View className="flex-row items-center justify-center my-3 px-4">
                <View className="bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
                    <Text className="text-[11px] font-bold text-[#B5BAC1] uppercase tracking-tighter">
                        {item.member.profile.name} {item.content}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <Reanimated.View
            entering={FadeInDown.springify().damping(20).stiffness(90)}
            layout={Layout.springify()}
            className={cn("px-4 flex-row", isFirstInGroup ? "mt-4" : "mt-0.5")}
        >
            <View className="w-10 items-center">
                {isFirstInGroup ? (
                    <Image source={{ uri: item.member.profile.imageUrl }} className="w-9 h-9 rounded-full bg-[#1E1F22]" />
                ) : null}
            </View>

            <View className="ml-3 flex-1">
                {isFirstInGroup && (
                    <View className="flex-row items-baseline mb-0.5">
                        <Text className="text-white font-bold text-[15px]">{item.member.profile.name}</Text>
                        <Text className="text-[#B5BAC1] text-[10px] ml-2 font-medium">
                            {format(new Date(item.createdAt), 'h:mm a')}
                        </Text>
                    </View>
                )}

                <View className={cn(
                    "rounded-xl px-3 py-2 self-start max-w-[95%]",
                    hasTheme ? "bg-black/30 backdrop-blur-md border border-white/10" : "bg-[#2B2D31]",
                    isOptimistic && "opacity-60"
                )}>
                    {isImage ? (
                        <View className="rounded-lg overflow-hidden my-1 bg-black/20" style={{ width: 220, height: 220 }}>
                            <Image source={{ uri: item.fileUrl }} className="w-full h-full" resizeMode="cover" />
                        </View>
                    ) : (
                        <Text className="text-[#DBDEE1] text-[15px] leading-5 font-medium">{item.content}</Text>
                    )}

                    {isOptimistic && (
                        <View className="absolute -bottom-1 -right-1 bg-[#2B2D31] rounded-full p-0.5 border border-[#1E1F22]">
                            <Clock size={10} color="#B5BAC1" />
                        </View>
                    )}
                </View>
            </View>
        </Reanimated.View>
    );
});

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
