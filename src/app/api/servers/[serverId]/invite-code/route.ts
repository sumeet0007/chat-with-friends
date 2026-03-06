import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const user = await currentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { serverId } = await params;

        if (!serverId) {
            return new NextResponse("Server ID Missing", { status: 400 });
        }

        const server = await db.server.update({
            where: {
                id: serverId,
                profileId: user.id, // Only the owner can regenerate invite
            },
            data: {
                inviteCode: uuidv4(),
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.log("[SERVER_ID_INVITE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
