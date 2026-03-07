import { create } from "zustand";

interface ReplyData {
    id: string;
    name: string;
    content: string;
}

interface ReplyStore {
    reply: ReplyData | null;
    setReply: (data: ReplyData | null) => void;
}

export const useReplyStore = create<ReplyStore>((set) => ({
    reply: null,
    setReply: (data) => set({ reply: data })
}));
