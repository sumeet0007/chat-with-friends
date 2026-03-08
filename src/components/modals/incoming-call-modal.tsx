"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/use-modal-store";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

export const IncomingCallModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const router = useRouter();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const isModalOpen = isOpen && type === "incomingCall";
    const { query } = data;
    const caller = query?.caller;
    const conversationId = query?.conversationId;

    useEffect(() => {
        if (isModalOpen) {
            // Optional: Start ringing sound
            // audioRef.current = new Audio("/sounds/ringtone.mp3");
            // audioRef.current.loop = true;
            // audioRef.current.play().catch(() => {});
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [isModalOpen]);

    const onAccept = () => {
        const serverId = query?.serverId;
        const callerMemberId = query?.callerMemberId;
        
        onClose();
        
        // We don't easily know the server name here, but we can check if it's the GLOBAL_DMS_SERVER by some logic or just try both.
        // Actually, let's just use a more generic approach or send the path in the socket event.
        // For now, let's assume if we have a serverId that isn't null, we can try to route.
        // A better way is to check the current URL or just provide a dedicated redirect route.
        
        // Simplified: most DMs are in GLOBAL_DMS_SERVER which routes to /friends/conversations
        // We'll need to know if this serverId is the GLOBAL one.
        // Let's just use the /servers path as it's more universal in this app's structure.
        router.push(`/servers/${serverId}/conversations/${callerMemberId}?video=true`);
    };

    const onDecline = () => {
        onClose();
    };

    if (!caller) return null;

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-[#313338] text-black dark:text-white p-0 overflow-hidden sm:max-w-md rounded-2xl mx-auto flex flex-col items-center justify-center py-10">
                <DialogHeader className="px-6 mb-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Incoming Call
                    </DialogTitle>
                </DialogHeader>
                
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" />
                    <UserAvatar 
                        src={caller.imageUrl} 
                        className="h-24 w-24 relative"
                    />
                </div>

                <h3 className="text-xl font-semibold mb-2">{caller.name}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8">is calling you...</p>

                <div className="flex gap-x-10">
                    <div className="flex flex-col items-center gap-y-2">
                        <Button
                            onClick={onDecline}
                            size="icon"
                            className="h-14 w-14 rounded-full bg-rose-500 hover:bg-rose-600 shadow-lg"
                        >
                            <PhoneOff className="h-6 w-6 text-white" />
                        </Button>
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Decline</span>
                    </div>

                    <div className="flex flex-col items-center gap-y-2">
                        <Button
                            onClick={onAccept}
                            size="icon"
                            className="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg"
                        >
                            <Phone className="h-6 w-6 text-white" />
                        </Button>
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Accept</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
