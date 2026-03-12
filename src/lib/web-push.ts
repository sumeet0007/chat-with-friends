import webpush from "web-push";

webpush.setVapidDetails(
    (process.env.VAPID_SUBJECT as string)?.replace(/^"|"$/g, '').replace(/^'|'$/g, ''),
    (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string)?.replace(/^"|"$/g, '').replace(/^'|'$/g, ''),
    (process.env.VAPID_PRIVATE_KEY as string)?.replace(/^"|"$/g, '').replace(/^'|'$/g, '')
);

import { db } from "@/lib/db";

export const sendWebPushNotification = async (
    subscription: webpush.PushSubscription,
    payload: string
) => {
    try {
        await webpush.sendNotification(subscription, payload);
    } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 403) {
            console.log(`[WebPush] Subscription invalid/expired (Status: ${error.statusCode})`);
            try {
                await db.pushSubscription.delete({
                    where: {
                        endpoint: subscription.endpoint,
                    }
                });
            } catch (deleteError) {
                // Ignore delete errors for expired tokens
            }
        } else {
            console.error("Error sending web push notification:", error);
        }
    }
};
