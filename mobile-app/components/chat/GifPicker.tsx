import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Search, X, Sparkles } from 'lucide-react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GifPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

const GIPHY_API_KEY = "wmmYBIT84gLbFzM1W9Nvs9DeturM5zJP";
const SCREEN_WIDTH = Dimensions.get('window').width;

export const GifPicker = ({ visible, onClose, onSelect }: GifPickerProps) => {
    const [search, setSearch] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState<"gifs" | "stickers">("gifs");

    const fetchGifs = async (query: string = "") => {
        setIsLoading(true);
        try {
            const endpoint = query ? `search` : `trending`;
            const baseUrl = `https://api.giphy.com/v1/${type}/${endpoint}`;

            const params: Record<string, string | number> = {
                api_key: GIPHY_API_KEY,
                limit: 20,
                rating: "g",
            };

            if (query) {
                params.q = query;
            }

            const response = await axios.get(baseUrl, { params });
            setData(response.data.data);
        } catch (error) {
            console.error("Giphy fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                fetchGifs(search);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [search, type, visible]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-[#313338] rounded-t-[30px] h-[70%]">
                    <SafeAreaView className="flex-1" edges={['bottom']}>
                        {/* Header */}
                        <View className="p-4 flex-row items-center justify-between border-b border-[#1E1F22]">
                            <View className="flex-row items-center bg-[#1E1F22] rounded-full px-4 flex-1 h-10 mr-4">
                                <Search size={18} color="#B5BAC1" />
                                <TextInput
                                    className="flex-1 ml-2 text-white"
                                    placeholder="Search GIPHY..."
                                    placeholderTextColor="#B5BAC1"
                                    value={search}
                                    onChangeText={setSearch}
                                />
                                {search ? (
                                    <TouchableOpacity onPress={() => setSearch("")}>
                                        <X size={18} color="#B5BAC1" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            <TouchableOpacity onPress={onClose}>
                                <Text className="text-white font-bold">Done</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View className="flex-row px-4 py-2 border-b border-[#1E1F22]">
                            <TouchableOpacity 
                                onPress={() => setType("gifs")}
                                className={`mr-6 pb-2 ${type === 'gifs' ? 'border-b-2 border-[#5865F2]' : ''}`}
                            >
                                <Text className={`font-bold ${type === 'gifs' ? 'text-white' : 'text-[#B5BAC1]'}`}>GIFs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setType("stickers")}
                                className={`pb-2 ${type === 'stickers' ? 'border-b-2 border-[#5865F2]' : ''}`}
                            >
                                <Text className={`font-bold ${type === 'stickers' ? 'text-white' : 'text-[#B5BAC1]'}`}>Stickers</Text>
                            </TouchableOpacity>
                        </View>

                        {/* List */}
                        {isLoading ? (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator color="#5865F2" />
                            </View>
                        ) : (
                            <FlatList
                                data={data}
                                numColumns={2}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        onPress={() => onSelect(item.images.original.url)}
                                        style={{ width: SCREEN_WIDTH / 2 - 12, height: 150, margin: 4 }}
                                    >
                                        <Image 
                                            source={{ uri: item.images.fixed_width.url }} 
                                            className="w-full h-full rounded-lg bg-[#1E1F22]"
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ padding: 4 }}
                            />
                        )}
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
};
