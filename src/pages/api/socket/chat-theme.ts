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
        const { chatId, backgroundImage, backgroundColor } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!chatId) {
            return res.status(400).json({ error: "Chat ID missing" });
        }

        const profile = await db.profile.findUnique({
            where: {
                userId
            }
        });

        if (!profile) {
            return res.status(401).json({ error: "Profile not found" });
        }

        // Update or create the shared chat theme
        const theme = await (db as any).chatTheme.upsert({
            where: {
                chatId,
            },
            update: {
                backgroundImage,
                backgroundColor,
            },
            create: {
                chatId,
                backgroundImage,
                backgroundColor,
            }
        });

        const updateKey = `chat:${chatId}:theme:update`;
        res?.socket?.server?.io?.emit(updateKey, theme);

        // Send a system message to the chat
        const systemMessageContent = backgroundImage 
            ? `changed the chat wallpaper` 
            : `cleared the chat theme`;

        if (chatId.length === 24) { // Likely a MongoDB ID for channel or conversation
            // Check if it's a channel first
            const channel = await db.channel.findUnique({
                where: { id: chatId }
            });

            if (channel) {
                const member = await db.member.findFirst({
                    where: {
                        serverId: channel.serverId,
                        profileId: profile.id
                    }
                });

                if (member) {
                    const message = await db.message.create({
                        data: {
                            content: systemMessageContent,
                            channelId: chatId,
                            memberId: member.id,
                        },
                        include: {
                            member: {
                                include: {
                                    profile: true
                                }
                            }
                        }
                    });

                    const channelKey = `chat:${chatId}:messages`;
                    res?.socket?.server?.io?.emit(channelKey, message);
                }
            } else {
                // Check if it's a conversation
                const conversation = await db.conversation.findUnique({
                    where: { id: chatId },
                    include: {
                        memberOne: true,
                        memberTwo: true,
                    }
                });

                if (conversation) {
                    const member = conversation.memberOne.profileId === profile.id 
                        ? conversation.memberOne 
                        : conversation.memberTwo;

                    const message = await db.directMessage.create({
                        data: {
                            content: systemMessageContent,
                            conversationId: chatId,
                            memberId: member.id,
                        },
                        include: {
                            member: {
                                include: {
                                    profile: true
                                }
                            }
                        }
                    });

                    const chatKey = `chat:${chatId}:messages`;
                    res?.socket?.server?.io?.emit(chatKey, message);
                }
            }
        }

        return res.status(200).json(theme);
    } catch (error) {
        console.log("[CHAT_THEME_POST]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}
