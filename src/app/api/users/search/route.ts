import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const profile = await currentProfile();
        
        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json([]);
        }

        const users = await db.profile.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    },
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive'
                        }
                    }
                ],
                id: {
                    not: profile.id
                }
            },
            take: 10
        });

        // Add additional information like if they are already friends
        const profilesWithStatus = await Promise.all(users.map(async (u) => {
            const isFriend = await (db as any).friend.findFirst({
                where: {
                    OR: [
                        { profileId: profile.id, friendId: u.id },
                        { profileId: u.id, friendId: profile.id }
                    ]
                }
            });

            const hasSentRequest = await (db as any).friendRequest.findFirst({
                where: { senderId: profile.id, receiverId: u.id }
            });

            const hasReceivedRequest = await (db as any).friendRequest.findFirst({
                where: { senderId: u.id, receiverId: profile.id }
            });

            return {
                ...u,
                isFriend: !!isFriend,
                hasSentRequest: !!hasSentRequest,
                hasReceivedRequest: !!hasReceivedRequest
            }
        }));

        return NextResponse.json(profilesWithStatus);
    } catch (error) {
        console.log("[USERS_SEARCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
