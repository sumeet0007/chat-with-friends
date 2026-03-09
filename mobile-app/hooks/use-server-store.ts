import { create } from "zustand";

interface ServerState {
    servers: any[];
    activeServerId: string | null;
    activeChannelId: string | null;
    activeMemberId: string | null;
    setServers: (servers: any[]) => void;
    setActiveServerId: (id: string | null) => void;
    setActiveChannelId: (id: string | null) => void;
    setActiveMemberId: (id: string | null) => void;
}

export const useServerStore = create<ServerState>((set) => ({
    servers: [],
    activeServerId: null,
    activeChannelId: null,
    activeMemberId: null,
    setServers: (servers) => set({ servers }),
    setActiveServerId: (id) => set({ activeServerId: id }),
    setActiveChannelId: (id) => set({ activeChannelId: id }),
    setActiveMemberId: (id) => set({ activeMemberId: id }),
}));
