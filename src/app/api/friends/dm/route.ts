import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { getOrCreateGlobalConversation } from "@/lib/setup-dms";

export async function POST(req: Request) {
    try {
        const profile = await currentProfile();
        
        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { friendId } = await req.json();

        if (!friendId) {
            return new NextResponse("Friend ID missing", { status: 400 });
        }

        const { conversation, memberTwo, memberOne } = await getOrCreateGlobalConversation(profile.id, friendId);

        if (!conversation) {
            return new NextResponse("Failed to initiate direct message", { status: 500 });
        }

        // Return the OTHER member's ID relative to the current user!
        // We know memberTwo was created/queried for friendId
        return NextResponse.json({ 
            conversationId: conversation.id,
            memberId: memberTwo.profileId === friendId ? memberTwo.id : memberOne.id 
        });

    } catch (error) {
        console.log("[FRIEND_DM]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
