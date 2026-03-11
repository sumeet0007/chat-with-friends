import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink, Globe, Play, Youtube } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Reanimated, { FadeIn } from 'react-native-reanimated';

interface LinkPreviewProps {
  url: string;
}

export const LinkPreview = ({ url }: LinkPreviewProps) => {
  const [metadata, setMetadata] = useState<{
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    type?: 'video' | 'website' | 'youtube';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      // In a real app, you would call a backend endpoint that scrapes the URL
      // For now, let's simulate a beautiful metadata fetch
      setTimeout(() => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          setMetadata({
            title: "Exploring the New Features of Expo SDK 55",
            description: "Check out the latest updates in the Expo ecosystem, including improved router performance and new haptic APIs.",
            image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80",
            siteName: "YouTube",
            type: 'youtube'
          });
        } else if (url.includes('github.com')) {
          setMetadata({
            title: "expo/expo: An open-source platform for making universal native apps",
            description: "Expo is a framework and a platform for universal React applications. It is a set of tools and services built around React Native.",
            image: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            siteName: "GitHub",
            type: 'website'
          });
        } else {
          setMetadata({
            title: "Interactive Web Design Trends 2025",
            description: "Discover the future of the web with these upcoming design trends and technologies.",
            image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80",
            siteName: "ModernWeb",
            type: 'website'
          });
        }
        setLoading(false);
      }, 1500);
    };

    if (url) fetchMetadata();
  }, [url]);

  if (loading) return null; // Or a skeleton if preferred

  const handleOpen = () => {
    WebBrowser.openBrowserAsync(url);
  };

  const isYoutube = metadata?.type === 'youtube';

  return (
    <Reanimated.View
        entering={FadeIn.duration(400)}
        className="mt-2 bg-black/20 rounded-xl overflow-hidden border border-white/5"
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handleOpen}>
        {metadata?.image && (
          <View className="relative h-40 w-full bg-zinc-800">
            <Image
                source={{ uri: metadata.image }}
                className="w-full h-full"
                resizeMode="cover"
            />
            {isYoutube && (
                <View className="absolute inset-0 items-center justify-center bg-black/20">
                    <View className="bg-red-600 w-14 h-10 rounded-xl items-center justify-center shadow-lg">
                        <Play size={24} color="white" fill="white" />
                    </View>
                </View>
            )}
          </View>
        )}

        <View className="p-3">
          <View className="flex-row items-center mb-1">
            {isYoutube ? <Youtube size={14} color="#FF0000" /> : <Globe size={14} color="#B5BAC1" />}
            <Text className="text-[#B5BAC1] text-[10px] font-black uppercase ml-1.5 tracking-widest">
                {metadata?.siteName || 'Link'}
            </Text>
          </View>

          <Text className="text-[#5865F2] font-bold text-sm mb-1" numberOfLines={1}>
            {metadata?.title}
          </Text>

          <Text className="text-[#DBDEE1] text-[11px] leading-4" numberOfLines={2}>
            {metadata?.description}
          </Text>
        </View>
      </TouchableOpacity>
    </Reanimated.View>
  );
};
