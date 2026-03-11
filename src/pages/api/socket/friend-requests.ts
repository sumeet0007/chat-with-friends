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
        const { receiverId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!receiverId) {
            return res.status(400).json({ error: "Receiver ID missing" });
        }

        const profile = await db.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.status(401).json({ error: "Profile not found" });
        }

        if (receiverId === profile.id) {
            return res.status(400).json({ error: "Invalid User" });
        }

        // Check if already friends
        const existingFriend = await (db as any).friend.findFirst({
            where: {
                OR: [
                    { profileId: profile.id, friendId: receiverId },
                    { profileId: receiverId, friendId: profile.id }
                ]
            }
        });

        if (existingFriend) {
            return res.status(400).json({ error: "Already friends" });
        }

        // Check if request already sent or received
        const existingRequest = await (db as any).friendRequest.findFirst({
            where: {
                OR: [
                    { senderId: profile.id, receiverId: receiverId },
                    { senderId: receiverId, receiverId: profile.id }
                ]
            }
        });

        if (existingRequest) {
            if (existingRequest.senderId === receiverId) {
                // Auto-accept
                await (db as any).friend.create({
                    data: { profileId: profile.id, friendId: receiverId }
                });
                await (db as any).friend.create({
                    data: { profileId: receiverId, friendId: profile.id }
                });
                await (db as any).friendRequest.delete({
                    where: { id: existingRequest.id }
                });

                // Emit event to BOTH users
                const userKey1 = `user:${profile.id}:friends`;
                const userKey2 = `user:${receiverId}:friends`;
                res?.socket?.server?.io?.emit(userKey1, { action: "friend_added" });
                res?.socket?.server?.io?.emit(userKey2, { action: "friend_added" });

                return res.status(200).json({ message: "Friend added" });
            }
            return res.status(400).json({ error: "Request already pending" });
        }

        const newRequest = await (db as any).friendRequest.create({
            data: {
                senderId: profile.id,
                receiverId: receiverId
            },
            include: {
                sender: true
            }
        });

        // Emit socket event to the receiver
        const receiverKey = `user:${receiverId}:requests`;
        res?.socket?.server?.io?.emit(receiverKey, newRequest);

        // Trigger Expo Push Notification
        import("@/lib/expo-push").then(({ sendExpoPushNotification }) => {
            sendExpoPushNotification(
                receiverId,
                "New Friend Request",
                `${profile.name} sent you a friend request.`,
                { url: `/friends` }
            ).catch(err => console.error("Expo Push Error", err));
        }).catch(err => console.error("Failed to load expo-push", err));

        return res.status(200).json(newRequest);

    } catch (error) {
        console.log("[FRIEND_REQUEST_POST]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}
