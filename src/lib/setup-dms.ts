import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";

export async function getOrCreateGlobalConversation(profileId1: string, profileId2: string) {
    // 1. Find or create the global DM server
    let dmServer = await db.server.findFirst({
        where: { name: "GLOBAL_DMS_SERVER" }
    });

    if (!dmServer) {
        dmServer = await db.server.create({
            data: {
                name: "GLOBAL_DMS_SERVER",
                imageUrl: "https://utfs.io/f/b2a7522d-4530-4e3e-bc5c-9d6759fc0add-1zbfv.png", // generic placeholder
                inviteCode: "GLOBAL_DMS_" + Date.now(),
                profileId: profileId1,
            }
        });
    }

    // 2. Find or create members for both profiles
    let member1 = await db.member.findFirst({
        where: { serverId: dmServer.id, profileId: profileId1 }
    });

    if (!member1) {
        member1 = await db.member.create({
            data: { serverId: dmServer.id, profileId: profileId1 }
        });
    }

    let member2 = await db.member.findFirst({
        where: { serverId: dmServer.id, profileId: profileId2 }
    });

    if (!member2) {
        member2 = await db.member.create({
            data: { serverId: dmServer.id, profileId: profileId2 }
        });
    }

    // 3. Create or get the conversation
    const conversation = await getOrCreateConversation(member1.id, member2.id);

    return {
        conversation,
        dmServerId: dmServer.id,
        memberOne: member1,
        memberTwo: member2
    };
}
