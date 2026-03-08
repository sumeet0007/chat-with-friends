"use client";

import { useNotifications, AppNotification } from "@/hooks/use-notification-store";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { X, MessageSquare, UserPlus, CheckCircle, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export const NotificationHandler = () => {
    const { notifications, removeNotification, requestBrowserPermission } = useNotifications();
    const { subscribeToPush } = usePushNotifications();

    useEffect(() => {
        requestBrowserPermission().then(() => {
            if (Notification.permission === "granted") {
                subscribeToPush();
            }
        });
    }, [requestBrowserPermission, subscribeToPush]);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-y-2 pointer-events-none">
            {notifications.map((notification) => (
                <Toast
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const Toast = ({ notification, onClose }: { notification: AppNotification, onClose: () => void }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const Icon = {
        message: MessageSquare,
        channel_message: Hash,
        friend_request: UserPlus,
        friend_accepted: CheckCircle,
    }[notification.type];

    const IconColor = {
        message: "text-indigo-500",
        channel_message: "text-zinc-500",
        friend_request: "text-emerald-500",
        friend_accepted: "text-white bg-emerald-500 p-0.5 rounded-full h-5 w-5",
    }[notification.type];

    return (
        <div
            className={`
                pointer-events-auto
                w-80 bg-white dark:bg-[#111214] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl 
                p-4 flex items-start gap-x-3 transition-all duration-300
                ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}
            `}
        >
            <div className="mt-1">
                <Icon className={IconColor} size={20} />
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                        {notification.title}
                    </span>
                    <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition">
                        <X size={14} />
                    </button>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-0.5">
                    {notification.description}
                </p>
                {notification.actionUrl && (
                    <Link
                        href={notification.actionUrl}
                        onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
                        className="text-xs text-indigo-500 hover:underline mt-2 font-semibold"
                    >
                        View Details
                    </Link>
                )}
            </div>
        </div>
    );
};
