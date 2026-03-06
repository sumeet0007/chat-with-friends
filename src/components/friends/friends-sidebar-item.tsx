"use client";

import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

interface FriendsSidebarItemProps {
    id: string;
    name: string;
    imageUrl: string;
}

export const FriendsSidebarItem = ({
    id,
    name,
    imageUrl,
}: FriendsSidebarItemProps) => {
    const params = useParams();
    
    // Check if we are currently looking at this specific conversation
    const isActive = params?.memberId === id;

    return (
        <Link href={`/friends/conversations/${id}`}>
            <div className={cn(
                "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1 cursor-pointer",
                isActive && "bg-zinc-700/20 dark:bg-zinc-700"
            )}>
                <UserAvatar src={imageUrl} className="h-8 w-8 md:h-8 md:w-8" />
                <p className={cn(
                    "line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
                    isActive && "text-primary dark:text-zinc-200 dark:group-hover:text-white"
                )}>
                    {name}
                </p>
            </div>
        </Link>
    )
}
