import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { ServerSidebar } from "@/components/server/server-sidebar";

interface MemberIdPageProps {
    params: Promise<{
        memberId: string;
        serverId: string;
    }>
}

const MemberIdPage = async ({
    params
}: MemberIdPageProps) => {
    const profile = await currentProfile();
    const { memberId, serverId } = await params;

    if (!profile) {
        const { redirectToSignIn } = await auth();
        return redirectToSignIn();
    }

    const currentMember = await db.member.findFirst({
        where: {
            serverId,
            profileId: profile.id,
        },
        include: {
            profile: true,
        }
    });

    if (!currentMember) {
        return redirect("/");
    }

    const otherMember = await db.member.findFirst({
        where: {
            id: memberId,
            serverId,
        },
        include: {
            profile: true,
        }
    });

    if (!otherMember) {
        return redirect(`/servers/${serverId}`);
    }

    const conversation = await getOrCreateConversation(currentMember.id, otherMember.id);

    if (!conversation) {
        return redirect(`/servers/${serverId}`);
    }

    const { memberOne, memberTwo } = conversation;

    const isMemberOneCurrentUser = memberOne.profileId === profile.id;
    const conversationOtherMember = isMemberOneCurrentUser ? memberTwo : memberOne;

    return (
        <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
            <ChatHeader
                name={conversationOtherMember.profile.name}
                serverId={serverId}
                type="conversation"
                imageUrl={conversationOtherMember.profile.imageUrl}
            >
                <div className="w-[72px]">
                    <NavigationSidebar />
                </div>
                <div className="flex-1 bg-[#F2F3F5] dark:bg-[#2B2D31]">
                    <ServerSidebar serverId={serverId} />
                </div>
            </ChatHeader>
            <ChatMessages
                variant="conversation"
                member={currentMember}
                name={conversationOtherMember.profile.name}
                chatId={conversation.id}
                type="conversation"
                apiUrl="/api/direct-messages"
                paramKey="conversationId"
                paramValue={conversation.id}
                socketUrl="/api/socket/direct-messages"
                socketQuery={{
                    conversationId: conversation.id,
                }}
            />
            <ChatInput
                name={conversationOtherMember.profile.name}
                type="conversation"
                apiUrl="/api/socket/direct-messages"
                query={{
                    conversationId: conversation.id,
                }}
            />
        </div>
    )
}

export default MemberIdPage;
