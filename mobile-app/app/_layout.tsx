import { registerGlobals } from '@livekit/react-native';

// Initialize LiveKit globals
registerGlobals();

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
import { IncomingCallOverlay } from '@/components/IncomingCallOverlay';

import { ErrorBoundaryProps } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

const callKeepOptions = {
  ios: {
    appName: 'PulseConnect',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
    imageName: 'phone_account_icon',
    additionalPermissions: [],
    selfManaged: true,
  },
};

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1E1F22' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={{ color: '#F23F42', fontSize: 24, fontWeight: 'bold', marginTop: 16, textAlign: 'center' }}>
            Fatal App Error
          </Text>
        </View>

        <View style={{ backgroundColor: '#111214', padding: 16, borderRadius: 12, marginBottom: 24 }}>
          <Text style={{ color: '#F23F42', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: 8 }}>
            {error.name}: {error.message}
          </Text>
        </View>

        <TouchableOpacity
          onPress={retry}
          style={{ backgroundColor: '#5865F2', padding: 16, borderRadius: 12, alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Tap to Retry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isSignedIn } = useAuth();

  usePushNotifications(isSignedIn);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <IncomingCallOverlay />
      </View>
    </ThemeProvider>
  );
}

function RootLayout() {
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

  useEffect(() => {
    if (Platform.OS !== 'web') {
        RNCallKeep.setup(callKeepOptions).then(accepted => {
            console.log('CallKeep Setup:', accepted);
        }).catch(err => {
            console.log('CallKeep Setup Error:', err);
        });
    }
  }, []);

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

export default RootLayout;
