import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { X, Check, Trash, Image as ImageIcon, Loader2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/lib/api';
import { uploadFile } from '@/lib/upload';

interface ThemePickerProps {
    visible: boolean;
    onClose: () => void;
    chatId: string;
}

const COLORS = [
    { name: "Default", value: null },
    { name: "Slate", value: "#334155" },
    { name: "Rose", value: "#4c0519" },
    { name: "Indigo", value: "#1e1b4b" },
    { name: "Emerald", value: "#064e3b" },
    { name: "Amber", value: "#451a03" },
    { name: "Sky", value: "#082f49" },
];

export const ThemePicker = ({ visible, onClose, chatId }: ThemePickerProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

    const onSave = async () => {
        try {
            setIsLoading(true);
            await api.post("/api/socket/chat-theme", {
                chatId,
                backgroundColor,
                backgroundImage,
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.7,
        });

        if (!result.canceled) {
            try {
                setIsLoading(true);
                const uploadedUrl = await uploadFile(result.assets[0].uri);
                if (uploadedUrl) {
                    setBackgroundImage(uploadedUrl);
                }
            } catch (error) {
                console.error("Upload error:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View className="flex-1 bg-black/60 items-center justify-center p-6">
                <View className="bg-[#313338] rounded-2xl w-full max-w-sm overflow-hidden">
                    <View className="p-6 border-b border-[#1E1F22] flex-row items-center justify-between">
                        <Text className="text-white text-xl font-bold">Chat Theme</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#B5BAC1" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-6 max-h-[400px]">
                        <Text className="text-[#B5BAC1] text-xs font-bold uppercase mb-3">Background Color</Text>
                        <View className="flex-row flex-wrap gap-3 mb-6">
                            {COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color.name}
                                    onPress={() => setBackgroundColor(color.value)}
                                    className="w-10 h-10 rounded-full border border-white/10 items-center justify-center"
                                    style={{ backgroundColor: color.value || '#1E1F22' }}
                                >
                                    {backgroundColor === color.value && (
                                        <Check size={20} color="white" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-[#B5BAC1] text-xs font-bold uppercase mb-3">Background Image</Text>
                        <TouchableOpacity 
                            onPress={pickImage}
                            className="bg-[#1E1F22] rounded-xl h-32 items-center justify-center border-2 border-dashed border-[#4E5058]"
                        >
                            {backgroundImage ? (
                                <Image source={{ uri: backgroundImage }} className="w-full h-full rounded-xl" />
                            ) : (
                                <View className="items-center">
                                    <ImageIcon size={32} color="#B5BAC1" />
                                    <Text className="text-[#B5BAC1] text-xs mt-2">Pick an image</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                    <View className="p-6 bg-[#2B2D31] flex-row gap-x-3">
                        <TouchableOpacity 
                            onPress={() => {
                                setBackgroundColor(null);
                                setBackgroundImage(null);
                            }}
                            className="flex-1 bg-[#F23F42]/10 h-11 rounded-lg items-center justify-center flex-row"
                        >
                            <Trash size={18} color="#F23F42" />
                            <Text className="text-[#F23F42] font-bold ml-2">Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={onSave}
                            disabled={isLoading}
                            className="flex-2 bg-[#5865F2] h-11 rounded-lg items-center justify-center px-8"
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold">Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
