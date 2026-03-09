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

    useEffect(() => {
        if (!socket || !profileId) return;

        const callsKey = `user:${profileId}:calls`;

        socket.on(callsKey, (data: any) => {
            if (data.type === "incoming_call") {
                useModal.getState().onOpen("incomingCall", { query: data });
            } else if (data.type === "call_cancelled") {
                const state = useModal.getState();
                if (state.type === "incomingCall" && state.isOpen) {
                    state.onClose();
                }
            }
        });

        return () => {
            socket.off(callsKey);
        };
    }, [socket, profileId]);

    return null;
}
