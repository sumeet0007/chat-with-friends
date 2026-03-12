import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, Alert, Vibration, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Speaker, RefreshCw } from 'lucide-react-native';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/use-socket';
import { 
  LiveKitRoom, 
  VideoTrack,
  useTracks, 
  useLocalParticipant,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import type { TrackReference } from '@livekit/components-react';
import InCallManager from 'react-native-incall-manager';
import * as Haptics from 'expo-haptics';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_API_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || '';

export default function CallScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { socket } = useSocket();
  const { conversationId, memberId, memberName, memberImage, callType } = useLocalSearchParams<{
    conversationId: string;
    memberId: string;
    memberName: string;
    memberImage: string;
    callType: 'audio' | 'video';
  }>();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType !== 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(callType === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [token, setToken] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callStatusRef = useRef<'connecting' | 'connected' | 'ended'>('connecting');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await api.get('/api/livekit', {
          params: {
            room: conversationId,
            username: user?.username || user?.firstName || 'User'
          }
        });
        setToken(response.data.token);
      } catch (error) {
        console.error("Token fetch error:", error);
        Alert.alert("Error", "Could not join the call. Please try again.");
        router.back();
      }
    };

    fetchToken();
    
    // Manage audio routing
    InCallManager.start({ media: callType === 'video' ? 'video' : 'audio' });
    InCallManager.setSpeakerphoneOn(callType === 'video');

    return () => {
      InCallManager.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    callStatusRef.current = callStatus;
    if (callStatus === 'connected') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [callStatus]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const callKey = `user:${user.id}:calls`;

    const handler = (data: any) => {
      if (data.conversationId !== conversationId) return;

      if (data.type === 'call_rejected') {
        setCallStatus('ended');
        InCallManager.stop();
        if (timerRef.current) clearInterval(timerRef.current);
        router.back();
        setTimeout(() => Alert.alert('Call Declined', 'Your call was declined.'), 300);
      } else if (data.type === 'call_cancelled') {
        setCallStatus('ended');
        InCallManager.stop();
        if (timerRef.current) clearInterval(timerRef.current);
        router.back();
      }
    };

    socket.on(callKey, handler);
    return () => socket.off(callKey, handler);
  }, [socket, user?.id, conversationId]);

  useEffect(() => {
    if (callStatus === 'connected' && !timerRef.current) {
        timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    }
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleHangup = async () => {
    const wasConnecting = callStatusRef.current === 'connecting';
    setCallStatus('ended');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();

    try {
      await api.post('/api/socket/call', {
        conversationId,
        action: wasConnecting ? 'cancel' : 'end',
        duration: wasConnecting ? undefined : formatDuration(callDuration),
      });
    } catch (e) {}
  };

  if (!token) {
    return (
        <View className="flex-1 bg-[#1E1F22] items-center justify-center">
            <Text className="text-white font-bold">Connecting to server...</Text>
        </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={LIVEKIT_URL}
      token={token}
      connect={true}
      audio={true}
      video={callType === 'video'}
      onConnected={() => setCallStatus('connected')}
      onDisconnected={handleHangup}
    >
        <CallContent 
            memberName={memberName as string}
            memberImage={memberImage as string}
            userImage={user?.imageUrl as string}
            callType={callType as 'audio' | 'video'}
            callStatus={callStatus}
            callDuration={callDuration}
            formatDuration={formatDuration}
            handleHangup={handleHangup}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            isVideoOff={isVideoOff}
            setIsVideoOff={setIsVideoOff}
            isSpeakerOn={isSpeakerOn}
            setIsSpeakerOn={setIsSpeakerOn}
        />
    </LiveKitRoom>
  );
}

function CallContent({ 
    memberName, 
    memberImage, 
    userImage,
    callType, 
    callStatus, 
    callDuration,
    formatDuration,
    handleHangup,
    isMuted,
    setIsMuted,
    isVideoOff,
    setIsVideoOff,
    isSpeakerOn,
    setIsSpeakerOn
}: any) {
    const { localParticipant } = useLocalParticipant();
    const tracks = useTracks([
        { source: Track.Source.Camera, withPlaceholder: true },
        { source: Track.Source.ScreenShare, withPlaceholder: false },
    ]);

    const remoteTrack = tracks.find(
      t => !t.participant.isLocal && t.source === Track.Source.Camera && 'publication' in t
    ) as TrackReference | undefined;

    const localCameraTrack = tracks.find(
      t => t.participant.isLocal && t.source === Track.Source.Camera && 'publication' in t
    ) as TrackReference | undefined;

    useEffect(() => {
        localParticipant?.setMicrophoneEnabled(!isMuted);
    }, [isMuted, localParticipant]);

    useEffect(() => {
        localParticipant?.setCameraEnabled(!isVideoOff);
    }, [isVideoOff, localParticipant]);

    useEffect(() => {
        InCallManager.setSpeakerphoneOn(isSpeakerOn);
    }, [isSpeakerOn]);

    const toggleCamera = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // LiveKit handles camera switching internally when called multiple times on some platforms,
        // but for high-level React Native SDK, we usually use the participant method if available.
        // If not, we toggle video off and on.
        setIsVideoOff(true);
        setTimeout(() => setIsVideoOff(false), 100);
    };

  return (
    <View className="flex-1 bg-[#111214]">
      {/* Background: Remote Video (Fullscreen) */}
      {callType === 'video' && remoteTrack && (
        <View className="absolute inset-0 bg-black">
             <VideoTrack 
                trackRef={remoteTrack}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
        </View>
      )}

      {/* Overlay Content */}
      <View className="flex-1 justify-between py-16 px-6">

        {/* Top: Caller info */}
        <View className="items-center z-10">
          {!remoteTrack && (
            <Image
              source={{ uri: memberImage || 'https://ui-avatars.com/api/?name=User&background=5865F2&color=fff' }}
              className="w-28 h-28 rounded-full mb-6 border-4 border-[#5865F2]"
              style={{ width: 112, height: 112, borderRadius: 56 }}
            />
          )}
          <Text className="text-white text-3xl font-black shadow-lg text-center">{memberName}</Text>
          <View className="bg-black/30 px-4 py-1 rounded-full mt-3">
            <Text className="text-white text-sm font-bold">
              {callStatus === 'connecting' ? 'RINGING...' :
               callStatus === 'ended' ? 'CALL ENDED' :
               formatDuration(callDuration)}
            </Text>
          </View>
        </View>

        {/* Middle: Self video preview (Floating) */}
        {callType === 'video' && (
          <View className="w-32 h-48 bg-[#2B2D31] rounded-2xl items-center justify-center border-2 border-white/20 self-end mb-4 z-20 overflow-hidden shadow-2xl">
            {localParticipant && localCameraTrack && !isVideoOff ? (
               <VideoTrack
                  trackRef={localCameraTrack}
                  style={{ width: '100%', height: '100%' }}
                  zOrder={1}
              />
            ) : (
              <Image
                  source={{ uri: userImage }}
                  className="w-full h-full opacity-40"
              />
            )}
            <TouchableOpacity
                onPress={toggleCamera}
                className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full"
            >
                <RefreshCw size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom: Controls */}
        <View className="items-center w-full">
          <View className="flex-row justify-between items-center w-full px-4 mb-8">
            {/* Speaker / Video toggle */}
            <TouchableOpacity
                onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`w-14 h-14 rounded-full items-center justify-center ${isSpeakerOn ? 'bg-white' : 'bg-[#404249]'}`}
            >
                <Speaker size={24} color={isSpeakerOn ? 'black' : 'white'} />
            </TouchableOpacity>

            {/* Mute */}
            <TouchableOpacity
                onPress={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full items-center justify-center ${isMuted ? 'bg-[#F23F42]' : 'bg-[#404249]'}`}
            >
                {isMuted ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
            </TouchableOpacity>

             {/* Video toggle (for audio calls) or Flip (for video) */}
             {callType === 'video' ? (
                <TouchableOpacity
                    onPress={() => setIsVideoOff(!isVideoOff)}
                    className={`w-14 h-14 rounded-full items-center justify-center ${isVideoOff ? 'bg-[#F23F42]' : 'bg-[#404249]'}`}
                >
                    {isVideoOff ? <VideoOff size={24} color="white" /> : <VideoIcon size={24} color="white" />}
                </TouchableOpacity>
             ) : (
                <View className="w-14" /> // Spacer
             )}
          </View>

          {/* Hang up (Big Red Button) */}
          <TouchableOpacity
            onPress={handleHangup}
            className="w-20 h-20 rounded-full bg-[#F23F42] items-center justify-center shadow-xl shadow-[#F23F42]/40"
          >
            <PhoneOff size={32} color="white" />
          </TouchableOpacity>

          <Text className="text-[#B5BAC1] text-[10px] font-black uppercase mt-6 tracking-widest">
            End Call
          </Text>
        </View>
      </View>
    </View>
  );
}
