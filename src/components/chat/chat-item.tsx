"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Member, MemberRole, Profile } from "@prisma/client";
import { Edit, FileIcon, MessageSquare, ShieldAlert, ShieldCheck, Trash, Palette } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";

import { UserAvatar } from "@/components/user-avatar";
import { ActionTooltip } from "@/components/action-tooltip";
import { cn } from "@/lib/utils";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { useReplyStore } from "@/hooks/use-reply-store";

const formSchema = z.object({
    content: z.string().min(1),
});

interface ChatItemProps {
    id: string;
    content: string;
    member: Member & {
        profile: Profile;
    };
    timestamp: string;
    fileUrl: string | null;
    deleted: boolean;
    currentMember: Member;
    isUpdated: boolean;
    socketUrl: string;
    socketQuery: Record<string, string>;
    replyToId?: string | null;
    replyTo?: {
        content: string;
        member: Member & {
            profile: Profile;
        };
    } | null;
    hasTheme?: boolean;
};

const roleIconMap = {
    "GUEST": null,
    "MODERATOR": <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
    "ADMIN": <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
}

export const ChatItem = ({
    id,
    content,
    member,
    timestamp,
    fileUrl,
    deleted,
    currentMember,
    isUpdated,
    socketUrl,
    socketQuery,
    replyToId,
    replyTo,
    hasTheme
}: ChatItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const { onOpen } = useModal();
    const { setReply } = useReplyStore();
    const params = useParams();
    const router = useRouter();

    const onMemberClick = () => {
        if (member.id === currentMember.id) {
            return;
        }

        router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
    }

    useEffect(() => {
        const handleKeyDown = (event: any) => {
            if (event.key === "Escape" || event.keyCode === 27) {
                setIsEditing(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: content
        }
    });

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: `${socketUrl}/${id}`,
                query: socketQuery,
            });

            await axios.patch(url, values);

            form.reset();
            setIsEditing(false);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        form.reset({
            content: content,
        })
    }, [content, form]);

    const fileType = fileUrl?.split(".").pop();

    const isAdmin = currentMember.role === MemberRole.ADMIN;
    const isModerator = currentMember.role === MemberRole.MODERATOR;
    const isOwner = currentMember.id === member.id;
    const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
    const canEditMessage = !deleted && isOwner && !fileUrl;
    const isPDF = fileType === "pdf" && fileUrl;
    const isImage = !isPDF && fileUrl;

    const isSystemMessage = useMemo(() => {
        return content === "changed the chat wallpaper" || content === "cleared the chat theme";
    }, [content]);

    if (isSystemMessage) {
        return (
            <div className="flex items-center justify-center w-full my-4 px-4 opacity-80 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-x-2 bg-black/10 dark:bg-zinc-800/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-black/5 dark:border-white/5">
                    <Palette className="h-3.5 w-3.5 text-zinc-500" />
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        <span className="font-bold text-zinc-700 dark:text-zinc-200">
                            {isOwner ? "You" : member.profile.name}
                        </span>
                        {" "}{content}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "relative group flex items-center transition w-full",
            hasTheme ? "px-4 py-2" : "hover:bg-black/5 p-4"
        )}>
            <div className={cn(
                "group flex gap-x-2 items-start w-full transition-all duration-200",
                hasTheme && "bg-white/40 dark:bg-black/30 backdrop-blur-md p-3 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-white/50 dark:hover:bg-black/40"
            )}>
                <div onClick={onMemberClick} className="cursor-pointer hover:drop-shadow-md transition">
                    <UserAvatar src={member.profile.imageUrl} />
                </div>
                <div className="flex flex-col w-full">
                    {replyTo && (
                        <div className="flex items-center gap-x-2 ml-1 mb-1">
                            <div className="w-1 h-4 border-l-2 border-zinc-400 dark:border-zinc-500 rounded-bl-md ml-2" />
                            <div className="flex items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[80%]">
                                <UserAvatar src={replyTo.member.profile.imageUrl} className="h-4 w-4" />
                                <span className="font-semibold text-indigo-500 whitespace-nowrap">{replyTo.member.profile.name}</span>
                                <span className="italic truncate">{replyTo.content}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-x-2">
                        <div className="flex items-center">
                            <p onClick={onMemberClick} className="font-semibold text-sm hover:underline cursor-pointer">
                                {member.profile.name}
                            </p>
                            <ActionTooltip label={member.role}>
                                {roleIconMap[member.role]}
                            </ActionTooltip>
                        </div>
                        <span className={cn(
                            "text-xs text-zinc-500 dark:text-zinc-400",
                            hasTheme && "text-zinc-600 dark:text-zinc-400 font-medium"
                        )}>
                            {timestamp}
                        </span>
                    </div>
                    {isImage && (
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "relative rounded-md mt-2 overflow-hidden border flex items-center group/image transition-all",
                                fileUrl.includes("giphy.com") 
                                    ? "max-w-[350px] max-h-[350px] w-auto h-auto bg-transparent border-none" 
                                    : "max-w-[450px] max-h-[450px] w-auto h-auto bg-secondary/30 dark:bg-black/20"
                            )}
                        >
                            <img
                                src={fileUrl}
                                alt={content}
                                className="w-full h-full object-contain"
                            />
                        </a>
                    )}
                    {isPDF && (
                        <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
                            <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
                            >
                                PDF File
                            </a>
                        </div>
                    )}
                    {!fileUrl && !isEditing && (
                        <p className={cn(
                            "text-sm text-zinc-600 dark:text-zinc-300",
                            hasTheme && "text-zinc-800 dark:text-zinc-200 leading-relaxed",
                            deleted && "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
                        )}>
                            {content}
                            {isUpdated && !deleted && (
                                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400 opacity-70">
                                    (edited)
                                </span>
                            )}
                        </p>
                    )}
                    {!fileUrl && isEditing && (
                        <Form {...form}>
                            <form
                                className="flex items-center w-full gap-x-2 pt-2"
                                onSubmit={form.handleSubmit(onSubmit)}>
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <div className="relative w-full">
                                                    <Input
                                                        disabled={isLoading}
                                                        className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                                                        placeholder="Edited message"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button disabled={isLoading} size="sm" variant="default">
                                    Save
                                </Button>
                            </form>
                            <span className="text-[10px] mt-1 text-zinc-400">
                                Press escape to cancel, enter to save
                            </span>
                        </Form>
                    )}
                </div>
            </div>

            {!deleted && (
                <div className="flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <ActionTooltip label="Reply">
                        <MessageSquare
                            onClick={() => setReply({ id, name: member.profile.name, content })}
                            className="cursor-pointer text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 w-4 h-4 transition"
                        />
                    </ActionTooltip>

                    {canEditMessage && (
                        <ActionTooltip label="Edit">
                            <Edit
                                onClick={() => setIsEditing(true)}
                                className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                            />
                        </ActionTooltip>
                    )}

                    {canDeleteMessage && (
                        <ActionTooltip label="Delete">
                            <Trash
                                onClick={() => onOpen("deleteMessage", {
                                    apiUrl: `${socketUrl}/${id}`,
                                    query: socketQuery,
                                })}
                                className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                            />
                        </ActionTooltip>
                    )}
                </div>
            )
            }
        </div >
    )
}
