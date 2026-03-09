import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const profile = await currentProfile();
        if (!profile) return new NextResponse("Unauthorized", { status: 401 });

        const { receiverId } = await req.json();
        if (!receiverId) return new NextResponse("Receiver ID is required", { status: 400 });

        // Check if already friends
        const existingFriend = await db.friend.findFirst({
            where: {
                OR: [
                    { profileId: profile.id, friendId: receiverId },
                    { profileId: receiverId, friendId: profile.id }
                ]
            }
        });
        if (existingFriend) return new NextResponse("Already friends", { status: 400 });

        // Check if request already sent
        const existingRequest = await db.friendRequest.findFirst({
            where: { senderId: profile.id, receiverId }
        });
        if (existingRequest) return new NextResponse("Request already sent", { status: 400 });

        const request = await db.friendRequest.create({
            data: {
                senderId: profile.id,
                receiverId
            }
        });

        return NextResponse.json(request);
    } catch (error) {
        console.log("[FRIEND_REQUEST_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
