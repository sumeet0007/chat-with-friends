"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        setRegistration(reg);
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
          }
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!registration) {
      console.warn("No Service Worker registration found.");
      return;
    }

    let applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!applicationServerKey) {
      console.error("VAPID public key is missing from environment variables.");
      return;
    }

    applicationServerKey = applicationServerKey.replace(/^"|"$/g, '').replace(/^'|'$/g, '');

    try {
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
      });

      setSubscription(sub);
      setIsSubscribed(true);

      // Save to our database
      await axios.post("/api/web-push", { subscription: sub });
      console.log("Subscribed to web push notifications successfully!");
    } catch (error) {
      console.error("Failed to subscribe to push notifications. Check VAPID keys.", error);
    }
  };

  return { isSubscribed, subscribeToPush, subscription };
};
