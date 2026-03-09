import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ memberId: string }> }
) {
    try {
        const profile = await currentProfile();
        const { memberId } = await params;

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const dmServer = await db.server.findFirst({
            where: { name: "GLOBAL_DMS_SERVER" }
        });

        if (!dmServer) {
            return new NextResponse("DM Server not found", { status: 404 });
        }

        const currentMember = await db.member.findFirst({
            where: {
                serverId: dmServer.id,
                profileId: profile.id,
            },
            include: {
                profile: true,
            }
        });

        if (!currentMember) {
            return new NextResponse("Member not found", { status: 404 });
        }

        const otherMember = await db.member.findFirst({
            where: {
                id: memberId,
                serverId: dmServer.id,
            },
            include: {
                profile: true,
            }
        });

        if (!otherMember) {
            return new NextResponse("Other member not found", { status: 404 });
        }

        const conversation = await getOrCreateConversation(currentMember.id, otherMember.id);

        if (!conversation) {
            return new NextResponse("Conversation not found", { status: 404 });
        }

        return NextResponse.json({
            conversation,
            currentMember,
            otherMember
        });
    } catch (error) {
        console.log("[CONVERSATION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
