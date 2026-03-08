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
        const { serverId, channelId } = req.query;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!serverId) {
            return res.status(400).json({ error: "Server ID missing" });
        }

        if (!channelId) {
            return res.status(400).json({ error: "Channel ID missing" });
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

        const server = await db.server.findFirst({
            where: {
                id: serverId as string,
                members: {
                    some: {
                        profileId: profile.id
                    }
                }
            },
            include: {
                members: true,
            }
        });

        if (!server) {
            return res.status(404).json({ message: "Server not found" });
        }

        const channel = await db.channel.findFirst({
            where: {
                id: channelId as string,
                serverId: serverId as string,
            }
        });

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" });
        }

        const member = server.members.find((member) => member.profileId === profile.id);

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        const message = await db.message.create({
            data: {
                content,
                fileUrl,
                replyToId: replyToId ? (replyToId as string) : null,
                channelId: channelId as string,
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

        const channelKey = `chat:${channelId}:messages`;
        res?.socket?.server?.io?.emit(channelKey, message);

        // Global notifications for other members
        server.members.forEach((m) => {
            if (m.profileId !== profile.id) {
                const notificationKey = `user:${m.profileId}:notifications`;
                res?.socket?.server?.io?.emit(notificationKey, {
                    type: "channel_message",
                    serverId,
                    channelId,
                    serverName: server.name,
                    channelName: channel.name,
                    senderName: profile.name,
                    content: content.length > 50 ? content.substring(0, 50) + "..." : content
                });
            }
        });

        // Trigger Web Push Notification
        try {
            const memberProfileIds = server.members
                .map(m => m.profileId)
                .filter(id => id !== profile.id);

            const pushSubscriptions = await db.pushSubscription.findMany({
                where: { profileId: { in: memberProfileIds } }
            });

            const sendPushPromises = pushSubscriptions.map((sub: any) => {
                const payload = JSON.stringify({
                    title: `New message in ${server.name} #${channel.name}`,
                    body: `${profile.name}: ${content.length > 50 ? content.substring(0, 50) + "..." : content}`,
                    url: `/servers/${serverId}/channels/${channelId}`
                });
                return import("@/lib/web-push").then(({ sendWebPushNotification }) => {
                    return sendWebPushNotification(sub as any, payload);
                });
            });

            await Promise.all(sendPushPromises);
        } catch (pushError) {
            console.error("Failed to send web push", pushError);
        }

        return res.status(200).json(message);
    } catch (error) {
        console.log("[MESSAGES_POST]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}
