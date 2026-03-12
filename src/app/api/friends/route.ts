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

        const currentMember = await db.member.findFirst({
            where: {
                serverId: dmServer.id,
                profileId: profile.id
            }
        });

        let activeMembers: any[] = [];

        if (currentMember) {
            const conversations = await db.conversation.findMany({
                where: {
                    OR: [
                        { memberOneId: currentMember.id },
                        { memberTwoId: currentMember.id }
                    ]
                },
                include: {
                    memberOne: { include: { profile: true } },
                    memberTwo: { include: { profile: true } },
                    directMessages: {
                        include: {
                            member: {
                                include: {
                                    profile: true
                                }
                            }
                        },
                        orderBy: { createdAt: "desc" },
                        take: 1
                    }
                }
            });

            activeMembers = conversations
                .filter(c => c.directMessages.length > 0)
                .map(c => {
                    const otherMember = c.memberOneId === currentMember.id ? c.memberTwo : c.memberOne;
                    return {
                        id: otherMember.id,
                        profile: otherMember.profile,
                        lastMessage: c.directMessages[0]?.content || null,
                        lastMessageDate: c.directMessages[0]?.createdAt || null,
                        lastMessageSenderProfileId: c.directMessages[0]?.member?.profileId || null,
                        conversationId: c.id
                    };
                })
                .sort((a, b) => {
                    const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
                    const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
                    return dateB - dateA;
                });
        }

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
            members: activeMembers,
            friends,
            requests
        });
    } catch (error) {
        console.log("[FRIENDS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
