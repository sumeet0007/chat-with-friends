"use client";

import { useEffect, useState, useRef } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

interface MediaRoomProps {
    chatId: string;
    video: boolean;
    audio: boolean;
};

export const MediaRoom = ({
    chatId,
    video,
    audio
}: MediaRoomProps) => {
    const { user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [token, setToken] = useState("");
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (token && !startTimeRef.current) {
            startTimeRef.current = Date.now();
        }
    }, [token]);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes === 0) return `${remainingSeconds}s`;
        return `${minutes}m ${remainingSeconds}s`;
    };

    useEffect(() => {
        if (!user?.firstName || !user?.lastName) return;

        const name = `${user.firstName} ${user.lastName}`;

        (async () => {
            try {
                const resp = await fetch(`/api/livekit?room=${chatId}&username=${name}`);
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.log(e);
            }
        })()
    }, [user?.firstName, user?.lastName, chatId]);

    if (token === "") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <Loader2
                    className="h-7 w-7 text-zinc-500 animate-spin my-4"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loading...
                </p>
            </div>
        )
    }

    const handleDisconnect = async () => {
        if (startTimeRef.current) {
            const durationMs = Date.now() - startTimeRef.current;
            const duration = formatDuration(durationMs);
            
            try {
                await axios.post("/api/socket/call", {
                    conversationId: chatId,
                    action: "end",
                    duration
                });
            } catch (error) {
                console.log("Failed to log call end", error);
            }
        }
        router.push(pathname || "");
    }

    return (
        <LiveKitRoom
            video={video}
            audio={audio}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            data-lk-theme="default"
            connect={true}
            onDisconnected={handleDisconnect}
            className="flex-1 w-full bg-[#1E1F22]"
        >
            <VideoConference />
        </LiveKitRoom>
    )
}
