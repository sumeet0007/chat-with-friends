"use client";

import { Users } from "lucide-react";
import { ActionTooltip } from "@/components/action-tooltip";
import { useRouter, usePathname } from "next/navigation";

export const NavigationFriends = () => {
    const router = useRouter();
    const pathname = usePathname();
    const isActive = pathname === "/friends";

    return (
        <div>
            <ActionTooltip
                side="right"
                align="center"
                label="Friends"
            >
                <button
                    onClick={() => router.push("/friends")}
                    className="group flex items-center justify-center h-[48px] w-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden bg-background dark:bg-neutral-700 group-hover:bg-indigo-500"
                    style={{
                        backgroundColor: isActive ? "#6366f1" : undefined,
                        borderRadius: isActive ? "16px" : undefined
                    }}
                >
                    <Users
                        className="group-hover:text-white transition text-indigo-500"
                        style={{ color: isActive ? "white" : undefined }}
                        size={25}
                    />
                </button>
            </ActionTooltip>
        </div>
    )
}
