import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const profile = await currentProfile();
        
        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { receiverId } = await req.json();

        if (!receiverId || receiverId === profile.id) {
            return new NextResponse("Invalid User", { status: 400 });
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
            return new NextResponse("Already friends", { status: 400 });
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
            // If they already sent you a request, accept it automatically
            if (existingRequest.senderId === receiverId) {
                await (db as any).friend.create({
                    data: {
                        profileId: profile.id,
                        friendId: receiverId
                    }
                });
                await (db as any).friend.create({
                    data: {
                        profileId: receiverId,
                        friendId: profile.id
                    }
                });
                await (db as any).friendRequest.delete({
                    where: { id: existingRequest.id }
                });
                return NextResponse.json({ message: "Friend added" });
            }
            return new NextResponse("Request already pending", { status: 400 });
        }

        const newRequest = await (db as any).friendRequest.create({
            data: {
                senderId: profile.id,
                receiverId: receiverId
            }
        });

        return NextResponse.json(newRequest);

    } catch (error) {
        console.log("[FRIEND_REQUEST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
