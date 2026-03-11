"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/components/providers/socket-provider";

interface TypingIndicatorProps {
    chatId: string;
    currentUserId: string;
}

export const TypingIndicator = ({ chatId, currentUserId }: TypingIndicatorProps) => {
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        const typingKey = `chat:${chatId}:typing`;

        const handleTyping = ({ userId, name, isTyping }: { userId: string; name: string; isTyping: boolean }) => {
            if (userId === currentUserId) return;

            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                if (isTyping) {
                    newMap.set(userId, name);
                } else {
                    newMap.delete(userId);
                }
                return newMap;
            });
        };

        socket.on(typingKey, handleTyping);

        return () => {
            socket.off(typingKey, handleTyping);
        };
    }, [socket, chatId, currentUserId]);

    const typingUserNames = Array.from(typingUsers.values());

    if (typingUserNames.length === 0) return null;

    const displayText = typingUserNames.length === 1
        ? `${typingUserNames[0]} is typing...`
        : typingUserNames.length === 2
        ? `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`
        : `${typingUserNames.length} people are typing...`;

    return (
        <div className="px-4 pb-2 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <span>{displayText}</span>
            <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
        </div>
    );
};