import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const profile = await currentProfile();

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const dmServer = await db.server.findFirst({
            where: { name: "GLOBAL_DMS_SERVER" }
        });

        if (!dmServer) {
            return new NextResponse("DM Server not found", { status: 404 });
        }

        // Get members of the DM server (this is how we track DMs on web)
        const members = await db.member.findMany({
            where: {
                serverId: dmServer.id,
                profileId: {
                    not: profile.id
                }
            },
            include: {
                profile: true
            }
        });

        // Get friends
        const friends = await (db as any).friend.findMany({
            where: { profileId: profile.id },
            include: { friend: true }
        });

        // Get friend requests
        const requests = await (db as any).friendRequest.findMany({
            where: { receiverId: profile.id },
            include: { sender: true }
        });

        return NextResponse.json({
            members,
            friends,
            requests
        });
    } catch (error) {
        console.log("[FRIENDS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
