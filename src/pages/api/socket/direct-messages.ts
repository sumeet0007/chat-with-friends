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
        const { content, fileUrl } = req.body;
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
                conversationId: conversationId as string,
                memberId: member.id,
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    }
                }
            }
        });

        const channelKey = `chat:${conversationId}:messages`;

        res?.socket?.server?.io?.emit(channelKey, message);

        return res.status(200).json(message);
    } catch (error) {
        console.log("[DIRECT_MESSAGES_POST]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}
