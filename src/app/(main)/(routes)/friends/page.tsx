import { currentProfile } from "@/lib/current-profile";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FriendsComponent } from "@/components/friends-component";
import { MobileToggle } from "@/components/mobile-toggle";
import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { FriendsSidebar } from "@/components/friends/friends-sidebar";

const FriendsPage = async () => {
    const profile = await currentProfile();
    
    if (!profile) {
        return redirect("/");
    }

    const friends = await (db as any).friend.findMany({
        where: { profileId: profile.id },
        include: { friend: true }
    });

    const requests = await (db as any).friendRequest.findMany({
        where: { receiverId: profile.id },
        include: { sender: true }
    });

    return (
        <div className="bg-white dark:bg-[#313338] flex flex-col h-full w-full">
            <div className="h-12 border-neutral-200 dark:border-neutral-800 border-b-2 flex items-center px-4">
                <MobileToggle>
                    <div className="w-[72px]">
                        <NavigationSidebar />
                    </div>
                    <div className="flex-1 bg-[#F2F3F5] dark:bg-[#2B2D31]">
                        <FriendsSidebar />
                    </div>
                </MobileToggle>
                
                <h1 className="text-md font-semibold dark:text-white text-zinc-800 ml-2">Direct Messages</h1>
            </div>
            <FriendsComponent initialFriends={friends} initialRequests={requests} />
        </div>
    );
};

export default FriendsPage;
