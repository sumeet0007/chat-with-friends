import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const profile = await currentProfile();
        
        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { requestId, action } = await req.json();

        if (!requestId || !action) {
            return new NextResponse("Invalid Request", { status: 400 });
        }

        const request = await (db as any).friendRequest.findUnique({
            where: { id: requestId }
        });

        if (!request || request.receiverId !== profile.id) {
            return new NextResponse("Request not found", { status: 404 });
        }

        if (action === "accept") {
            // Check if already friends
            const existingFriend = await (db as any).friend.findFirst({
                where: {
                    OR: [
                        { profileId: profile.id, friendId: request.senderId },
                        { profileId: request.senderId, friendId: profile.id }
                    ]
                }
            });

            if (!existingFriend) {
                // Create two friend records for easier querying
                await (db as any).friend.create({
                    data: {
                        profileId: profile.id,
                        friendId: request.senderId
                    }
                });
                await (db as any).friend.create({
                    data: {
                        profileId: request.senderId,
                        friendId: profile.id
                    }
                });
            }
        }

        // Delete the request regardless of whether it was accepted or rejected
        await (db as any).friendRequest.delete({
            where: { id: requestId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.log("[FRIEND_RESPOND]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
