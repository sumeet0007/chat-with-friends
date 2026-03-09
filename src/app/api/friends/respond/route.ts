import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const profile = await currentProfile();
        if (!profile) return new NextResponse("Unauthorized", { status: 401 });

        const { senderId, action } = await req.json();
        if (!senderId || !action) return new NextResponse("Missing fields", { status: 400 });

        // Find the friend request
        const request = await db.friendRequest.findFirst({
            where: {
                senderId,
                receiverId: profile.id
            }
        });

        if (!request) return new NextResponse("Request not found", { status: 404 });

        if (action === "accept") {
            // Create the friendship (both directions for easy querying)
            await Promise.all([
                db.friend.create({
                    data: { profileId: profile.id, friendId: senderId }
                }),
                db.friend.create({
                    data: { profileId: senderId, friendId: profile.id }
                })
            ]).catch(() => {
                // Ignore duplicate errors (friendship might already exist)
            });

            // Delete the request
            await db.friendRequest.delete({ where: { id: request.id } });

            return NextResponse.json({ message: "Friend request accepted" });
        } else if (action === "decline") {
            await db.friendRequest.delete({ where: { id: request.id } });
            return NextResponse.json({ message: "Friend request declined" });
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (error) {
        console.log("[FRIEND_RESPOND_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
