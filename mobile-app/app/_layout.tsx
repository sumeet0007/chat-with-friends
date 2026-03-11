import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useColorScheme } from '@/components/useColorScheme';
import { tokenCache } from '@/lib/token-cache';
import AuthMiddleware from '@/providers/auth-middleware';
import { TelemetryProvider } from '@/providers/telemetry-provider';
import { useAuth } from '@clerk/clerk-expo';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { SocketProvider } from '@/providers/socket-provider';

export {
  ErrorBoundary,
} from 'expo-router';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const queryClient = new QueryClient();

if (!publishableKey) {
  throw new Error('Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // No logging here to keep terminal clean

  // We'll proceed even if fonts aren't loaded to avoid black screen hangs
  // if (!loaded) {
  //   return null;
  // }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <AuthMiddleware>
            <SocketProvider>
              <TelemetryProvider>
                <RootLayoutNav />
              </TelemetryProvider>
            </SocketProvider>
          </AuthMiddleware>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isSignedIn } = useAuth();
  
  // Register push notifications when signed in
  usePushNotifications(isSignedIn);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
