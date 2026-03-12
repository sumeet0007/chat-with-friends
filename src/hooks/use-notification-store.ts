import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

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
    requestBrowserPermission: () => Promise<void>;
}

const initialState = {
    notifications: [] as AppNotification[],
};

export const useNotifications = create<NotificationStore>()(subscribeWithSelector((set, get) => ({
    ...initialState,

    requestBrowserPermission: async () => {
        if ("Notification" in window) {
            await Notification.requestPermission();
        }
    },

    addNotification: (notification) => {
        const id = Math.random().toString();

        // Trigger browser notification if document is not visible/focused
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            if (document.hidden || !document.hasFocus()) {
                const browserNotification = new Notification(notification.title, {
                    body: notification.description,
                    icon: "/logo.png", // Assuming there is a logo
                });

                browserNotification.onclick = () => {
                    window.focus();
                    if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                    }
                };
            }
        }

        set((state) => ({
            notifications: [{ ...notification, id }, ...state.notifications]
        }));
    },

    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
    }))
})));

// Add server snapshot for SSR
if (typeof window === 'undefined') {
    useNotifications.getServerState = () => initialState;
}
