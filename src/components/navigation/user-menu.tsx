"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";

interface UserMenuProps {
    imageUrl: string;
}

export const UserMenu = ({ imageUrl }: UserMenuProps) => {
    const router = useRouter();
    const { signOut } = useClerk();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none hover:opacity-80 transition">
                <UserAvatar src={imageUrl} className="h-[48px] w-[48px] md:h-[48px] md:w-[48px] rounded-[24px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 bg-zinc-100 dark:bg-[#1E1F22] border-none shadow-[0_0_20px_rgba(0,0,0,0.2)] ml-2 pb-2 rounded-xl backdrop-blur-xl"
                align="start"
                side="right"
                sideOffset={15}
            >
                <div className="py-2 px-3 text-xs uppercase font-extrabold text-zinc-500 dark:text-zinc-400 mb-2 border-b border-zinc-200 dark:border-zinc-800">
                    My Profile
                </div>
                <DropdownMenuItem
                    onClick={() => router.push("/user-profile")}
                    className="cursor-pointer font-semibold p-3 text-sm text-zinc-700 dark:text-zinc-300 hover:text-white dark:hover:text-white focus:text-white dark:focus:text-white focus:bg-gradient-to-r focus:from-indigo-500 focus:to-cyan-500 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 transition-all rounded-lg mx-2 my-1"
                >
                    <Settings className="w-4 h-4 mr-3" />
                    Manage Account
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800 my-2" />

                <DropdownMenuItem
                    onClick={() => signOut({ redirectUrl: '/' })}
                    className="cursor-pointer font-semibold p-3 text-sm text-rose-500 hover:text-white focus:text-white hover:bg-rose-500 focus:bg-rose-500 transition-all rounded-lg mx-2"
                >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
