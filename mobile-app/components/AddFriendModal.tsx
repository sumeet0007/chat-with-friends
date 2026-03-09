import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  FlatList, Modal, ActivityIndicator, Alert
} from 'react-native';
import { api } from '@/lib/api';
import { UserPlus, Search, X, Check, Clock, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface UserResult {
  id: string;
  name: string;
  imageUrl: string;
  email: string;
  isFriend: boolean;
  hasSentRequest: boolean;
  hasReceivedRequest: boolean;
}

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onFriendAdded?: () => void;
}

export function AddFriendModal({ visible, onClose, onFriendAdded }: AddFriendModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/api/users/search', { params: { q: text.trim() } });
        setResults(res.data || []);
      } catch (e) {
        console.error(e);
        Alert.alert(
          'Search failed',
          'Could not search users right now. Please check your connection and try again.',
        );
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  const sendFriendRequest = async (userId: string) => {
    setLoadingId(userId);
    try {
      await api.post('/api/friends/request', { receiverId: userId });
      setResults(prev => prev.map(u => u.id === userId ? { ...u, hasSentRequest: true } : u));
      onFriendAdded?.();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data || 'Failed to send friend request');
    } finally {
      setLoadingId(null);
    }
  };

  const acceptFriendRequest = async (userId: string) => {
    setLoadingId(userId);
    try {
      await api.post('/api/friends/respond', { senderId: userId, action: 'accept' });
      setResults(prev => prev.map(u => u.id === userId ? { ...u, isFriend: true, hasReceivedRequest: false } : u));
      onFriendAdded?.();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data || 'Failed to accept request');
    } finally {
      setLoadingId(null);
    }
  };

  const startDM = async (userId: string) => {
    setLoadingId(userId);
    try {
      const res = await api.post('/api/friends/dm', { friendId: userId });
      const { memberId } = res.data;
      onClose();
      // Use string interpolation to navigate — avoids typed route issues
      router.push(`/(main)/conversations/${memberId}` as any);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data || 'Failed to start conversation');
    } finally {
      setLoadingId(null);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  const renderActionButton = (user: UserResult) => {
    const isLoading = loadingId === user.id;

    if (isLoading) {
      return (
        <View className="w-9 h-9 items-center justify-center">
          <ActivityIndicator size="small" color="#5865F2" />
        </View>
      );
    }

    if (user.isFriend) {
      return (
        <TouchableOpacity
          onPress={() => startDM(user.id)}
          className="bg-[#5865F2] rounded-full w-9 h-9 items-center justify-center"
          style={{ width: 36, height: 36 }}
        >
          <MessageSquare size={16} color="white" />
        </TouchableOpacity>
      );
    }

    if (user.hasSentRequest) {
      return (
        <View className="bg-[#4E5058] rounded-full w-9 h-9 items-center justify-center" style={{ width: 36, height: 36 }}>
          <Clock size={16} color="#B5BAC1" />
        </View>
      );
    }

    if (user.hasReceivedRequest) {
      return (
        <TouchableOpacity
          onPress={() => acceptFriendRequest(user.id)}
          className="bg-[#23A559] rounded-full w-9 h-9 items-center justify-center"
          style={{ width: 36, height: 36 }}
        >
          <Check size={16} color="white" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => sendFriendRequest(user.id)}
        className="bg-[#5865F2]/20 border border-[#5865F2] rounded-full w-9 h-9 items-center justify-center"
        style={{ width: 36, height: 36 }}
      >
        <UserPlus size={16} color="#5865F2" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-[#313338]">
        {/* Header */}
        <View className="pt-6 pb-4 px-4 border-b border-[#1E1F22]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">Add Friends</Text>
            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-[#4E5058]/50 items-center justify-center"
              style={{ width: 32, height: 32 }}
            >
              <X size={16} color="#DBDEE1" />
            </TouchableOpacity>
          </View>
          <Text className="text-[#B5BAC1] text-sm mb-4">
            You can add friends by their name or email address.
          </Text>
          {/* Search Input */}
          <View className="flex-row items-center bg-[#1E1F22] rounded-xl px-3 py-2.5">
            <Search size={18} color="#4E5058" />
            <TextInput
              className="flex-1 text-[#DBDEE1] text-sm ml-2"
              placeholder="Search users..."
              placeholderTextColor="#4E5058"
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <X size={16} color="#4E5058" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        {isSearching ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#5865F2" />
            <Text className="text-[#B5BAC1] text-sm mt-3">Searching...</Text>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
            renderItem={({ item }) => (
              <View className="flex-row items-center py-3 border-b border-[#1E1F22]/50">
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-11 h-11 rounded-full"
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-bold text-sm">{item.name}</Text>
                  <Text className="text-[#B5BAC1] text-xs mt-0.5">
                    {item.isFriend ? '✓ Already friends' :
                     item.hasSentRequest ? '⏳ Request sent' :
                     item.hasReceivedRequest ? '📨 Wants to friend you' :
                     item.email}
                  </Text>
                </View>
                {renderActionButton(item)}
              </View>
            )}
          />
        ) : query.length > 0 && !isSearching ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-20 h-20 rounded-full bg-[#2B2D31] items-center justify-center mb-4">
              <Search size={36} color="#4E5058" />
            </View>
            <Text className="text-white font-bold text-lg">No users found</Text>
            <Text className="text-[#B5BAC1] text-sm text-center mt-2">
              No one matched "{query}". Try searching by full name or email.
            </Text>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-20 h-20 rounded-full bg-[#2B2D31] items-center justify-center mb-4">
              <UserPlus size={36} color="#5865F2" />
            </View>
            <Text className="text-white font-bold text-lg">Find your friends</Text>
            <Text className="text-[#B5BAC1] text-sm text-center mt-2">
              Search by name or email to find people you know.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
