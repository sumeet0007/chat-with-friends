import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { FriendsSidebar } from "@/components/friends/friends-sidebar";

const FriendsLayout = async ({
    children
}: {
    children: React.ReactNode;
}) => {
    const user = await currentUser();

    if (!user) {
        return redirect("/sign-in");
    }

    return (
        <div className="h-full">
            <div className="lg:block! hidden h-full w-60 fixed inset-y-0 left-[72px] flex-col z-20">
                <FriendsSidebar />
            </div>
            <main className="h-full md:pl-60">
                {children}
            </main>
        </div>
    );
}

export default FriendsLayout;
