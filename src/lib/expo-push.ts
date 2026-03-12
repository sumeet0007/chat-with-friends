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

    console.log(`[Push] Found ${tokens.length} tokens for profile ${profileId}`);

    if (tokens.length === 0) {
      console.log("[Push] ABORTING: No tokens found in database for this user.");
      return;
    }

    const messages: any[] = tokens.map((token: any) => ({
      to: token.token,
      title,
      body,
      data: data || {},
      sound: "default",
      priority: "high",
      channelId: "default",
      _displayInForeground: true, // For Expo notifications
    }));

    console.log("[Push] Sending payload to Expo:", JSON.stringify(messages, null, 2));

    // Send the messages in chunks of 100 via exponential backoff (simplified here)
    const expoPushEndpoint = "https://exp.host/--/api/v2/push/send";

    const response = await fetch(expoPushEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const responseData = await response.json();
    console.log("[Push] Expo Response:", JSON.stringify(responseData, null, 2));

  } catch (error) {
    console.error("[Push] FATAL ERROR sending notification:", error);
  }
};
