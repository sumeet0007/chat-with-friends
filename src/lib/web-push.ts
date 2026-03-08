import webpush from "web-push";

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string).replace(/^"|"$/g, '').replace(/^'|'$/g, ''),
    (process.env.VAPID_PRIVATE_KEY as string).replace(/^"|"$/g, '').replace(/^'|'$/g, '')
);

export const sendWebPushNotification = async (
    subscription: webpush.PushSubscription,
    payload: string
) => {
    try {
        await webpush.sendNotification(subscription, payload);
    } catch (error) {
        console.error("Error sending web push notification:", error);
    }
};
