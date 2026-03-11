import { NextApiRequest } from "next";
import { getAuth } from "@clerk/nextjs/server";

import { NextApiResponseServerIo } from "@/types";
import { db } from "@/lib/db";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { userId } = getAuth(req);
        const { content, fileUrl, replyToId } = req.body;
        const { conversationId } = req.query;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!conversationId) {
            return res.status(400).json({ error: "Conversation ID missing" });
        }

        if (!content) {
            return res.status(400).json({ error: "Content missing" });
        }

        const profile = await db.profile.findUnique({
            where: {
                userId
            }
        });

        if (!profile) {
            return res.status(401).json({ error: "Profile not found" });
        }

        const conversation = await db.conversation.findUnique({
            where: {
                id: conversationId as string,
                OR: [
                    {
                        memberOne: {
                            profileId: profile.id,
                        }
                    },
                    {
                        memberTwo: {
                            profileId: profile.id,
                        }
                    }
                ]
            },
            include: {
                memberOne: {
                    include: {
                        profile: true,
                    }
                },
                memberTwo: {
                    include: {
                        profile: true,
                    }
                }
            }
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const member = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo;

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        const message = await db.directMessage.create({
            data: {
                content,
                fileUrl,
                replyToId: replyToId ? (replyToId as string) : null,
                conversationId: conversationId as string,
                memberId: member.id,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    }
                },
                replyTo: {
                    include: {
                        member: {
                            include: {
                                profile: true,
                            }
                        }
                    }
                }
            }
        });

        console.log("[DIRECT_MESSAGES_SOCKET] Emitting message:", message.id, "to channel:", `chat:${conversationId}:messages`);
        
        const channelKey = `chat:${conversationId}:messages`;
        console.log(`[Socket] Emitting DM to key: ${channelKey}`);
        const emitted = res?.socket?.server?.io?.emit(channelKey, message);
        console.log(`[Socket] Emitted success: ${!!emitted}`);

        // Global notification for the recipient (using Clerk userId for the socket key)
        const otherMember = conversation.memberOne.profileId === profile.id ? conversation.memberTwo : conversation.memberOne;
        const notificationKey = `user:${otherMember.profile.userId}:notifications`;
        res?.socket?.server?.io?.emit(notificationKey, {
            type: "message",
            conversationId,
            senderName: profile.name,
            content: content.length > 50 ? content.substring(0, 50) + "..." : content
        });

        // Trigger Notifications in the background so it doesn't block message sending
        const sendNotifications = async () => {
            try {
                const pushSubscriptions = await db.pushSubscription.findMany({
                    where: { profileId: otherMember.profileId }
                });

                const sendPushPromises = pushSubscriptions.map((sub: any) => {
                    const payload = JSON.stringify({
                        title: `New message from ${profile.name}`,
                        body: content.length > 50 ? content.substring(0, 50) + "..." : content,
                        url: `/friends/conversations/${otherMember.id}`
                    });
                    return import("@/lib/web-push").then(({ sendWebPushNotification }) => {
                        const formattedSub = {
                            endpoint: sub.endpoint,
                            keys: {
                                auth: sub.auth,
                                p256dh: sub.p256dh
                            }
                        };
                        return sendWebPushNotification(formattedSub as any, payload);
                    });
                });

                Promise.all(sendPushPromises).catch(err => console.error("Push Error", err));
            } catch (pushError) {
                console.error("Failed to send web push", pushError);
            }

            // Trigger Expo Push Notification
            import("@/lib/expo-push").then(({ sendExpoPushNotification }) => {
                sendExpoPushNotification(
                    otherMember.profileId,
                    profile.name,
                    content.length > 50 ? content.substring(0, 50) + "..." : content,
                    { url: `/friends/conversations/${otherMember.id}` }
                ).catch(err => console.error("Expo Push Error", err));
            }).catch(err => console.error("Failed to load expo-push", err));
        };

        sendNotifications();

        return res.status(200).json(message);
    } catch (error) {
        console.log("[DIRECT_MESSAGES_POST]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}
