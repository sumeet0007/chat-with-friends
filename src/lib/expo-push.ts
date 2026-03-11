import { db } from "./db";

type ExpoPushMessage = {
  to: string;
  data?: object;
  title?: string;
  body?: string;
  sound?: string;
};

export const sendExpoPushNotification = async (
  profileId: string,
  title: string,
  body: string,
  data?: object
) => {
  try {
    const tokens = await db.expoPushToken.findMany({
      where: { profileId },
    });

    if (tokens.length === 0) return;

    const messages: any[] = tokens.map((token: any) => ({
      to: token.token,
      title,
      body,
      data: data || {},
      sound: "default",
      priority: "high",
      channelId: "default",
    }));

    // Send the messages in chunks of 100 via exponential backoff (simplified here)
    const expoPushEndpoint = "https://exp.host/--/api/v2/push/send";

    await fetch(expoPushEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};
