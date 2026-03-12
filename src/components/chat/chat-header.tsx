"use client";

import { Hash, Palette } from "lucide-react";

import { SocketIndicator } from "@/components/socket-indicator";
import { UserAvatar } from "@/components/user-avatar";
import { MobileToggle } from "@/components/mobile-toggle";
import { ChatVideoButton } from "./chat-video-button";
import { useModal } from "@/hooks/use-modal-store";
import { useParams } from "next/navigation";
import { ActionTooltip } from "../action-tooltip";
import { PinnedMessagesBanner } from "@/components/pinned-messages-banner";

interface ChatHeaderProps {
    serverId: string;
    chatId: string;
    name: string;
    type: "channel" | "conversation";
    imageUrl?: string;
    children?: React.ReactNode;
}

export const ChatHeader = ({
    serverId,
    chatId,
    name,
    type,
    imageUrl,
    children
}: ChatHeaderProps) => {
    const { onOpen } = useModal();
    return (
        <>
            <div className="text-md font-semibold px-3 flex items-center h-12 border-neutral-200 dark:border-neutral-800 border-b-2">
                <MobileToggle>
                    {children}
                </MobileToggle>
                {type === "channel" && (
                    <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mr-2" />
                )}
                {type === "conversation" && (
                    <UserAvatar
                        src={imageUrl}
                        className="h-8 w-8 md:h-8 md:w-8 mr-2"
                    />
                )}
                <p className="font-semibold text-md text-black dark:text-white">
                    {name}
                </p>
                <div className="ml-auto flex items-center">
                    {type === "conversation" && (
                        <ChatVideoButton chatId={chatId} />
                    )}
                    <ActionTooltip label="Chat Theme" side="bottom">
                        <button
                            onClick={() => onOpen("chatTheme", { query: { chatId } })}
                            className="mr-4 hover:opacity-75 transition"
                        >
                            <Palette className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                        </button>
                    </ActionTooltip>
                    <SocketIndicator />
                </div>
            </div>
            <PinnedMessagesBanner 
                chatId={chatId}
                chatType={type}
                serverId={serverId}
            />
        </>
    )
}
