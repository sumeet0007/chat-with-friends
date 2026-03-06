import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { ServerSidebar } from "@/components/server/server-sidebar";

const ServerIdLayout = async ({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ serverId: string }>;
}) => {
    const user = await currentUser();

    if (!user) {
        return redirect("/sign-in");
    }

    const { serverId } = await params;

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
        }
    });

    if (!server) {
        return redirect("/");
    }

    return (
        <div className="h-full">
            <div className="hidden lg:flex h-full w-60 z-20 flex-col fixed inset-y-0 left-[72px]">
                <ServerSidebar serverId={serverId} />
            </div>
            <main className="h-full lg:pl-60">
                {children}
            </main>
        </div>
    );
}

export default ServerIdLayout;
