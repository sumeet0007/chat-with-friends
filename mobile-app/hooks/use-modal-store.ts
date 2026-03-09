import { create } from "zustand";

export type ModalType = 
    | "createServer" 
    | "invite" 
    | "editServer" 
    | "members" 
    | "createChannel" 
    | "leaveServer" 
    | "deleteServer" 
    | "deleteChannel" 
    | "editChannel" 
    | "messageFile" 
    | "deleteMessage" 
    | "chatTheme" 
    | "incomingCall";

interface ModalData {
    server?: any;
    channel?: any;
    channelType?: any;
    apiUrl?: string;
    query?: Record<string, any>;
    otherMember?: any;
}

interface ModalStore {
    type: ModalType | null;
    data: ModalData;
    isOpen: boolean;
    onOpen: (type: ModalType, data?: ModalData) => void;
    onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
    type: null,
    data: {},
    isOpen: false,
    onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
    onClose: () => set({ type: null, isOpen: false })
}));
