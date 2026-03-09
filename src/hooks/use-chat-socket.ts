"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocket } from "@/components/providers/socket-provider";
import { Message, DirectMessage, Member, Profile } from "@prisma/client";

type MessageWithMember = (Message | DirectMessage) & {
    member: Member & {
        profile: Profile;
    };
    replyTo?: (Message | DirectMessage) & {
        member: Member & {
            profile: Profile;
        };
    } | null;
};

type ChatEventsProps = {
    addKey: string;
    updateKey: string;
    queryKey: string;
}

export const useChatSocket = ({
    addKey,
    updateKey,
    queryKey
}: ChatEventsProps) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) {
            console.log("[useChatSocket] Socket not connected");
            return;
        }

        console.log("[useChatSocket] Listening for events:", { addKey, updateKey, queryKey });

        const handleAddMessage = (message: MessageWithMember) => {
            console.log("[useChatSocket] Received new message:", message);
            queryClient.setQueryData([queryKey], (oldData: any) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    console.log("[useChatSocket] No existing data, creating new page");
                    return {
                        pages: [{
                            items: [message],
                        }],
                        pageParams: [undefined]
                    };
                }

                // Deduplication: Avoid adding the same message twice if the socket event
                // and the API response arrive in close proximity.
                const isDuplicate = oldData.pages.some((page: any) =>
                    page.items.some((item: any) => item.id === message.id)
                );

                if (isDuplicate) {
                    console.log("[useChatSocket] Duplicate message, skipping");
                    return oldData;
                }

                console.log("[useChatSocket] Adding message to cache");
                const newData = [...oldData.pages];

                newData[0] = {
                    ...newData[0],
                    items: [
                        message,
                        ...newData[0].items,
                    ]
                };

                return {
                    ...oldData,
                    pages: newData,
                };
            });
        };

        const handleUpdateMessage = (message: MessageWithMember) => {
            console.log("[useChatSocket] Received message update:", message);
            queryClient.setQueryData([queryKey], (oldData: any) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return oldData;
                }

                const newData = oldData.pages.map((page: any) => {
                    return {
                        ...page,
                        items: page.items.map((item: any) => {
                            if (item.id === message.id) {
                                return message;
                            }
                            return item;
                        })
                    }
                });

                return {
                    ...oldData,
                    pages: newData,
                };
            });
        };

        socket.on(addKey, handleAddMessage);
        socket.on(updateKey, handleUpdateMessage);

        return () => {
            socket.off(addKey, handleAddMessage);
            socket.off(updateKey, handleUpdateMessage);
            console.log("[useChatSocket] Cleanup - removed listeners");
        }
    }, [queryClient, addKey, queryKey, socket, updateKey]);
}
