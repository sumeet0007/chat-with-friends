import React, { createContext, useContext, useEffect } from "react";
import * as Device from "expo-device";
import * as Location from "expo-location";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { api } from "@/lib/api";

const TelemetryContext = createContext<any>(null);

export const TelemetryProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  
  const trackEvent = async (event: string, metadata?: any) => {
    if (!isSignedIn || !userId) return;

    try {
      let locationData = {};
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
          };
        }
      } catch (e) {
        // Ignore location errors during tracking
      }

      await api.post("/api/telemetry", {
        deviceId: Device.osInternalBuildId,
        deviceModel: Device.modelName,
        os: Device.osName,
        osVersion: Device.osVersion,
        event,
        metadata,
        ...locationData
      });
    } catch (error) {
      // Background tracking should fail silently for the user
      console.log("[TELEMETRY_ERROR]", (error as Error).message);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      trackEvent("APP_SESSION_START");
      
      // Request permissions implicitly if signed in (following 'monitor everything' request)
      const requestPermissions = async () => {
        try {
          const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
          if (locStatus === 'granted') {
            trackEvent("LOCATION_PERMISSION_GRANTED");
          }
        } catch (e) {
          console.log("[PERMISSION_REQUEST_ERROR]", (e as Error).message);
        }
      };

      requestPermissions();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <TelemetryContext.Provider value={{ trackEvent }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
