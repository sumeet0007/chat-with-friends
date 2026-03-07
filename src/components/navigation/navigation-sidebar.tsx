import { redirect } from "next/navigation";
import { UserMenu } from "./user-menu";
import { ModeToggle } from "@/components/mode-toggle";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

import { NavigationAction } from "./navigation-action";
import { NavigationItem } from "./navigation-item";
import { NavigationFriends } from "./navigation-friends";

export const NavigationSidebar = async () => {
    const user = await currentUser();

    if (!user) {
        return redirect("/");
    }

    const profile = await db.profile.findUnique({
        where: {
            userId: user.id
        }
    })

    if (!profile) {
        return redirect("/");
    }

    const servers = await db.server.findMany({
        where: {
            name: {
                not: "GLOBAL_DMS_SERVER"
            },
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    });

    return (
        <div
            className="space-y-4 flex flex-col items-center h-full text-primary w-full bg-[#E3E5E8] dark:bg-[#1E1F22] py-3"
        >
            <NavigationFriends />
            <Separator
                className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto"
            />
            <NavigationAction />
            <Separator
                className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto"
            />
            <ScrollArea className="flex-1 w-full">
                {servers.map((server) => (
                    <div key={server.id}>
                        <NavigationItem
                            id={server.id}
                            name={server.name}
                            imageUrl={server.imageUrl}
                        />
                    </div>
                ))}
            </ScrollArea>
            <div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
                <ModeToggle />
                <UserMenu imageUrl={profile.imageUrl} />
            </div>
        </div>
    )
}
