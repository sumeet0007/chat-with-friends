import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, Image,
    Vibration, Animated, Easing, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, PhoneOff, Video } from 'lucide-react-native';
import { useSocket } from '@/hooks/use-socket';
import { useUser } from '@clerk/clerk-expo';
import { api } from '@/lib/api';
import RNCallKeep from 'react-native-callkeep';

interface IncomingCall {
    conversationId: string;
    serverId: string;
    callerMemberId: string;
    callType: 'audio' | 'video';
    caller: {
        id: string;
        name: string;
        imageUrl: string;
    };
}

export const IncomingCallOverlay = () => {
    const { user } = useUser();
    const { socket } = useSocket();
    const router = useRouter();
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const incomingCallRef = useRef<IncomingCall | null>(null);

    // Animations
    const slideAnim = useRef(new Animated.Value(-300)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

    const showOverlay = (data: IncomingCall) => {
        setIncomingCall(data);
        incomingCallRef.current = data;

        // 1. Show Native Call UI (CallKeep)
        if (Platform.OS !== 'web') {
            RNCallKeep.displayIncomingCall(
                data.conversationId,
                data.caller.name,
                data.caller.name,
                'generic',
                data.callType === 'video'
            );
        }

        // 2. Show In-App UI (Overlay)
        if (Platform.OS !== 'web') {
            Vibration.vibrate([0, 500, 1000], true);
        }

        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 55,
        }).start();

        pulseLoop.current = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        pulseLoop.current.start();
    };

    const hideOverlay = (onDone?: () => void) => {
        Vibration.cancel();
        pulseLoop.current?.stop();

        if (Platform.OS !== 'web' && incomingCallRef.current) {
            RNCallKeep.endAllCalls();
        }

        Animated.timing(slideAnim, {
            toValue: -300,
            duration: 250,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }).start(() => {
            setIncomingCall(null);
            incomingCallRef.current = null;
            slideAnim.setValue(-300);
            pulseAnim.setValue(1);
            onDone?.();
        });
    };

    useEffect(() => {
        if (!socket || !user?.id) return;

        // CallKeep Event Listeners
        if (Platform.OS !== 'web') {
            RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
                onAccept();
            });

            RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
                onDecline();
            });
        }

        const callsKey = `user:${user.id}:calls`;
        const handler = (data: any) => {
            if (data.type === 'incoming_call') {
                showOverlay(data as IncomingCall);
            } else if (data.type === 'call_cancelled' || data.type === 'call_rejected') {
                hideOverlay();
            }
        };

        socket.on(callsKey, handler);
        return () => {
            socket.off(callsKey, handler);
            if (Platform.OS !== 'web') {
                RNCallKeep.removeEventListener('answerCall');
                RNCallKeep.removeEventListener('endCall');
            }
            Vibration.cancel();
        };
    }, [socket, user?.id]);

    const onAccept = () => {
        const snapshot = incomingCallRef.current;
        if (!snapshot) return;

        hideOverlay(() => {
            router.push({
                pathname: '/(main)/call',
                params: {
                    conversationId: snapshot.conversationId,
                    memberId: snapshot.callerMemberId,
                    memberName: snapshot.caller.name,
                    memberImage: snapshot.caller.imageUrl,
                    callType: snapshot.callType || 'audio',
                },
            } as any);
        });
    };

    const onDecline = async () => {
        const snapshot = incomingCallRef.current;
        if (!snapshot) return;

        const { conversationId } = snapshot;
        hideOverlay();
        try {
            await api.post('/api/socket/call', { conversationId, action: 'reject' });
        } catch (e) {}
    };

    if (!incomingCall) return null;

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <View
                className="bg-[#1E1F22] mx-3 mt-14 rounded-[32px] border border-white/10 shadow-2xl p-5"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 24,
                }}
            >
                <View className="flex-row items-center mb-4">
                    <View className="bg-[#5865F2]/20 p-1.5 rounded-lg">
                         {incomingCall.callType === 'video'
                            ? <Video size={14} color="#5865F2" />
                            : <Phone size={14} color="#23A559" />
                        }
                    </View>
                    <Text className="text-[#B5BAC1] text-[10px] font-black ml-2 uppercase tracking-widest">
                        Incoming {incomingCall.callType} Call
                    </Text>
                </View>

                <View className="flex-row items-center">
                    <Image
                        source={{ uri: incomingCall.caller.imageUrl }}
                        className="w-16 h-16 rounded-full border-2 border-[#5865F2]"
                    />
                    <View className="ml-4 flex-1">
                        <Text className="text-white text-xl font-black">{incomingCall.caller.name}</Text>
                        <Text className="text-[#B5BAC1] text-sm font-bold">is calling you...</Text>
                    </View>
                </View>

                <View className="flex-row justify-end mt-6 space-x-4 gap-4">
                    <TouchableOpacity
                        onPress={onDecline}
                        className="w-14 h-14 rounded-full bg-[#F23F42] items-center justify-center shadow-lg shadow-[#F23F42]/40"
                    >
                        <PhoneOff size={24} color="white" />
                    </TouchableOpacity>

                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            onPress={onAccept}
                            className="w-14 h-14 rounded-full bg-[#23A559] items-center justify-center shadow-lg shadow-[#23A559]/40"
                        >
                             {incomingCall.callType === 'video'
                                ? <Video size={24} color="white" />
                                : <Phone size={24} color="white" />
                            }
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        </Animated.View>
    );
};
