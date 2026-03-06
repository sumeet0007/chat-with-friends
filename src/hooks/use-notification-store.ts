import { create } from "zustand";

export type NotificationType = "friend_request" | "friend_accepted" | "message" | "channel_message";

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    actionUrl?: string;
}

interface NotificationStore {
    notifications: AppNotification[];
    addNotification: (notification: Omit<AppNotification, "id">) => void;
    removeNotification: (id: string) => void;
}

export const useNotifications = create<NotificationStore>((set) => ({
    notifications: [],
    addNotification: (notification) => set((state) => ({
        notifications: [{ ...notification, id: Math.random().toString() }, ...state.notifications]
    })),
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
    }))
}));
