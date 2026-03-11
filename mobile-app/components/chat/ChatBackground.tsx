import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { ChatTheme } from '@/hooks/use-chat-theme';

interface ChatBackgroundProps {
    theme: ChatTheme | null | undefined;
    children: React.ReactNode;
}

export const ChatBackground = ({ theme, children }: ChatBackgroundProps) => {
    if (!theme) {
        return <View className="flex-1 bg-[#313338]">{children}</View>;
    }

    if (theme.backgroundImage) {
        return (
            <ImageBackground
                source={{ uri: theme.backgroundImage }}
                className="flex-1"
                resizeMode="cover"
            >
                <View className="flex-1 bg-black/40">
                    {children}
                </View>
            </ImageBackground>
        );
    }

    if (theme.backgroundColor) {
        return (
            <View className="flex-1" style={{ backgroundColor: theme.backgroundColor }}>
                <View className="flex-1 bg-black/10">
                    {children}
                </View>
            </View>
        );
    }

    return <View className="flex-1 bg-[#313338]">{children}</View>;
};
