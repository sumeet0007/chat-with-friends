import webpush from "web-push";

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string).replace(/^"|"$/g, '').replace(/^'|'$/g, ''),
    (process.env.VAPID_PRIVATE_KEY as string).replace(/^"|"$/g, '').replace(/^'|'$/g, '')
);

import { db } from "@/lib/db";

export const sendWebPushNotification = async (
    subscription: webpush.PushSubscription,
    payload: string
) => {
    try {
        await webpush.sendNotification(subscription, payload);
    } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log("Subscription has expired or is no longer valid. Deleting...");
            try {
                await db.pushSubscription.delete({
                    where: {
                        endpoint: subscription.endpoint,
                    }
                });
            } catch (deleteError) {
                console.error("Failed to delete expired subscription:", deleteError);
            }
        } else {
            console.error("Error sending web push notification:", error);
        }
    }
};
