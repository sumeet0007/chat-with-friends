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
        const { conversationId, action, senderId, receiverId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!conversationId) {
            return res.status(400).json({ error: "Conversation ID missing" });
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

        const otherMember = conversation.memberOne.profileId === profile.id ? conversation.memberTwo : conversation.memberOne;
        const currentMember = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo;

        const notificationKey = `user:${otherMember.profileId}:calls`;

        if (action === "invite") {
            res?.socket?.server?.io?.emit(notificationKey, {
                type: "incoming_call",
                conversationId,
                serverId: currentMember.serverId,
                callerMemberId: currentMember.id,
                caller: {
                    id: profile.id,
                    name: profile.name,
                    imageUrl: profile.imageUrl,
                }
            });
        } else if (action === "cancel") {
            res?.socket?.server?.io?.emit(notificationKey, {
                type: "call_cancelled",
                conversationId,
            });
        } else if (action === "reject") {
            // Signal back to caller that call was rejected
            const callerNotificationKey = `user:${profile.id === conversation.memberOne.profileId ? conversation.memberTwo.profileId : conversation.memberOne.profileId}:calls`;
             res?.socket?.server?.io?.emit(callerNotificationKey, {
                type: "call_rejected",
                conversationId,
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.log("[CALL_SIGNALING_ERROR]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}
