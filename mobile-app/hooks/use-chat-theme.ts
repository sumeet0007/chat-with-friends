import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/use-socket";

export interface ChatTheme {
    id: string;
    chatId: string;
    backgroundImage: string | null;
    backgroundColor: string | null;
}

export const useChatTheme = (chatId: string | undefined) => {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const { data: theme, isLoading } = useQuery<ChatTheme | null>({
        queryKey: ["chat-theme", chatId],
        queryFn: async () => {
            if (!chatId) return null;
            const res = await api.get(`/api/chat-theme?chatId=${chatId}`);
            return res.data;
        },
        enabled: !!chatId,
        staleTime: 1000 * 60 * 30, // 30 mins
    });

    useEffect(() => {
        if (!socket || !chatId) return;

        const updateKey = `chat:${chatId}:theme:update`;

        socket.on(updateKey, (newTheme: ChatTheme) => {
            console.log("[ChatTheme] Update received:", newTheme);
            queryClient.setQueryData(["chat-theme", chatId], newTheme);
        });

        return () => {
            socket.off(updateKey);
        };
    }, [socket, chatId, queryClient]);

    return { theme, isLoading };
};
