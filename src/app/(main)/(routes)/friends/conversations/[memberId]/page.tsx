import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { getOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { FriendsSidebar } from "@/components/friends/friends-sidebar";
import { MediaRoom } from "@/components/media-room";

interface MemberIdPageProps {
    params: Promise<{
        memberId: string;
    }>;
    searchParams: Promise<{
        video?: boolean;
    }>;
}

const MemberIdPage = async ({
    params,
    searchParams
}: MemberIdPageProps) => {
    const profile = await currentProfile();
    const { memberId } = await params;
    const resolvedSearchParams = await searchParams;

    if (!profile) {
        const { redirectToSignIn } = await auth();
        return redirectToSignIn();
    }

    const dmServer = await db.server.findFirst({
        where: { name: "GLOBAL_DMS_SERVER" }
    });

    if (!dmServer) {
        return redirect("/friends");
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
        return redirect("/friends");
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
        return redirect("/friends");
    }

    const conversation = await getOrCreateConversation(currentMember.id, otherMember.id);

    if (!conversation) {
        return redirect("/friends");
    }

    const { memberOne, memberTwo } = conversation;

    const isMemberOneCurrentUser = memberOne.profileId === profile.id;
    const conversationOtherMember = isMemberOneCurrentUser ? memberTwo : memberOne;

    return (
        <div className="bg-white dark:bg-[#313338] flex flex-col h-full w-full relative">
            <ChatHeader
                name={conversationOtherMember.profile.name}
                serverId={dmServer.id}
                type="conversation"
                imageUrl={conversationOtherMember.profile.imageUrl}
            >
                <div className="w-[72px]">
                    <NavigationSidebar />
                </div>
                <div className="flex-1 bg-[#F2F3F5] dark:bg-[#2B2D31]">
                    <FriendsSidebar />
                </div>
            </ChatHeader>
            {resolvedSearchParams.video && (
                <MediaRoom
                    chatId={conversation.id}
                    video={true}
                    audio={true}
                />
            )}
            {!resolvedSearchParams.video && (
                <>
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
                </>
            )}
        </div>
    );
}

export default MemberIdPage;
