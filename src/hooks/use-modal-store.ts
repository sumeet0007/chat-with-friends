import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Channel, ChannelType, Member, Profile, Server } from "@prisma/client";

export type ModalType = "createServer" | "invite" | "editServer" | "members" | "createChannel" | "leaveServer" | "deleteServer" | "deleteChannel" | "editChannel" | "messageFile" | "deleteMessage" | "chatTheme" | "incomingCall";

interface ModalData {
    server?: Server & { members?: (Member & { profile: Profile })[] };
    channel?: Channel;
    channelType?: ChannelType;
    apiUrl?: string;
    query?: Record<string, any>;
    chatId?: string;
    chatType?: "channel" | "conversation";
    chatName?: string;
}

interface ModalStore {
    type: ModalType | null;
    data: ModalData;
    isOpen: boolean;
    onOpen: (type: ModalType, data?: ModalData) => void;
    onClose: () => void;
}

const initialState = {
    type: null as ModalType | null,
    data: {},
    isOpen: false,
};

export const useModal = create<ModalStore>()(subscribeWithSelector((set) => ({
    ...initialState,
    onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
    onClose: () => set({ type: null, isOpen: false })
})));

// Add server snapshot for SSR
if (typeof window === 'undefined') {
    useModal.getServerState = () => initialState;
}
