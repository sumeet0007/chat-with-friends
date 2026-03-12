"use client";

import * as z from "zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, SendHorizonal } from "lucide-react";
import qs from "query-string";
import { useRef, useEffect, useCallback, useMemo } from "react";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "@/components/emoji-picker";
import { GifPicker } from "@/components/gif-picker";

import { useReplyStore } from "@/hooks/use-reply-store";
import { useSocket } from "@/components/providers/socket-provider";
import { X } from "lucide-react";

interface ChatInputProps {
    apiUrl: string;
    query: Record<string, any>;
    name: string;
    type: "conversation" | "channel";
}

const formSchema = z.object({
    content: z.string().min(1),
});

export const ChatInput = ({
    apiUrl,
    query,
    name,
    type,
}: ChatInputProps) => {
    const { onOpen } = useModal();
    const { reply, setReply } = useReplyStore();
    const { socket } = useSocket();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Memoize chatId to prevent unnecessary re-renders
    const chatId = useMemo(() => query.channelId || query.conversationId, [query.channelId, query.conversationId]);



    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        }
    });

    const isLoading = form.formState.isSubmitting;

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        };
    }, []);

    const handleTyping = useCallback(() => {
        if (!socket) return;
        socket.emit("typing:start", { chatId, userName: name });
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing:stop", { chatId });
            typingTimeoutRef.current = null;
        }, 1000);
    }, [socket, chatId, name]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (socket && typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
                socket.emit("typing:stop", { chatId });
            }
            const url = qs.stringifyUrl({
                url: apiUrl,
                query,
            });

            const payload = {
                ...values,
                replyToId: reply?.id || undefined,
            };

            await axios.post(url, payload);
            form.reset();
            setReply(null);
        } catch (error) {
            console.log(error);
        }
    }

    const onGifSelect = async (url: string) => {
        try {
            const apiUrlWithQuery = qs.stringifyUrl({
                url: apiUrl,
                query,
            });

            await axios.post(apiUrlWithQuery, {
                content: "sent a GIF",
                fileUrl: url,
                replyToId: reply?.id || undefined,
            });

            setReply(null);
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="px-2 pb-4 md:px-4">
                                <div className="flex flex-col w-full bg-zinc-200/90 dark:bg-zinc-700/75 rounded-md overflow-hidden">
                                        {reply && (
                                            <div className="flex items-center gap-x-2 p-2 px-4 border-b-[1px] border-zinc-300 dark:border-zinc-600">
                                                <div className="flex-1 text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                                    Replying to <span className="font-semibold text-indigo-500">{reply.name}</span>: {reply.content}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setReply(null)}
                                                    className="text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center w-full min-h-[56px] px-3 gap-x-2">
                                            <button
                                                type="button"
                                                onClick={() => onOpen("messageFile", { apiUrl, query })}
                                                className="h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center shrink-0"
                                            >
                                                <Plus className="text-white dark:text-[#313338]" />
                                            </button>
                                            <Input
                                                autoFocus
                                                disabled={isLoading}
                                                className="flex-1 bg-transparent border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200 h-full py-4"
                                                placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    handleTyping();
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        form.handleSubmit(onSubmit)();
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center gap-x-2 shrink-0">
                                                <GifPicker
                                                    onChange={(url: string) => onGifSelect(url)}
                                                />
                                                <EmojiPicker
                                                    onChange={(emoji: string) => field.onChange(`${field.value}${emoji}`)}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isLoading || !field.value}
                                                    className="h-9 w-9 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 focus:bg-indigo-600 rounded-full text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    aria-label="Send message"
                                                >
                                                    <SendHorizonal className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}
