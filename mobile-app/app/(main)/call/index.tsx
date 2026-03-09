import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, Alert, Vibration
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Speaker
} from 'lucide-react-native';
import { api } from '@/lib/api';

export default function CallScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { conversationId, memberId, memberName, memberImage, callType } = useLocalSearchParams<{
    conversationId: string;
    memberId: string;
    memberName: string;
    memberImage: string;
    callType: 'audio' | 'video';
  }>();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType !== 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Simulate connection (replace with actual LiveKit integration)
    const connectTimeout = setTimeout(() => {
      setCallStatus('connected');
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleHangup = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallStatus('ended');

    try {
      await api.post('/api/socket/call', {
        conversationId,
        action: 'end',
        duration: formatDuration(callDuration),
      });
    } catch (e) {
      // ignore
    }

    router.back();
  };

  return (
    <View className="flex-1 bg-[#1E1F22] items-center justify-between py-16">
      {/* Top: Caller info */}
      <View className="items-center">
        <Image
          source={{ uri: memberImage as string || 'https://ui-avatars.com/api/?name=User&background=5865F2&color=fff' }}
          className="w-28 h-28 rounded-full mb-4"
          style={{ width: 112, height: 112, borderRadius: 56 }}
        />
        <Text className="text-white text-2xl font-bold">{memberName}</Text>
        <Text className="text-[#B5BAC1] text-sm mt-2">
          {callStatus === 'connecting' ? 'Connecting...' :
           callStatus === 'ended' ? 'Call Ended' :
           formatDuration(callDuration)}
        </Text>
        {callType === 'video' && (
          <View className="mt-2 px-3 py-1 bg-[#5865F2]/20 rounded-full">
            <Text className="text-[#5865F2] text-xs font-bold">VIDEO CALL</Text>
          </View>
        )}
      </View>

      {/* Middle: Self video preview placeholder */}
      {callType === 'video' && !isVideoOff && (
        <View className="w-36 h-52 bg-[#2B2D31] rounded-2xl items-center justify-center border border-[#404249] self-end mr-4">
          <Image
            source={{ uri: user?.imageUrl }}
            className="w-full h-full rounded-2xl"
            style={{ width: 144, height: 208, borderRadius: 16 }}
          />
          <Text className="text-white text-xs absolute bottom-2">You</Text>
        </View>
      )}

      {/* Bottom: Controls */}
      <View className="items-center w-full px-8">
        <View className="flex-row justify-center items-center gap-6 mb-8" style={{ gap: 24 }}>
          {/* Mute */}
          <TouchableOpacity
            onPress={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full items-center justify-center ${isMuted ? 'bg-[#F23F42]' : 'bg-[#404249]'}`}
            style={{ width: 56, height: 56 }}
          >
            {isMuted ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
          </TouchableOpacity>

          {/* Hang up */}
          <TouchableOpacity
            onPress={handleHangup}
            className="w-16 h-16 rounded-full bg-[#F23F42] items-center justify-center"
            style={{ width: 64, height: 64 }}
          >
            <PhoneOff size={28} color="white" />
          </TouchableOpacity>

          {/* Speaker / Video toggle */}
          {callType === 'video' ? (
            <TouchableOpacity
              onPress={() => setIsVideoOff(!isVideoOff)}
              className={`w-14 h-14 rounded-full items-center justify-center ${isVideoOff ? 'bg-[#F23F42]' : 'bg-[#404249]'}`}
              style={{ width: 56, height: 56 }}
            >
              {isVideoOff ? <VideoOff size={24} color="white" /> : <Video size={24} color="white" />}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-14 h-14 rounded-full items-center justify-center ${isSpeakerOn ? 'bg-[#5865F2]' : 'bg-[#404249]'}`}
              style={{ width: 56, height: 56 }}
            >
              <Speaker size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <Text className="text-[#4E5058] text-xs">
          {isMuted ? '🔇 Microphone muted' : '🎙️ Microphone active'}
        </Text>
      </View>
    </View>
  );
}
