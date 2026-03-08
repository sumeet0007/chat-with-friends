"use client";

import { useEffect } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useModal } from "@/hooks/use-modal-store";

interface CallHandlerProps {
    profileId: string;
}

export const CallHandler = ({
    profileId
}: CallHandlerProps) => {
    const { socket } = useSocket();
    const { onOpen, onClose, type, isOpen } = useModal();

    useEffect(() => {
        if (!socket || !profileId) return;

        const callsKey = `user:${profileId}:calls`;

        socket.on(callsKey, (data: any) => {
            if (data.type === "incoming_call") {
                onOpen("incomingCall", { query: data });
            } else if (data.type === "call_cancelled") {
                if (type === "incomingCall" && isOpen) {
                    onClose();
                }
            }
        });

        return () => {
            socket.off(callsKey);
        };
    }, [socket, profileId, onOpen, onClose, type, isOpen]);

    return null;
}
