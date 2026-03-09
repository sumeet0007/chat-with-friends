"use client";

import { format } from "date-fns";
import { DirectMessage, Member, Message, Profile } from "@prisma/client";
import { Loader2, ServerCrash, ArrowDown } from "lucide-react";
import { Fragment, useRef, ElementRef, memo, useState, useEffect } from "react";
import axios from "axios";

import { useChatQuery } from "@/hooks/use-chat-query";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useSocket } from "@/components/providers/socket-provider";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { ChatWelcome } from "./chat-welcome";
import { ChatItem } from "./chat-item";

interface ChatMessagesProps {
    name: string;
    member: Member;
    chatId: string;
    apiUrl: string;
    socketUrl: string;
    socketQuery: Record<string, string>;
    paramKey: "channelId" | "conversationId";
    paramValue: string;
    type: "channel" | "conversation";
    variant?: "channel" | "conversation";
}

const DATE_FORMAT = "d MMM yyyy, HH:mm";

type MessageWithMemberWithProfile = (Message | DirectMessage) & {
    member: Member & {
        profile: Profile
    },
    replyToId?: string | null;
    replyTo?: (Message | DirectMessage) & {
        member: Member & {
            profile: Profile;
        };
    } | null;
}

interface ChatTheme {
    id: string;
    chatId: string;
    backgroundImage: string | null;
    backgroundColor: string | null;
    createdAt: string;
    updatedAt: string;
}

export const ChatMessages = memo(({
    name,
    member,
    chatId,
    apiUrl,
    socketUrl,
    socketQuery,
    paramKey,
    paramValue,
    type,
    variant,
}: ChatMessagesProps) => {
    const queryKey = `chat:${chatId}`;
    const addKey = `chat:${chatId}:messages`;
    const updateKey = `chat:${chatId}:messages:update`;

    const chatRef = useRef<ElementRef<"div">>(null);
    const bottomRef = useRef<ElementRef<"div">>(null);

    const [theme, setTheme] = useState<ChatTheme | null>(null);

    const { socket } = useSocket();

    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const response = await axios.get<ChatTheme>(`/api/chat-theme?chatId=${paramValue}`);
                setTheme(response.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchTheme();

        if (socket) {
            const themeKey = `chat:${paramValue}:theme:update`;
            const handleThemeUpdate = (updatedTheme: ChatTheme) => {
                setTheme(updatedTheme);
            };
            
            socket.on(themeKey, handleThemeUpdate);

            return () => {
                socket.off(themeKey, handleThemeUpdate);
            }
        }
    }, [paramValue, socket]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useChatQuery({
        queryKey,
        apiUrl,
        paramKey,
        paramValue,
    });

    useChatSocket({
        addKey,
        updateKey,
        queryKey
    });

    const { isAtBottom } = useChatScroll({
        chatRef,
        bottomRef,
        loadMore: fetchNextPage,
        shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
        count: data?.pages?.[0]?.items?.length ?? 0
    });

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    if (status === "pending") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loading messages...
                </p>
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <ServerCrash className="h-7 w-7 text-zinc-500 my-4" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Something went wrong!
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden h-full">
            {/* Theme Background Layer - Fixed behind content */}
            <div
                className="absolute inset-0 pointer-events-none bg-no-repeat bg-cover bg-center"
                style={{
                    backgroundColor: theme?.backgroundColor || undefined,
                    backgroundImage: theme?.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                    zIndex: 0
                }}
            />
            {theme?.backgroundImage && (
                <div className="absolute inset-0 bg-black/40 pointer-events-none" style={{ zIndex: 0 }} />
            )}

            <div
                ref={chatRef}
                className="flex-1 flex flex-col py-4 overflow-y-auto relative z-10"
            >
                {!hasNextPage && <div className="flex-1" />}
                {!hasNextPage && (
                    <ChatWelcome
                        type={type}
                        name={name}
                    />
                )}
                {hasNextPage && (
                    <div className="flex justify-center">
                        {isFetchingNextPage ? (
                            <Loader2 className="h-6 w-6 text-zinc-500 animate-spin my-4" />
                        ) : (
                            <button
                                onClick={() => fetchNextPage()}
                                className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 text-xs my-4 transition"
                            >
                                Load previous messages
                            </button>
                        )}
                    </div>
                )}
                <div className="flex flex-col-reverse mt-auto">
                    {data?.pages?.map((group, i) => (
                        <Fragment key={i}>
                            {group.items.map((message: MessageWithMemberWithProfile) => (
                                <ChatItem
                                    key={message.id}
                                    id={message.id}
                                    currentMember={member}
                                    member={message.member}
                                    content={message.content}
                                    fileUrl={message.fileUrl}
                                    replyToId={message.replyToId}
                                    replyTo={message.replyTo}
                                    deleted={message.deleted}
                                    timestamp={format(new Date(message.createdAt), DATE_FORMAT)}
                                    isUpdated={message.updatedAt !== message.createdAt}
                                    socketUrl={socketUrl}
                                    socketQuery={socketQuery}
                                    hasTheme={!!(theme?.backgroundColor || theme?.backgroundImage)}
                                />
                            ))}
                        </Fragment>
                    ))}
                </div>
                <div ref={bottomRef} />
            </div>

            {!isAtBottom && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-[80px] right-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-2 shadow-lg transition-all animate-bounce flex items-center justify-center z-[20]"
                >
                    <ArrowDown className="w-5 h-5" />
                </button>
            )}
        </div>
    );
});
