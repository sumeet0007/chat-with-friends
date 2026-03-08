"use client";

import { useEffect, useState } from "react";

import { InviteModal } from "@/components/modals/invite-modal";
import { EditServerModal } from "@/components/modals/edit-server-modal";
import { DeleteMessageModal } from "@/components/modals/delete-message-modal";
import { MembersModal } from "@/components/modals/members-modal";
import { EditChannelModal } from "@/components/modals/edit-channel-modal";
import { DeleteChannelModal } from "@/components/modals/delete-channel-modal";
import { LeaveServerModal } from "@/components/modals/leave-server-modal";
import { DeleteServerModal } from "@/components/modals/delete-server-modal";
import { MessageFileModal } from "@/components/modals/message-file-modal";
import { ChatThemeModal } from "@/components/modals/chat-theme-modal";
import { IncomingCallModal } from "@/components/modals/incoming-call-modal";
import { CallHandler } from "@/components/call-handler";

interface ModalProviderProps {
    profileId?: string;
}

export const ModalProvider = ({
    profileId
}: ModalProviderProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <>
            {profileId && <CallHandler profileId={profileId} />}
            <InviteModal />
            <EditServerModal />
            <MembersModal />
            <EditChannelModal />
            <DeleteChannelModal />
            <LeaveServerModal />
            <DeleteServerModal />
            <MessageFileModal />
            <DeleteMessageModal />
            <ChatThemeModal />
            <IncomingCallModal />
        </>
    )
}
