import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Sparkles, X, MessageSquare, Users, Zap, Bot } from 'lucide-react-native';
import Reanimated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface CatchUpModalProps {
  visible: boolean;
  onClose: () => void;
  messages: any[];
  memberName: string;
}

export const CatchUpModal = ({ visible, onClose, messages, memberName }: CatchUpModalProps) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      // Simulate AI Processing
      const timer = setTimeout(() => {
        const mockSummaries = [
          `${memberName} mentioned they might be late for the meeting.`,
          `Discussion about the new design direction for the mobile app.`,
          `Shared a few GIFs and images from the weekend trip.`,
          `Asked if you're free for a quick sync later today.`
        ];
        setSummary(mockSummaries);
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, memberName]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/60">
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0"
        />

        <Reanimated.View
          entering={FadeInUp.springify().damping(15)}
          className="bg-[#2B2D31] rounded-t-[32px] min-h-[50%] p-6 border-t border-white/10"
        >
          <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-6" />

          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="bg-[#5865F2] p-2 rounded-xl mr-3">
                <Sparkles size={20} color="white" />
              </View>
              <View>
                <Text className="text-white font-black text-xl">Smart Catch-up</Text>
                <Text className="text-[#B5BAC1] text-xs font-bold uppercase tracking-wider">AI Generated Summary</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-white/5 p-2 rounded-full">
              <X size={20} color="#DBDEE1" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#5865F2" />
                <Text className="text-[#B5BAC1] mt-4 font-bold">Analyzing {messages.length} messages...</Text>
                <Text className="text-[#4E5058] text-[10px] mt-2 uppercase font-black tracking-tighter italic">Securing with End-to-End Privacy</Text>
              </View>
            ) : (
              <Reanimated.View entering={FadeInDown.duration(400)}>
                <View className="bg-white/5 p-4 rounded-2xl mb-4 border border-white/5">
                    <View className="flex-row items-center mb-3">
                        <Bot size={16} color="#5865F2" />
                        <Text className="text-[#5865F2] font-black text-[10px] ml-2 uppercase tracking-widest">Highlights</Text>
                    </View>
                    {summary.map((point, i) => (
                    <View key={i} className="flex-row mb-3 last:mb-0">
                        <View className="w-1.5 h-1.5 rounded-full bg-[#5865F2] mt-2 mr-3" />
                        <Text className="text-[#DBDEE1] text-[15px] leading-5 flex-1 font-medium">{point}</Text>
                    </View>
                    ))}
                </View>

                <View className="flex-row justify-between gap-3">
                    <TouchableOpacity className="flex-1 bg-[#4E5058]/30 p-4 rounded-2xl items-center flex-row justify-center">
                        <MessageSquare size={16} color="white" />
                        <Text className="text-white font-bold ml-2">Jump to Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onClose}
                        className="flex-1 bg-[#5865F2] p-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-[#5865F2]/40"
                    >
                        <Zap size={16} color="white" />
                        <Text className="text-white font-bold ml-2">Got it!</Text>
                    </TouchableOpacity>
                </View>

                <Text className="text-center text-[#4E5058] text-[10px] font-bold mt-6 uppercase tracking-widest">
                    AI can make mistakes. Verify important info.
                </Text>
              </Reanimated.View>
            )}
          </ScrollView>
        </Reanimated.View>
      </View>
    </Modal>
  );
};
