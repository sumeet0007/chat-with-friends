import { NextApiRequest } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextApiResponseServerIo } from "@/types";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { userId } = getAuth(req);
        const { requestId, action } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!requestId || !action) {
            return res.status(400).json({ error: "Invalid Request" });
        }

        const profile = await db.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.status(401).json({ error: "Profile not found" });
        }

        const request = await (db as any).friendRequest.findUnique({
            where: { id: requestId }
        });

        if (!request || request.receiverId !== profile.id) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (action === "accept") {
            const existingFriend = await (db as any).friend.findFirst({
                where: {
                    OR: [
                        { profileId: profile.id, friendId: request.senderId },
                        { profileId: request.senderId, friendId: profile.id }
                    ]
                }
            });

            if (!existingFriend) {
                await (db as any).friend.create({
                    data: { profileId: profile.id, friendId: request.senderId }
                });
                await (db as any).friend.create({
                    data: { profileId: request.senderId, friendId: profile.id }
                });

                // Socket: notify both users their friends list has changed
                const userKey1 = `user:${profile.id}:friends`;
                const userKey2 = `user:${request.senderId}:friends`;
                const notifKey1 = `user:${profile.id}:notifications`;
                const notifKey2 = `user:${request.senderId}:notifications`;
                
                res?.socket?.server?.io?.emit(userKey1, { action: "friend_added" });
                res?.socket?.server?.io?.emit(userKey2, { action: "friend_added" });
                res?.socket?.server?.io?.emit(notifKey1, { type: "friend_accepted", partnerName: request.sender.name });
                res?.socket?.server?.io?.emit(notifKey2, { type: "friend_accepted", partnerName: profile.name });
            }
        }

        await (db as any).friendRequest.delete({
            where: { id: requestId }
        });

        // Notify the receiver (me locally) to clear UI; 
        // Notify the sender (on another device) that their request was either accepted or rejected
        const myRequestsKey = `user:${profile.id}:requests`;
        const myNotifKey = `user:${profile.id}:notifications`;
        res?.socket?.server?.io?.emit(myRequestsKey, { action: "request_processed", requestId });
        res?.socket?.server?.io?.emit(myNotifKey, { type: "request_processed" });

        return res.status(200).json({ message: "Success" });

    } catch (error) {
        console.log("[FRIEND_RESPONSE_POST]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}
