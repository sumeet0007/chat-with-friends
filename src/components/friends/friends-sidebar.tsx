import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users2 } from "lucide-react";
import Link from "next/link";
import { FriendsSidebarItem } from "./friends-sidebar-item";

export const FriendsSidebar = async () => {
    const profile = await currentProfile();

    if (!profile) {
        return redirect("/");
    }

    const dmServer = await db.server.findFirst({
        where: { name: "GLOBAL_DMS_SERVER" }
    });

    let conversations: any[] = [];

    if (dmServer) {
        conversations = await db.conversation.findMany({
            where: {
                OR: [
                    {
                        memberOne: {
                            profileId: profile.id,
                            serverId: dmServer.id,
                        }
                    },
                    {
                        memberTwo: {
                            profileId: profile.id,
                            serverId: dmServer.id,
                        }
                    }
                ]
            },
            include: {
                memberOne: {
                    include: {
                        profile: true
                    }
                },
                memberTwo: {
                    include: {
                        profile: true
                    }
                }
            }
        });
    }

    return (
        <div className="flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5] pt-3 px-2">
            <Link href="/friends" className="mb-4 block">
                <div className="flex items-center gap-x-3 w-full p-2 px-3 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition rounded-md font-medium text-md text-zinc-700 dark:text-zinc-200 bg-zinc-200/50 dark:bg-zinc-700/50 shadow-sm cursor-pointer">
                    <Users2 className="h-5 w-5" />
                    Friends
                </div>
            </Link>

            <div className="flex items-center text-xs font-semibold px-2 text-zinc-500 dark:text-zinc-400 mb-2 hover:text-zinc-600 dark:hover:text-zinc-300 transition">
                DIRECT MESSAGES
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-[2px]">
                    {conversations.map((conversation) => {
                        const memberOneIsMe = conversation.memberOne.profileId === profile.id;
                        const otherMember = memberOneIsMe ? conversation.memberTwo : conversation.memberOne;
                        
                        return (
                            <FriendsSidebarItem
                                key={conversation.id}
                                id={otherMember.id}
                                name={otherMember.profile.name}
                                imageUrl={otherMember.profile.imageUrl}
                            />
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
