import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ReplyData {
    id: string;
    name: string;
    content: string;
}

interface ReplyStore {
    reply: ReplyData | null;
    setReply: (data: ReplyData | null) => void;
}

const initialState = {
    reply: null as ReplyData | null,
};

export const useReplyStore = create<ReplyStore>()(subscribeWithSelector((set) => ({
    ...initialState,
    setReply: (data) => set({ reply: data })
})));

// Add server snapshot for SSR
if (typeof window === 'undefined') {
    useReplyStore.getServerState = () => initialState;
}
