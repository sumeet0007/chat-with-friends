import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTypingStore } from '@/hooks/use-typing-store';

interface TypingIndicatorProps {
  chatId: string;
  currentUserId?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ chatId, currentUserId }) => {
  const typingUsers = useTypingStore(state => state.getTypingUsers(chatId));
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Filter out current user from typing indicators
  const otherUsersTyping = typingUsers.filter(user => user.userId !== currentUserId);

  useEffect(() => {
    if (otherUsersTyping.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [otherUsersTyping.length, fadeAnim, scaleAnim]);

  if (otherUsersTyping.length === 0) return null;

  const getTypingText = () => {
    if (otherUsersTyping.length === 1) {
      return `${otherUsersTyping[0].userName} is typing...`;
    } else if (otherUsersTyping.length === 2) {
      return `${otherUsersTyping[0].userName} and ${otherUsersTyping[1].userName} are typing...`;
    } else {
      return `${otherUsersTyping[0].userName} and ${otherUsersTyping.length - 1} others are typing...`;
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
      className="px-4 py-2 mx-4 mb-2 bg-black/20 rounded-full border border-white/10"
    >
      <View className="flex-row items-center">
        <View className="flex-row mr-2">
          <TypingDots />
        </View>
        <Text className="text-[#B5BAC1] text-xs font-medium">
          {getTypingText()}
        </Text>
      </View>
    </Animated.View>
  );
};

const TypingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]);

    animation.start();

    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-center space-x-1">
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View
          key={index}
          style={{
            opacity: dot,
            transform: [
              {
                scale: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          }}
          className="w-1.5 h-1.5 bg-[#5865F2] rounded-full mx-0.5"
        />
      ))}
    </View>
  );
};