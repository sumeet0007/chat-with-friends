"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/providers/socket-provider";
import { useNotifications } from "@/hooks/use-notification-store";

interface SocketRevalidatorProps {
    profileId: string;
}

export const SocketRevalidator = ({
    profileId
}: SocketRevalidatorProps) => {
    const { socket } = useSocket();
    const router = useRouter();
    const { addNotification } = useNotifications();

    useEffect(() => {
        if (!socket) return;

        // Listen for friends list changes
        const friendsKey = `user:${profileId}:friends`;
        const requestsKey = `user:${profileId}:requests`;
        const notificationsKey = `user:${profileId}:notifications`;

        socket.on(friendsKey, (data: any) => {
            console.log("Friends list changed, revalidating...");
            if (data?.action === "friend_added") {
                addNotification({
                    type: "friend_accepted",
                    title: "Friend Request Accepted",
                    description: "You are now friends!",
                    actionUrl: "/friends"
                });
            }
            router.refresh();
        });

        socket.on(requestsKey, (data: any) => {
            console.log("Requests changed, revalidating...");
            if (data?.id) { // New incoming request
                addNotification({
                    type: "friend_request",
                    title: "New Friend Request",
                    description: `${data.sender.name} sent you a friend request.`,
                    actionUrl: "/friends?tab=PENDING"
                });
            }
            router.refresh();
        });

        socket.on(notificationsKey, (data: any) => {
            if (data.type === "message") {
                addNotification({
                    type: "message",
                    title: `Message from ${data.senderName}`,
                    description: data.content,
                    actionUrl: `/friends/conversations/${data.conversationId}`
                });
            } else if (data.type === "channel_message") {
                addNotification({
                    type: "channel_message",
                    title: `#${data.channelName} in ${data.serverName}`,
                    description: `${data.senderName}: ${data.content}`,
                    actionUrl: `/servers/${data.serverId}/channels/${data.channelId}`
                });
            }
            router.refresh(); // Refresh to update unread counts/dots in sidebars
        });

        return () => {
            socket.off(friendsKey);
            socket.off(requestsKey);
            socket.off(notificationsKey);
        };
    }, [socket, profileId, router, addNotification]);

    return null;
}
