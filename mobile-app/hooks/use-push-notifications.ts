import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { useAuth } from '@clerk/clerk-expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { api } from '@/lib/api';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;
if (!isExpoGo) {
  // Dynamically require to avoid crash in Expo Go SDK 53+
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const usePushNotifications = (isSignedIn: boolean | undefined) => {
  const { getToken } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<any>(undefined);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  async function registerForPushNotificationsAsync() {
    if (isExpoGo || !Notifications) {
      console.log('Push notifications are not supported in Expo Go.');
      return null;
    }

    let token;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        }
        console.log("Expo Push Token:", token);
      } catch (e: any) {
        console.log("Error getting token:", e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  useEffect(() => {
    if (isSignedIn) {
      registerForPushNotificationsAsync().then(async (token) => {
        if (token) {
           setExpoPushToken(token);
           // Send token to our backend with explicit auth
           const rawToken = await getToken();
           api.post(
               '/api/expo-push', 
               { token },
               { headers: { Authorization: `Bearer ${rawToken}` } }
           ).catch((err) => {
             console.log("Failed to register Expo Push Token remotely", err);
           });
        }
      });
    }

    if (!isExpoGo && Notifications) {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
        setNotification(notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log(response);
      });
    }

    return () => {
      if (!isExpoGo && Notifications) {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      }
    };
  }, [isSignedIn]);

  return {
    expoPushToken,
    notification,
  };
};
