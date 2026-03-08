"use client";

import qs from "query-string";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Video, VideoOff } from "lucide-react";

import { ActionTooltip } from "@/components/action-tooltip";

import axios from "axios";

interface ChatVideoButtonProps {
    chatId?: string;
}

export const ChatVideoButton = ({
    chatId
}: ChatVideoButtonProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const isVideo = searchParams?.get("video");

    const onClick = async () => {
        if (!isVideo && chatId) {
            try {
                await axios.post("/api/socket/call", {
                    conversationId: chatId,
                    action: "invite"
                });
            } catch (error) {
                console.log(error);
            }
        }

        const url = qs.stringifyUrl({
            url: pathname || "",
            query: {
                video: isVideo ? undefined : true,
            }
        }, { skipNull: true });

        router.push(url);
    }

    const Icon = isVideo ? VideoOff : Video;
    const tooltipLabel = isVideo ? "End video call" : "Start video call";

    return (
        <ActionTooltip side="bottom" label={tooltipLabel}>
            <button onClick={onClick} className="hover:opacity-75 transition mr-4">
                <Icon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
            </button>
        </ActionTooltip>
    )
}
