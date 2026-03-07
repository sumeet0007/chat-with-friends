import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

import { ChatHeader } from "@/components/chat/chat-header";
import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { ServerSidebar } from "@/components/server/server-sidebar";

interface ServerIdPageProps {
    params: Promise<{
        serverId: string;
    }>
}

const ServerIdPage = async ({ params }: ServerIdPageProps) => {
    const user = await currentUser();

    if (!user) {
        return redirect("/sign-in");
    }

    const { serverId } = await params;

    // Verify the user profile exists and is a member of this specific server
    const server = await db.server.findUnique({
        where: {
            id: serverId,
            members: {
                some: {
                    profile: {
                        userId: user.id
                    }
                }
            }
        },
        include: {
            channels: {
                orderBy: {
                    createdAt: "asc"
                }
            }
        }
    });

    if (!server) {
        return redirect("/");
    }

    // Prefer a "general" channel if it exists, otherwise fall back to the first channel
    const generalChannel = server.channels.find((channel) => channel.name === "general");
    const initialChannel = generalChannel ?? server.channels[0];

    if (!initialChannel) {
        // No channels exist yet for this server, so keep the user on a simple landing screen.
        return (
            <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
                <ChatHeader
                    name="Welcome"
                    serverId={server.id}
                    type="channel"
                >
                    <div className="w-[72px]">
                        <NavigationSidebar />
                    </div>
                    <div className="flex-1 bg-[#F2F3F5] dark:bg-[#2B2D31]">
                        <ServerSidebar serverId={server.id} />
                    </div>
                </ChatHeader>
                <div className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-[#313338] text-black dark:text-white pb-20">
                    <div className="flex flex-col text-center items-center justify-center">
                        <h1 className="text-3xl font-bold mb-4">Welcome to {server.name}!</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
                            This server doesn't have any channels yet.
                        </p>

                        <Link
                            href={`/servers/${server.id}/channels/create`}
                            className="flex items-center gap-2 bg-indigo-500 text-white hover:bg-indigo-600 font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Create your first channel
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return redirect(`/servers/${server.id}/channels/${initialChannel.id}`);
}

export default ServerIdPage;
